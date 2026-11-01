import { approveProposal, proposalHash, requiresNativeWorkflow } from '../domain/approval';
import type { Approval, AuditRecord, Finding, Proposal } from '../domain/types';
import type { Repository } from '../storage/repository';

export interface ApplyDeps {
  repo: Repository;
  /** Re-reads the source page as the approving user, so permission errors surface. */
  fetchSourceHash(blockId: string): Promise<string>;
  fetchIssueFingerprint(issueKey: string): Promise<string>;
  canEditIssue(issueKey: string): Promise<boolean>;
  /** Posts the marker-tagged amendment comment; must reconcile before posting again. */
  findMarkerComment(issueKey: string, marker: string): Promise<string | null>;
  postComment(issueKey: string, body: string): Promise<{ id: string }>;
  now(): string;
  newId(): string;
}

export const MARKER_PREFIX = 'decisionfuse-proposal';

export type ApplyOutcome =
  | { status: 'applied'; audit: AuditRecord }
  | { status: 'suggested'; audit: AuditRecord }
  | { status: 'rejected'; reason: string; audit: AuditRecord };

/**
 * Applies an approved proposal. The remote write is a single marker-tagged
 * comment carrying the exact amendment: safe to reconcile, impossible to
 * overwrite unrelated description nodes, and never a status transition.
 */
export async function applyApprovedProposal(
  deps: ApplyDeps,
  input: { finding: Finding; proposal: Proposal; approverAccountId: string },
): Promise<ApplyOutcome> {
  const { repo } = deps;
  const { proposal, finding } = input;

  const approvalInput = {
    proposal,
    approverAccountId: input.approverAccountId,
    currentSourceHash: await deps.fetchSourceHash(proposal.tenantId),
    currentIssueFingerprint: await deps.fetchIssueFingerprint(proposal.issueKey),
    canWriteIssue: await deps.canEditIssue(proposal.issueKey),
    now: deps.now(),
  };
  const verdict = approveProposal(approvalInput);

  if (!verdict.ok) {
    const audit = auditFor(deps, {
      proposal,
      finding,
      action: 'approval-rejected',
      actor: input.approverAccountId,
      status: 'rejected',
      remoteResult: verdict.reason,
    });
    await repo.appendAudit(audit);
    return { status: 'rejected', reason: verdict.reason, audit };
  }

  const consumed = await repo.consumedProposalHashes();
  if (consumed.has(proposalHash(proposal))) {
    const audit = auditFor(deps, {
      proposal,
      finding,
      action: 'approval-rejected',
      actor: input.approverAccountId,
      status: 'rejected',
      remoteResult: 'approval-already-used',
    });
    await repo.appendAudit(audit);
    return { status: 'rejected', reason: 'approval-already-used', audit };
  }

  const marker = `${MARKER_PREFIX}-${proposal.id}`;
  const existingComment = await deps.findMarkerComment(proposal.issueKey, marker);
  if (existingComment) {
    await repo.markProposalConsumed(proposalHash(proposal));
    const audit = auditFor(deps, {
      proposal,
      finding,
      action: 'reconciled',
      actor: input.approverAccountId,
      status: 'ok',
      remoteResult: `comment ${existingComment}`,
    });
    await repo.appendAudit(audit);
    return { status: 'applied', audit };
  }

  const body = renderAmendmentBody(proposal, verdict.approval, finding);
  let posted: { id: string };
  try {
    posted = await deps.postComment(proposal.issueKey, body);
  } catch (error) {
    const audit = auditFor(deps, {
      proposal,
      finding,
      action: 'apply-failed',
      actor: input.approverAccountId,
      status: 'error',
      remoteResult: String(error),
    });
    await repo.appendAudit(audit);
    throw error;
  }

  await repo.markProposalConsumed(proposalHash(proposal));
  const audit = auditFor(deps, {
    proposal,
    finding,
    action: 'apply-succeeded',
    actor: input.approverAccountId,
    status: 'ok',
    remoteResult: `comment ${posted.id}`,
  });
  await repo.appendAudit(audit);

  if (requiresNativeWorkflow(proposal.operation)) {
    return { status: 'suggested', audit };
  }
  return { status: 'applied', audit };
}

export function renderAmendmentBody(proposal: Proposal, approval: Approval, finding: Finding): string {
  return [
    `{{${MARKER_PREFIX}-${proposal.id}}}`,
    `DecisionFuse proposed ${proposal.operation} for criterion ${proposal.criterionId}, approved by ${approval.approvedBy}.`,
    '',
    'Proposed exact text:',
    `{quote}${proposal.exactText}{quote}`,
    '',
    `Evidence: source version ${finding.sourceVersion}, classification ${finding.classification}.`,
    requiresNativeWorkflow(proposal.operation)
      ? 'This is a recommendation only. No status transition was performed.'
      : 'Apply this with the native issue editor; DecisionFuse does not rewrite the description.',
  ].join('\n');
}

function auditFor(
  deps: ApplyDeps,
  input: {
    proposal: Proposal;
    finding: Finding;
    action: AuditRecord['action'];
    actor: string;
    status: AuditRecord['status'];
    remoteResult: string;
  },
): AuditRecord {
  return {
    operationId: deps.newId(),
    tenantId: input.proposal.tenantId,
    blockId: input.finding.blockId,
    issueKey: input.proposal.issueKey,
    action: input.action,
    actor: input.actor,
    beforeFingerprint: input.proposal.issueFingerprint,
    afterFingerprint: input.proposal.issueFingerprint,
    sourceVersion: input.finding.sourceVersion,
    remoteResult: input.remoteResult,
    status: input.status,
    at: deps.now(),
  };
}
