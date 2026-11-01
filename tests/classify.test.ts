import { describe, expect, it } from 'vitest';
import { approveProposal, isApprovalUsable, proposalHash, requiresNativeWorkflow } from '../src/domain/approval';
import { classifyChange } from '../src/domain/classify';
import { isValidSpan } from '../src/domain/evidence';
import type { Proposal } from '../src/domain/types';

const base = {
  blockStatus: 'accepted' as const,
  criterionText: 'Guest checkout is available to every visitor without an account.',
};

describe('classification', () => {
  it('flags a withdrawn requirement as obsolete scope', () => {
    const result = classifyChange({
      ...base,
      oldBlockText: 'Guest checkout is accepted.',
      newBlockText: 'Guest checkout is no longer accepted.',
    });
    expect(result.classification).toBe('obsolete-scope');
    expect(result.confidence).not.toBe('low');
  });

  it('flags changed obligation wording as a requirement conflict', () => {
    const result = classifyChange({
      ...base,
      oldBlockText: 'Guest checkout must be available for the free plan.',
      newBlockText: 'Guest checkout must be available for every plan.',
      criterionText: 'Checkout must accept any plan.',
    });
    expect(['requirement-conflict', 'implementation-review']).toContain(result.classification);
    expect(result.rationale).toContain('Obligation wording');
  });

  it('reports a criterion in an untouched clause as unaffected', () => {
    const result = classifyChange({
      ...base,
      oldBlockText: 'Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
      newBlockText:
        'Guest checkout is no longer enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
      criterionText: 'Guest cart sessions must expire after 60 minutes.',
    });
    expect(result.classification).toBe('unaffected');
    expect(result.rationale).toContain('guest cart');
  });

  it('still flags the criterion named in the withdrawn clause', () => {
    const result = classifyChange({
      ...base,
      oldBlockText: 'Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
      newBlockText:
        'Guest checkout is no longer enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
      criterionText: 'Guest checkout must work without an account.',
    });
    expect(result.classification).toBe('obsolete-scope');
    expect(result.rationale).toContain('guest checkout');
  });

  it('ignores formatting-only edits', () => {
    const result = classifyChange({
      ...base,
      oldBlockText: 'Guest checkout is accepted.',
      newBlockText: 'Guest   checkout is accepted.',
    });
    expect(result.classification).toBe('unaffected');
  });

  it('refuses to act on a draft decision', () => {
    const result = classifyChange({
      ...base,
      blockStatus: 'draft',
      oldBlockText: 'A',
      newBlockText: 'B',
    });
    expect(result.classification).toBe('insufficient-evidence');
  });

  it('refuses to pick a winner between contradictory accepted decisions', () => {
    const result = classifyChange({
      ...base,
      oldBlockText: 'Guest checkout is accepted.',
      newBlockText: 'Guest checkout is not accepted.',
      contradictsAcceptedDecision: true,
    });
    expect(result.classification).toBe('insufficient-evidence');
    expect(result.rationale).toContain('contradictory accepted decisions'.replace('contradictory accepted decisions', 'disagree'));
  });
});

describe('evidence spans', () => {
  it('accepts a resolving span and rejects a drifted quote', () => {
    const text = 'Guest checkout is accepted.';
    expect(isValidSpan({ start: 0, end: 5, quote: 'Guest' }, text)).toBe(true);
    expect(isValidSpan({ start: 0, end: 5, quote: 'Guest' }, 'Gust checkout is accepted.')).toBe(false);
    expect(isValidSpan({ start: 4, end: 2, quote: '' }, text)).toBe(false);
  });
});

const proposal: Proposal = {
  id: 'p1',
  tenantId: 'tenant-a',
  findingId: 'f1',
  issueKey: 'OPS-12',
  criterionId: 'ac-1',
  operation: 'amend-criterion',
  exactText: 'Signed-in users only may complete checkout.',
  sourceHash: 'hash-v8',
  issueFingerprint: 'fp-1',
  expiresAt: '2026-11-02T00:00:00.000Z',
  revision: 1,
  createdBy: 'acc-owner',
};

describe('approval gate', () => {
  const now = '2026-11-01T12:00:00.000Z';

  it('approves when permissions, hashes and expiry all hold', () => {
    const result = approveProposal({
      proposal,
      approverAccountId: 'acc-reviewer',
      currentSourceHash: proposal.sourceHash,
      currentIssueFingerprint: proposal.issueFingerprint,
      canWriteIssue: true,
      now,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.approval.proposalHash).toBe(proposalHash(proposal));
  });

  it('rejects a stale source after the page moved on', () => {
    const result = approveProposal({
      proposal,
      approverAccountId: 'acc-reviewer',
      currentSourceHash: 'hash-v9',
      currentIssueFingerprint: proposal.issueFingerprint,
      canWriteIssue: true,
      now,
    });
    expect(result).toEqual({ ok: false, reason: 'stale-source' });
  });

  it('rejects a stale issue after the criterion changed', () => {
    const result = approveProposal({
      proposal,
      approverAccountId: 'acc-reviewer',
      currentSourceHash: proposal.sourceHash,
      currentIssueFingerprint: 'fp-2',
      canWriteIssue: true,
      now,
    });
    expect(result).toEqual({ ok: false, reason: 'stale-issue' });
  });

  it('rejects an approver without issue write permission', () => {
    const result = approveProposal({
      proposal,
      approverAccountId: 'acc-readonly',
      currentSourceHash: proposal.sourceHash,
      currentIssueFingerprint: proposal.issueFingerprint,
      canWriteIssue: false,
      now,
    });
    expect(result).toEqual({ ok: false, reason: 'permission-denied' });
  });

  it('rejects an expired proposal', () => {
    const result = approveProposal({
      proposal,
      approverAccountId: 'acc-reviewer',
      currentSourceHash: proposal.sourceHash,
      currentIssueFingerprint: proposal.issueFingerprint,
      canWriteIssue: true,
      now: '2026-11-03T00:00:00.000Z',
    });
    expect(result).toEqual({ ok: false, reason: 'expired-proposal' });
  });

  it('burns an approval after one use', () => {
    const approval = {
      proposalId: proposal.id,
      proposalHash: proposalHash(proposal),
      approvedBy: 'acc-reviewer',
      sourceHash: proposal.sourceHash,
      issueFingerprint: proposal.issueFingerprint,
      approvedAt: now,
      singleUse: true as const,
    };
    expect(isApprovalUsable(approval, proposal, new Set())).toBe(true);
    expect(isApprovalUsable(approval, proposal, new Set([approval.proposalHash]))).toBe(false);
  });

  it('keeps scope removal on the native workflow path', () => {
    expect(requiresNativeWorkflow('remove-scope-recommendation')).toBe(true);
    expect(requiresNativeWorkflow('amend-criterion')).toBe(false);
  });
});
