import { describe, expect, it } from 'vitest';
import { buildProposal } from '../src/domain/propose';
import { extractCriteria, adfToText } from '../src/domain/issue-text';
import { extractDecisionBlocks, hashText, normalizeText } from '../src/domain/text';
import { analyzeBlock, decisionForRegistration } from '../src/queue/engine';
import { applyApprovedProposal } from '../src/review/apply';
import { Repository } from '../src/storage/repository';
import { MemoryKv, idSequence } from './fakes';

/**
 * Real-site check against the owner-designated development site.
 *
 * Skipped unless DECISIONFUSE_LIVE=1 and credentials are present. It runs the
 * production engine, proposal builder and approval gate over live Confluence
 * and Jira REST content. It is not the Forge runtime: requests are made with
 * the owner's API token, not `asUser()`, so it proves the domain against real
 * data, not platform permission delegation.
 */
const LIVE = process.env.DECISIONFUSE_LIVE === '1' && Boolean(process.env.FORGE_EMAIL && process.env.FORGE_API_TOKEN);
const SITE = process.env.DECISIONFUSE_SITE ?? 'https://yablo.atlassian.net';
const SPACE_ID = process.env.DECISIONFUSE_SPACE_ID ?? '393220';
const PARENT_ID = process.env.DECISIONFUSE_PARENT_ID ?? '393332';

const headers = (): Record<string, string> => ({
  authorization: `Basic ${Buffer.from(`${process.env.FORGE_EMAIL}:${process.env.FORGE_API_TOKEN}`).toString('base64')}`,
  'content-type': 'application/json',
  accept: 'application/json',
});

async function api(path: string, init: { method?: string; body?: unknown } = {}): Promise<any> {
  const res = await fetch(`${SITE}${path}`, {
    method: init.method ?? 'GET',
    headers: headers(),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/** Mirrors src/services/confluence.ts: storage body to line-preserving plain text. */
function storageToText(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
}

function blockHtml(text: string, status = 'accepted'): string {
  return [
    `<p>BEGIN DECISION checkout-guest status=${status}</p>`,
    `<p>${text}</p>`,
    '<p>END DECISION</p>',
    '<p>Live engine check. Synthetic data, no customer content.</p>',
  ].join('');
}

async function readPage(pageId: string) {
  const page = await api(`/wiki/api/v2/pages/${pageId}?body-format=storage`);
  return { version: page.version.number as number, html: page.body.storage.value as string };
}

async function readIssue(issueKey: string) {
  const issue = await api(`/rest/api/3/issue/${issueKey}?fields=description,summary`);
  const description = adfToText(issue.fields.description);
  return {
    fingerprint: hashText(`${normalizeText(description)}|${issue.fields.summary ?? ''}`),
    criteria: extractCriteria(description),
  };
}

describe.skipIf(!LIVE)('live site integration', () => {
  it('runs register → rescan → propose → stale rejection against real content', async () => {
    const tenantId = SITE.replace(/^https?:\/\//, '');
    const repo = new Repository(new MemoryKv(), tenantId);
    let tick = 0;
    const now = () => new Date(Date.parse('2026-11-01T10:00:00.000Z') + tick++ * 60_000).toISOString();

    const title = `DecisionFuse live engine check ${Date.now()}`;
    const created = await api('/wiki/api/v2/pages', {
      method: 'POST',
      body: {
        spaceId: SPACE_ID,
        parentId: PARENT_ID,
        status: 'current',
        title,
        body: {
          representation: 'storage',
          value: blockHtml('Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.'),
        },
      },
    });
    const pageId: string = created.id;

    const v1 = await readPage(pageId);
    await repo.putDecision(
      decisionForRegistration({
        tenantId,
        pageId,
        blockId: 'checkout-guest',
        ownerAccountId: 'live-check',
        status: 'accepted',
        version: v1.version,
        text: extractDecisionBlocks(storageToText(v1.html))[0]?.body ?? '',
        now: now(),
      }),
    );
    for (const issueKey of ['DFS-1', 'DFS-2']) {
      await repo.putLink({
        tenantId,
        blockId: 'checkout-guest',
        issueKey,
        criterionId: 'ac-1',
        createdBy: 'live-check',
        acknowledgedTextHash: (await repo.getDecision('checkout-guest'))!.textHash,
      });
    }

    const baseDeps = {
      repo,
      fetchPage: async (id: string) => {
        const page = await readPage(id);
        return { version: page.version, text: storageToText(page.html) };
      },
      fetchIssue: readIssue,
      now,
      newId: idSequence('live'),
    };

    // 2. The accepted decision is withdrawn on the live page.
    const withdrawn = 'Guest checkout is no longer enabled for first-time buyers. Guest cart sessions expire after 60 minutes.';
    await api(`/wiki/api/v2/pages/${pageId}`, {
      method: 'PUT',
      body: {
        id: pageId,
        status: 'current',
        title,
        body: { representation: 'storage', value: blockHtml(withdrawn) },
        version: { number: v1.version + 1 },
      },
    });
    const v2 = await readPage(pageId);
    const analysis = await analyzeBlock(baseDeps, { tenantId, pageId, blockId: 'checkout-guest' });

    expect(v2.version).toBe(v1.version + 1);
    expect(analysis.status).toBe('analysed');
    expect(analysis.findings.map((f) => f.issueKey).sort()).toEqual(['DFS-1', 'DFS-2']);

    const dfs1 = analysis.findings.find((f) => f.issueKey === 'DFS-1')!;
    expect(dfs1.classification).toBe('obsolete-scope');
    expect(dfs1.sourceVersion).toBe(v2.version);
    expect(withdrawn).toContain(dfs1.sourceSpan.quote);

    // 3. The unlinked control never produces a finding.
    const control = await readIssue('DFS-3');
    expect(control.criteria[0].text).toContain('Order confirmation');
    expect(analysis.findings.some((f) => f.issueKey === 'DFS-3')).toBe(false);

    // 4. A proposal carries exact text derived from the real criterion.
    const issue1 = await readIssue('DFS-1');
    const decision = (await repo.getDecision('checkout-guest'))!;
    const built = buildProposal({
      finding: dfs1,
      decision,
      criterionText: issue1.criteria[0].text,
      now: now(),
      id: 'live-proposal-1',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.proposal.criterionId).toBe('ac-1');
    expect(built.proposal.issueKey).toBe('DFS-1');
    expect(built.proposal.sourceHash).toBe(decision.textHash);

    // 5. The page moves on again, so the approval bound to v2 must be refused.
    const rewritten = 'Guest checkout is no longer enabled for any buyer. Guest cart sessions expire after 60 minutes.';
    await api(`/wiki/api/v2/pages/${pageId}`, {
      method: 'PUT',
      body: {
        id: pageId,
        status: 'current',
        title,
        body: { representation: 'storage', value: blockHtml(rewritten) },
        version: { number: v2.version + 1 },
      },
    });

    let writes = 0;
    const perms = await api('/rest/api/3/mypermissions?issueKey=DFS-1&permissions=EDIT_ISSUES');
    const outcome = await applyApprovedProposal(
      {
        repo,
        fetchSourceHash: async () => {
          const page = await readPage(pageId);
          const block = extractDecisionBlocks(storageToText(page.html)).find((b) => b.id === 'checkout-guest');
          return hashText(normalizeText(block?.body ?? ''));
        },
        fetchIssueFingerprint: async (key: string) => (await readIssue(key)).fingerprint,
        canEditIssue: async () => perms.permissions.EDIT_ISSUES.havePermission === true,
        findMarkerComment: async () => null,
        postComment: async () => {
          writes++;
          throw new Error('live check must not write');
        },
        now,
        newId: idSequence('live-op'),
      },
      { finding: dfs1, proposal: built.proposal, approverAccountId: 'live-check' },
    );

    expect(perms.permissions.EDIT_ISSUES.havePermission).toBe(true);
    expect(outcome.status).toBe('rejected');
    if (outcome.status !== 'rejected') return;
    expect(outcome.reason).toBe('stale-source');
    expect(writes).toBe(0);

    const audit = await repo.listAudit();
    expect(audit.at(-1)?.action).toBe('approval-rejected');

    const comments = await api('/rest/api/3/issue/DFS-1/comment?maxResults=100');
    const markers = (comments.comments ?? []).filter((c: any) => JSON.stringify(c).includes('decisionfuse-proposal'));
    expect(markers).toHaveLength(0);

    console.log(
      JSON.stringify(
        {
          site: tenantId,
          pageId,
          versions: { baseline: v1.version, changed: v2.version, staleAfter: v2.version + 1 },
          findings: analysis.findings.map((f) => ({
            issueKey: f.issueKey,
            criterionId: f.criterionId,
            classification: f.classification,
            confidence: f.confidence,
            sourceVersion: f.sourceVersion,
            quote: f.sourceSpan.quote,
          })),
          proposal: { operation: built.proposal.operation, exactText: built.proposal.exactText },
          approval: { status: outcome.status, reason: outcome.reason, writes },
          auditTail: audit.at(-1),
        },
        null,
        2,
      ),
    );
  }, 180_000);
});
