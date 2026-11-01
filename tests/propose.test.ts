import { describe, expect, it } from 'vitest';
import { buildProposal } from '../src/domain/propose';
import type { Decision, Finding } from '../src/domain/types';

const decision: Decision = {
  tenantId: 'tenant-a',
  pageId: '426003',
  blockId: 'checkout-guest',
  ownerAccountId: 'acc-owner',
  status: 'accepted',
  baselineVersion: 9,
  text: 'Guest checkout is disabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
  textHash: 'hash-v9',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'op-1',
    tenantId: 'tenant-a',
    blockId: 'checkout-guest',
    issueKey: 'DFS-1',
    criterionId: 'ac-1',
    classification: 'obsolete-scope',
    confidence: 'high',
    sourceVersion: 9,
    sourceHash: 'hash-v9',
    issueFingerprint: 'fp-1',
    sourceSpan: { start: 19, end: 27, quote: 'disabled' },
    criterionSpan: { start: 0, end: 20, quote: 'Guest checkout is' },
    rationale: 'The decision withdraws guest checkout.',
    engine: 'deterministic',
    dedupeKey: 'k',
    lifecycle: 'needs-review',
    createdAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

const input = {
  now: '2026-11-01T10:00:00.000Z',
  id: 'op-7',
  criterionText: 'Guest checkout is available to first-time buyers. Cart sessions last an hour.',
};

describe('deterministic proposal', () => {
  it('replaces only the criterion sentence that shares the decision subject', () => {
    const result = buildProposal({
      ...input,
      finding: finding({ classification: 'requirement-conflict' }),
      decision,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.proposal.operation).toBe('amend-criterion');
    expect(result.proposal.exactText).toBe(
      'Guest checkout is disabled for first-time buyers. Cart sessions last an hour.',
    );
    expect(result.criterionSentence).toBe('Guest checkout is available to first-time buyers.');
    expect(result.proposal.issueKey).toBe('DFS-1');
    expect(result.proposal.criterionId).toBe('ac-1');
  });

  it('binds preconditions and an expiry to the finding it came from', () => {
    const result = buildProposal({ ...input, finding: finding(), decision });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.proposal.sourceHash).toBe('hash-v9');
    expect(result.proposal.issueFingerprint).toBe('fp-1');
    expect(result.proposal.expiresAt).toBe('2026-11-02T10:00:00.000Z');
    expect(result.proposal.revision).toBe(1);
  });

  it('proposes a scope removal instead of a rewrite when the decision withdraws work', () => {
    const result = buildProposal({ ...input, finding: finding({ classification: 'obsolete-scope' }), decision });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.proposal.operation).toBe('remove-scope-recommendation');
    expect(result.proposal.exactText).toBe('Out of scope: Guest checkout is disabled for first-time buyers.');
  });

  it('refuses to invent a correction when criterion and decision share no subject', () => {
    const result = buildProposal({
      ...input,
      finding: finding({ classification: 'requirement-conflict', sourceSpan: { start: 0, end: 6, quote: 'zzzqqq' } }),
      decision: { ...decision, text: 'Invoices must be archived for seven years.' },
      criterionText: 'The search box shows recent queries.',
    });
    expect(result).toMatchObject({ ok: false, reason: 'no-shared-subject' });
  });

  it('refuses uncertain findings and findings that no longer match the decision', () => {
    expect(
      buildProposal({ ...input, finding: finding({ classification: 'insufficient-evidence' }), decision }),
    ).toMatchObject({ ok: false, reason: 'no-exact-change' });
    expect(
      buildProposal({ ...input, finding: finding({ sourceHash: 'hash-v8' }), decision }),
    ).toMatchObject({ ok: false, reason: 'finding-not-current' });
    expect(
      buildProposal({ ...input, finding: finding({ lifecycle: 'dismissed' }), decision }),
    ).toMatchObject({ ok: false, reason: 'finding-not-actionable' });
  });

  it('never proposes a change that leaves the criterion untouched', () => {
    const result = buildProposal({
      ...input,
      finding: finding({ classification: 'requirement-conflict' }),
      decision: { ...decision, text: 'Guest checkout is available to first-time buyers.' },
      criterionText: 'Guest checkout is available to first-time buyers.',
    });
    expect(result).toMatchObject({ ok: false, reason: 'no-exact-change' });
  });
});
