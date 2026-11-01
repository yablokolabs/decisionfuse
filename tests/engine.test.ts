import { describe, expect, it } from 'vitest';
import { analyzeBlock, decisionForRegistration } from '../src/queue/engine';
import { EvidenceError } from '../src/domain/evidence';
import { Repository } from '../src/storage/repository';
import { MemoryKv, fixedClock, idSequence } from './fakes';

const decisionText = 'Guest checkout is accepted.\nPayment must not require an account.';
const issue = {
  fingerprint: 'fp-issue-1',
  criteria: [{ id: 'ac-1', text: 'Guest checkout must work without an account.' }],
};

function setup(tenantId = 'tenant-a') {
  const kv = new MemoryKv();
  const repo = new Repository(kv, tenantId);
  const clock = fixedClock();
  return { kv, repo, clock, tenantId };
}

async function register(repo: Repository, tenantId: string, text: string) {
  await repo.putDecision(
    decisionForRegistration({
      tenantId,
      pageId: 'page-1',
      blockId: 'checkout-guest',
      ownerAccountId: 'acc-owner',
      status: 'accepted',
      version: 7,
      text,
      now: '2026-11-01T09:00:00.000Z',
    }),
  );
  await repo.putLink({
    tenantId,
    blockId: 'checkout-guest',
    issueKey: 'OPS-12',
    criterionId: 'ac-1',
    createdBy: 'acc-owner',
    acknowledgedTextHash: 'hash-v7',
  });
}

describe('analysis engine', () => {
  it('captures a baseline instead of reporting drift on first run', async () => {
    const { repo, clock, tenantId } = setup();
    await repo.putDecision({ ...(await buildDraft(repo)), textHash: '', baselineVersion: 0 });
    const outcome = await analyzeBlock(
      {
        repo,
        fetchPage: async () => ({ version: 7, text: pageWith(decisionText) }),
        fetchIssue: async () => issue,
        now: clock,
        newId: idSequence('f'),
      },
      { tenantId, pageId: 'page-1', blockId: 'checkout-guest' },
    );
    expect(outcome.status).toBe('baseline-captured');
    expect(outcome.findings).toHaveLength(0);
  });

  it('reports a finding with resolving evidence when the decision is withdrawn', async () => {
    const { repo, clock, tenantId } = setup();
    await register(repo, tenantId, decisionText);
    const outcome = await analyzeBlock(
      {
        repo,
        fetchPage: async () => ({ version: 8, text: pageWith('Guest checkout is no longer accepted.') }),
        fetchIssue: async () => issue,
        now: clock,
        newId: idSequence('f'),
      },
      { tenantId, pageId: 'page-1', blockId: 'checkout-guest' },
    );
    expect(outcome.status).toBe('analysed');
    const finding = outcome.findings[0];
    expect(finding.classification).toBe('obsolete-scope');
    expect(finding.sourceVersion).toBe(8);
    expect(finding.sourceSpan.quote.length).toBeGreaterThan(0);
  });

  it('does not duplicate findings when the same event is replayed', async () => {
    const { repo, clock, tenantId } = setup();
    await register(repo, tenantId, decisionText);
    const deps = {
      repo,
      fetchPage: async () => ({ version: 8, text: pageWith('Guest checkout is no longer accepted.') }),
      fetchIssue: async () => issue,
      now: clock,
      newId: idSequence('f'),
    };
    const before = (await repo.getDecision('checkout-guest'))!;
    const first = await analyzeBlock(deps, { tenantId, pageId: 'page-1', blockId: 'checkout-guest' });
    expect(first.findings).toHaveLength(1);
    // Restore the acknowledged baseline to simulate an out-of-order replay of the same change.
    await repo.putDecision(before);
    const replay = await analyzeBlock(deps, { tenantId, pageId: 'page-1', blockId: 'checkout-guest' });
    expect(replay.findings).toHaveLength(1);
    const all = await repo.listFindings('checkout-guest');
    expect(new Set(all.map((f) => f.dedupeKey)).size).toBe(all.length);
  });

  it('reports nothing for a formatting-only page update', async () => {
    const { repo, clock, tenantId } = setup();
    await register(repo, tenantId, decisionText);
    const outcome = await analyzeBlock(
      {
        repo,
        fetchPage: async () => ({ version: 8, text: pageWith('Guest   checkout is accepted.\nPayment must not require an account.') }),
        fetchIssue: async () => issue,
        now: clock,
        newId: idSequence('f'),
      },
      { tenantId, pageId: 'page-1', blockId: 'checkout-guest' },
    );
    expect(outcome.status).toBe('unchanged');
    expect(outcome.findings).toHaveLength(0);
  });

  it('treats a removed block as unavailable rather than resolved', async () => {
    const { repo, clock, tenantId } = setup();
    await register(repo, tenantId, decisionText);
    const outcome = await analyzeBlock(
      {
        repo,
        fetchPage: async () => ({ version: 9, text: 'The decision section was deleted.' }),
        fetchIssue: async () => issue,
        now: clock,
        newId: idSequence('f'),
      },
      { tenantId, pageId: 'page-1', blockId: 'checkout-guest' },
    );
    expect(outcome.status).toBe('source-unavailable');
    expect(outcome.findings).toHaveLength(0);
  });

  it('does not act on a draft block', async () => {
    const { repo, clock, tenantId } = setup();
    await register(repo, tenantId, decisionText);
    const outcome = await analyzeBlock(
      {
        repo,
        fetchPage: async () => ({ version: 8, text: pageWith('Guest checkout is no longer accepted.', 'draft') }),
        fetchIssue: async () => issue,
        now: clock,
        newId: idSequence('f'),
      },
      { tenantId, pageId: 'page-1', blockId: 'checkout-guest' },
    );
    expect(outcome.status).toBe('not-accepted');
    expect(outcome.findings).toHaveLength(0);
  });

  it('rejects a finding whose criterion span does not resolve', async () => {
    const { repo, clock, tenantId } = setup();
    await register(repo, tenantId, decisionText);
    await expect(
      analyzeBlock(
        {
          repo,
          fetchPage: async () => ({ version: 8, text: pageWith('Guest checkout is no longer accepted.') }),
          fetchIssue: async () => ({ fingerprint: 'fp-2', criteria: [{ id: 'ac-1', text: '' }] }),
          now: clock,
          newId: idSequence('f'),
        },
        { tenantId, pageId: 'page-1', blockId: 'checkout-guest' },
      ),
    ).rejects.toBeInstanceOf(EvidenceError);
  });
});

describe('tenant partitioning', () => {
  it('keeps two sites isolated and refuses a cross-tenant write', async () => {
    const kv = new MemoryKv();
    const a = new Repository(kv, 'tenant-a');
    const b = new Repository(kv, 'tenant-b');
    await register(a, 'tenant-a', decisionText);

    expect(await b.getDecision('checkout-guest')).toBeNull();
    expect(await a.getDecision('checkout-guest')).not.toBeNull();

    await expect(
      b.putDecision({ ...(await a.getDecision('checkout-guest'))!, tenantId: 'tenant-a' }),
    ).rejects.toThrow(/Tenant mismatch/);
  });
});

function pageWith(body: string, status = 'accepted') {
  return `Notes.\n\nBEGIN DECISION checkout-guest status=${status}\n${body}\nEND DECISION\n`;
}

async function buildDraft(repo: Repository) {
  const existing = await repo.getDecision('checkout-guest');
  if (existing) return existing;
  return decisionForRegistration({
    tenantId: 'tenant-a',
    pageId: 'page-1',
    blockId: 'checkout-guest',
    ownerAccountId: 'acc-owner',
    status: 'accepted',
    version: 7,
    text: decisionText,
    now: '2026-11-01T09:00:00.000Z',
  });
}
