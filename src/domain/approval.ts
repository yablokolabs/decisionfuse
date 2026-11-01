import { hashText } from './text';
import type { Approval, ApprovalRequest, ApprovalResult, Proposal } from './types';

export function proposalHash(proposal: Proposal): string {
  return hashText(
    [
      proposal.id,
      proposal.findingId,
      proposal.issueKey,
      proposal.criterionId,
      proposal.operation,
      proposal.exactText,
      proposal.sourceHash,
      proposal.issueFingerprint,
      String(proposal.revision),
    ].join('\u0000'),
  );
}

/**
 * Server-side approval gate. A proposal is only usable when it still matches
 * the live source and issue state, has not expired, and the approver can write
 * to the issue. Nothing here trusts a client-supplied boolean.
 */
export function approveProposal(request: ApprovalRequest): ApprovalResult {
  const { proposal } = request;

  if (!request.canWriteIssue) {
    return { ok: false, reason: 'permission-denied' };
  }
  if (Date.parse(request.now) >= Date.parse(proposal.expiresAt)) {
    return { ok: false, reason: 'expired-proposal' };
  }
  if (request.currentSourceHash !== proposal.sourceHash) {
    return { ok: false, reason: 'stale-source' };
  }
  if (request.currentIssueFingerprint !== proposal.issueFingerprint) {
    return { ok: false, reason: 'stale-issue' };
  }
  if (proposal.exactText.trim().length === 0) {
    return { ok: false, reason: 'stale-issue' };
  }

  const approval: Approval = {
    proposalId: proposal.id,
    proposalHash: proposalHash(proposal),
    approvedBy: request.approverAccountId,
    sourceHash: request.currentSourceHash,
    issueFingerprint: request.currentIssueFingerprint,
    approvedAt: request.now,
    singleUse: true,
  };
  return { ok: true, approval };
}

/** An approval is bound to one proposal revision and burns on first use. */
export function isApprovalUsable(approval: Approval, proposal: Proposal, consumedProposalHashes: Set<string>): boolean {
  return approval.proposalId === proposal.id && approval.proposalHash === proposalHash(proposal) && !consumedProposalHashes.has(approval.proposalHash);
}

/**
 * A scope-removal finding is a recommendation. It is never turned into an
 * automatic transition, and never into a bare issue edit.
 */
export function requiresNativeWorkflow(operation: Proposal['operation']): boolean {
  return operation === 'remove-scope-recommendation';
}
