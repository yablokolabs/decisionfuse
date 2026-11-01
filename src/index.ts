import Resolver from '@forge/resolver';
import { getProposal, inspectDecisionChange, listAffectedWork, INSTALLATION_SCOPE } from './actions/tools';
import { extractDecisionBlocks, hashText, normalizeText } from './domain/text';
import type { Finding, Proposal } from './domain/types';
import { analyzeBlock, decisionForRegistration } from './queue/engine';
import { applyApprovedProposal } from './review/apply';
import { canEditIssue, fetchIssueSnapshot, findMarkerComment, postComment } from './services/jira';
import { fetchPageText } from './services/confluence';
import { forgeKv } from './storage/forge-kv';
import { Repository } from './storage/repository';

const resolver = new Resolver();

interface Context {
  tenantId: string;
  accountId: string;
}

function context(req: { context: Record<string, any> }): Context {
  const tenantId: string = req.context.cloudId ?? req.context.siteUrl ?? 'unknown-tenant';
  const accountId: string = req.context.accountId ?? 'unknown-account';
  return { tenantId, accountId };
}

function repoFor(tenantId: string) {
  return new Repository(forgeKv, tenantId);
}

function newId(): string {
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

resolver.define('registerDecision', async (req) => {
  const { tenantId, accountId } = context(req);
  const { pageId, blockId, status } = req.payload as { pageId: string; blockId: string; status: 'draft' | 'accepted' | 'superseded' };
  const page = await fetchPageText(pageId);
  const block = page.blocks.find((b) => b.id === blockId);
  if (!block) throw new Error(`Decision block ${blockId} not found on page ${pageId}`);
  const decision = decisionForRegistration({
    tenantId,
    pageId,
    blockId,
    ownerAccountId: accountId,
    status,
    version: page.version,
    text: block.body,
    now: new Date().toISOString(),
  });
  await repoFor(tenantId).putDecision(decision);
  return { blockId: decision.blockId, status: decision.status, baselineVersion: decision.baselineVersion };
});

resolver.define('linkIssue', async (req) => {
  const { tenantId, accountId } = context(req);
  const { blockId, issueKey, criterionId } = req.payload as { blockId: string; issueKey: string; criterionId: string };
  const repo = repoFor(tenantId);
  const decision = await repo.getDecision(blockId);
  if (!decision) throw new Error(`Register decision ${blockId} before linking work`);
  await repo.putLink({
    tenantId,
    blockId,
    issueKey,
    criterionId,
    createdBy: accountId,
    acknowledgedTextHash: decision.textHash,
  });
  return { blockId, issueKey, criterionId };
});

resolver.define('rescan', async (req) => {
  const { tenantId } = context(req);
  const { pageId, blockId } = req.payload as { pageId: string; blockId: string };
  const outcome = await analyzeBlock(
    {
      repo: repoFor(tenantId),
      fetchPage: async (id) => {
        const page = await fetchPageText(id);
        return { version: page.version, text: page.text };
      },
      fetchIssue: fetchIssueSnapshot,
      now: () => new Date().toISOString(),
      newId,
    },
    { tenantId, pageId, blockId },
  );
  return { status: outcome.status, findings: outcome.findings.length };
});

resolver.define('context', async (req) => {
  const { accountId } = context(req);
  const issueKey = (req.context.extension as { issue?: { key?: string } } | undefined)?.issue?.key ?? '';
  return { accountId, issueKey };
});

resolver.define('issueFindings', async (req) => {
  const { tenantId } = context(req);
  const { issueKey } = req.payload as { issueKey: string };
  const repo = repoFor(tenantId);
  const decisions = await repo.listDecisions();
  const results: Finding[] = [];
  for (const decision of decisions) {
    const links = await repo.linksForBlock(decision.blockId);
    if (!links.some((l) => l.issueKey === issueKey)) continue;
    const findings = await repo.listFindings(decision.blockId);
    results.push(...findings.filter((f) => f.issueKey === issueKey && f.lifecycle === 'needs-review'));
  }
  return results;
});

resolver.define('listFindings', async (req) => {
  const { tenantId } = context(req);
  const { blockId, issueKey } = req.payload as { blockId: string; issueKey?: string };
  const findings = await repoFor(tenantId).listFindings(blockId);
  return issueKey ? findings.filter((f) => f.issueKey === issueKey) : findings;
});

resolver.define('dismissFinding', async (req) => {
  const { tenantId, accountId } = context(req);
  const { blockId, dedupe, reason } = req.payload as { blockId: string; dedupe: string; reason: string };
  const repo = repoFor(tenantId);
  const finding = await repo.findFinding(dedupe, blockId);
  if (!finding) throw new Error('Unknown finding');
  await repo.putFinding({ ...finding, lifecycle: 'dismissed' });
  await repo.appendAudit({
    operationId: newId(),
    tenantId,
    blockId,
    issueKey: finding.issueKey,
    action: 'analysis',
    actor: accountId,
    beforeFingerprint: finding.issueFingerprint,
    afterFingerprint: finding.issueFingerprint,
    sourceVersion: finding.sourceVersion,
    remoteResult: `dismissed: ${reason}`,
    status: 'ok',
    at: new Date().toISOString(),
  });
  return { dismissed: true };
});

resolver.define('approveAndApply', async (req) => {
  const { tenantId, accountId } = context(req);
  const { proposalId } = req.payload as { proposalId: string };
  const repo = repoFor(tenantId);
  const proposal = await repo.getProposal(proposalId);
  if (!proposal) throw new Error('Unknown proposal');
  const decision = await repo.getDecision(proposal.findingId.startsWith('block:') ? proposal.findingId.slice(6) : '');
  if (!decision) throw new Error('Unknown decision for proposal');
  const findings = await repo.listFindings(decision.blockId);
  const finding = findings.find((f) => f.id === proposal.findingId);
  if (!finding) throw new Error('Unknown finding for proposal');

  const outcome = await applyApprovedProposal(
    {
      repo,
      fetchSourceHash: async () => {
        const page = await fetchPageText(decision.pageId);
        const block = page.blocks.find((b) => b.id === decision.blockId);
        if (!block) throw new Error('Source decision is unavailable');
        return hashText(normalizeText(block.body));
      },
      fetchIssueFingerprint: async (key) => (await fetchIssueSnapshot(key)).fingerprint,
      canEditIssue,
      findMarkerComment,
      postComment,
      now: () => new Date().toISOString(),
      newId,
    },
    { finding: finding as Finding, proposal: proposal as Proposal, approverAccountId: accountId },
  );
  return outcome;
});

export const handler = resolver.getDefinitions();

/**
 * Rovo agent and MCP action handlers. Identity comes from platform context and
 * installation-scoped storage, never from the model's payload.
 */
function toolDeps() {
  return {
    repoFor: (scope: string) => new Repository(forgeKv, scope),
    canReadSource: async (pageId: string): Promise<boolean> => {
      try {
        await fetchPageText(pageId);
        return true;
      } catch {
        return false;
      }
    },
    canReadIssue: async (issueKey: string): Promise<boolean> => {
      try {
        await fetchIssueSnapshot(issueKey);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export async function inspectDecisionChangeAction(payload: { blockId?: string }) {
  return inspectDecisionChange(toolDeps(), payload ?? {});
}

export async function listAffectedWorkAction(payload: { blockId?: string }) {
  return listAffectedWork(toolDeps(), payload ?? {});
}

export async function getProposalAction(payload: { proposalId?: string }) {
  return getProposal(toolDeps(), payload ?? {});
}

export { INSTALLATION_SCOPE };

/** Async queue consumer: same engine, idempotent by dedupe key. */
export async function consumer(event: { body?: { tenantId?: string; pageId?: string; blockId?: string } }) {
  const body = event.body ?? {};
  if (!body.tenantId || !body.pageId || !body.blockId) return { skipped: true };
  const outcome = await analyzeBlock(
    {
      repo: repoFor(body.tenantId),
      fetchPage: async (id) => {
        const page = await fetchPageText(id);
        return { version: page.version, text: page.text };
      },
      fetchIssue: fetchIssueSnapshot,
      now: () => new Date().toISOString(),
      newId,
    },
    { tenantId: body.tenantId, pageId: body.pageId, blockId: body.blockId },
  );
  return { status: outcome.status, findings: outcome.findings.length };
}

export { extractDecisionBlocks };
