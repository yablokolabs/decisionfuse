import { describe, expect, it } from 'vitest';
import { INSTALLATION_SCOPE, getProposal, inspectDecisionChange, listAffectedWork } from '../src/actions/tools';
import type { ToolDeps } from '../src/actions/tools';
import { decisionForRegistration } from '../src/queue/engine';
import { Repository } from '../src/storage/repository';
import { MemoryKv } from './fakes';

function setup(options: { sourceReadable?: boolean; issueReadable?: boolean } = {}) {
  const kv = new MemoryKv();
  const repo = new Repository(kv, INSTALLATION_SCOPE);
  const deps: ToolDeps = {
    repoFor: (scope) => new Repository(kv, scope),
    canReadSource: async () => options.sourceReadable ?? true,
    canReadIssue: async () => options.issueReadable ?? true,
  };
  return { kv, repo, deps };
}

async function seed(repo: Repository, tenantId: string = INSTALLATION_SCOPE) {
  await repo.putDecision(
    decisionForRegistration({
      tenantId,
      pageId: 'page-1',
      blockId: 'checkout-guest',
      ownerAccountId: 'acc-owner',
      status: 'accepted',
      version: 8,
      text: 'Guest checkout is no longer accepted.',
      now: '2026-11-01T10:00:00.000Z',
    }),
  );
  await repo.putLink({
    tenantId,
    blockId: 'checkout-guest',
    issueKey: 'OPS-12',
    criterionId: 'ac-1',
    createdBy: 'acc-owner',
    acknowledgedTextHash: 'h',
  });
  await repo.putFinding({
    id: 'f-1',
    tenantId,
    blockId: 'checkout-guest',
    issueKey: 'OPS-12',
    criterionId: 'ac-1',
    classification: 'obsolete-scope',
    confidence: 'high',
    sourceVersion: 8,
    sourceHash: 'h',
    issueFingerprint: 'fp',
    sourceSpan: { start: 0, end: 10, quote: 'Guest chec' },
    criterionSpan: { start: 0, end: 9, quote: 'Guest che' },
    rationale: 'The decision withdraws guest checkout.',
    engine: 'deterministic',
    dedupeKey: 'k',
    lifecycle: 'needs-review',
    createdAt: '2026-11-01T10:05:00.000Z',
  });
  await repo.putProposal({
    id: 'p-1',
    tenantId,
    findingId: 'f-1',
    issueKey: 'OPS-12',
    criterionId: 'ac-1',
    operation: 'remove-scope-recommendation',
    exactText: 'Guest checkout is out of scope.',
    sourceHash: 'h',
    issueFingerprint: 'fp',
    expiresAt: '2026-11-05T00:00:00.000Z',
    revision: 1,
    createdBy: 'acc-owner',
  });
}

describe('rovo/mcp read-only tools', () => {
  it('returns the change summary for a permitted caller', async () => {
    const { repo, deps } = setup();
    await seed(repo);
    const result = await inspectDecisionChange(deps, { blockId: 'checkout-guest' });
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.baselineVersion).toBe(8);
      expect((result.summary as unknown[]).length).toBe(1);
    }
  });

  it('denies without leaking when the source is not readable', async () => {
    const { repo, deps } = setup({ sourceReadable: false });
    await seed(repo);
    const result = await inspectDecisionChange(deps, { blockId: 'checkout-guest' });
    expect(result).toEqual({ status: 'denied', problem: 'Source access denied for the invoking user' });
    expect(JSON.stringify(result)).not.toContain('checkout');
  });

  it('omits issues the caller cannot browse and flags the omission', async () => {
    const { repo, deps } = setup({ issueReadable: false });
    await seed(repo);
    const result = await listAffectedWork(deps, { blockId: 'checkout-guest' });
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.work).toEqual([]);
      expect(result.withheldIssueEvidence).toBe(true);
      expect(JSON.stringify(result)).not.toContain('OPS-12');
    }
  });

  it('exposes a proposal but never an approval', async () => {
    const { repo, deps } = setup();
    await seed(repo);
    const result = await getProposal(deps, { proposalId: 'p-1' });
    expect(result.status).toBe('ok');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('approvedBy');
    expect(serialized).toContain('cannot approve');
  });

  it('rejects caller-supplied identifiers that are not plain ids', async () => {
    const { repo, deps } = setup();
    await seed(repo);
    for (const payload of [{ blockId: '/wiki/api/v2/pages/1' }, { blockId: 'a;DROP' }, { blockId: '' }]) {
      expect((await inspectDecisionChange(deps, payload)).status).toBe('invalid-input');
    }
    expect((await getProposal(deps, { proposalId: 'https://evil.example/x' })).status).toBe('invalid-input');
  });

  it('cannot read across installations because scope is not caller supplied', async () => {
    const kv = new MemoryKv();
    const other = new Repository(kv, 'another-installation');
    await seed(other, 'another-installation');
    const deps: ToolDeps = {
      repoFor: (scope) => new Repository(kv, scope),
      canReadSource: async () => true,
      canReadIssue: async () => true,
    };
    const result = await inspectDecisionChange(deps, { blockId: 'checkout-guest' });
    expect(result.status).toBe('not-found');
  });
});
