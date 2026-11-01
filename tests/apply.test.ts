import { describe, expect, it } from 'vitest';
import { proposalHash } from '../src/domain/approval';
import type { Finding, Proposal } from '../src/domain/types';
import { applyApprovedProposal } from '../src/review/apply';
import { Repository } from '../src/storage/repository';
import { MemoryKv, fixedClock, idSequence } from './fakes';

const proposal: Proposal = {
  id: 'p-1',
  tenantId: 'tenant-a',
  findingId: 'f-1',
  issueKey: 'OPS-12',
  criterionId: 'ac-1',
  operation: 'amend-criterion',
  exactText: 'Signed-in customers only may complete checkout.',
  sourceHash: 'hash-v8',
  issueFingerprint: 'fp-1',
  expiresAt: '2026-11-05T00:00:00.000Z',
  revision: 1,
  createdBy: 'acc-owner',
};

const finding: Finding = {
  id: 'f-1',
  tenantId: 'tenant-a',
  blockId: 'checkout-guest',
  issueKey: 'OPS-12',
  criterionId: 'ac-1',
  classification: 'requirement-conflict',
  confidence: 'high',
  sourceVersion: 8,
  sourceHash: 'hash-v8',
  issueFingerprint: 'fp-1',
  sourceSpan: { start: 0, end: 4, quote: 'Gues' },
  criterionSpan: { start: 0, end: 4, quote: 'Gues' },
  rationale: 'Obligation wording changed.',
  engine: 'deterministic',
  dedupeKey: 'k',
  lifecycle: 'needs-review',
  createdAt: '2026-11-01T10:00:00.000Z',
};

function deps(overrides: Partial<Parameters<typeof applyApprovedProposal>[0]> = {}) {
  const kv = new MemoryKv();
  const repo = new Repository(kv, 'tenant-a');
  const posted: string[] = [];
  let existing: string | null = null;
  const base = {
    repo,
    fetchSourceHash: async () => 'hash-v8',
    fetchIssueFingerprint: async () => 'fp-1',
    canEditIssue: async () => true,
    findMarkerComment: async () => existing,
    postComment: async (_key: string, body: string) => {
      posted.push(body);
      existing = 'comment-900';
      return { id: 'comment-900' };
    },
    now: fixedClock(),
    newId: idSequence('op'),
    ...overrides,
  };
  return { base, posted, repo, setExisting: (v: string | null) => (existing = v) };
}

describe('approved apply path', () => {
  it('writes one marker-tagged comment and records an audit row', async () => {
    const { base, posted, repo } = deps();
    const outcome = await applyApprovedProposal(base, { finding, proposal, approverAccountId: 'acc-reviewer' });
    expect(outcome.status).toBe('applied');
    expect(posted).toHaveLength(1);
    expect(posted[0]).toContain(`{{decisionfuse-proposal-${proposal.id}}}`);
    expect(posted[0]).toContain(proposal.exactText);
    const audit = await repo.listAudit();
    expect(audit.at(-1)?.action).toBe('apply-succeeded');
  });

  it('rejects a stale source without writing', async () => {
    const { base, posted } = deps({ fetchSourceHash: async () => 'hash-v9' });
    const outcome = await applyApprovedProposal(base, { finding, proposal, approverAccountId: 'acc-reviewer' });
    expect(outcome.status).toBe('rejected');
    expect(posted).toHaveLength(0);
  });

  it('rejects a reviewer without issue write permission', async () => {
    const { base, posted } = deps({ canEditIssue: async () => false });
    const outcome = await applyApprovedProposal(base, { finding, proposal, approverAccountId: 'acc-readonly' });
    expect(outcome).toMatchObject({ status: 'rejected', reason: 'permission-denied' });
    expect(posted).toHaveLength(0);
  });

  it('reconciles instead of posting twice after a crash', async () => {
    const setup = deps();
    setup.setExisting('comment-900');
    const outcome = await applyApprovedProposal(setup.base, { finding, proposal, approverAccountId: 'acc-reviewer' });
    expect(outcome.status).toBe('applied');
    expect(setup.posted).toHaveLength(0);
    expect((await setup.repo.listAudit()).at(-1)?.action).toBe('reconciled');
  });

  it('burns the approval so a second call cannot write again', async () => {
    const setup = deps();
    await applyApprovedProposal(setup.base, { finding, proposal, approverAccountId: 'acc-reviewer' });
    await setup.repo.markProposalConsumed(proposalHash(proposal));
    const second = await applyApprovedProposal(setup.base, { finding, proposal, approverAccountId: 'acc-reviewer' });
    expect(second).toMatchObject({ status: 'rejected', reason: 'approval-already-used' });
    expect(setup.posted).toHaveLength(1);
  });

  it('marks scope removal as a suggestion, never an applied transition', async () => {
    const scopeProposal: Proposal = { ...proposal, operation: 'remove-scope-recommendation' };
    const { base, posted } = deps();
    const outcome = await applyApprovedProposal(base, { finding, proposal: scopeProposal, approverAccountId: 'acc-reviewer' });
    expect(outcome.status).toBe('suggested');
    expect(posted[0]).toContain('No status transition was performed');
  });
});
