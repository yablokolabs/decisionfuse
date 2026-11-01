/** Status a registered decision block can carry. Only `accepted` is actionable. */
export type DecisionStatus = 'draft' | 'accepted' | 'superseded';

export interface Decision {
  tenantId: string;
  pageId: string;
  blockId: string;
  ownerAccountId: string;
  status: DecisionStatus;
  /** Confluence page version the baseline was captured at. */
  baselineVersion: number;
  text: string;
  textHash: string;
  updatedAt: string;
}

export interface DecisionLink {
  tenantId: string;
  blockId: string;
  issueKey: string;
  /** Stable identifier of the acceptance-criterion node inside the issue description. */
  criterionId: string;
  createdBy: string;
  /** Source text hash the linker acknowledged; a newer baseline re-opens review. */
  acknowledgedTextHash: string;
}

export type FindingClass =
  | 'unaffected'
  | 'requirement-conflict'
  | 'obsolete-scope'
  | 'implementation-review'
  | 'insufficient-evidence';

export interface Span {
  /** Character offsets into the exact stored text version they were produced from. */
  start: number;
  end: number;
  quote: string;
}

export interface Finding {
  id: string;
  tenantId: string;
  blockId: string;
  issueKey: string;
  criterionId: string;
  classification: FindingClass;
  confidence: 'low' | 'medium' | 'high';
  sourceVersion: number;
  sourceHash: string;
  issueFingerprint: string;
  sourceSpan: Span;
  criterionSpan: Span | null;
  rationale: string;
  /** Heuristic label, never a probability of correctness. */
  engine: 'deterministic';
  dedupeKey: string;
  lifecycle: 'analyzed' | 'needs-review' | 'dismissed' | 'superseded' | 'failed';
  createdAt: string;
}

export type ProposalOperation = 'amend-criterion' | 'add-criterion' | 'remove-scope-recommendation';

export interface Proposal {
  id: string;
  tenantId: string;
  findingId: string;
  issueKey: string;
  criterionId: string;
  operation: ProposalOperation;
  /** Exact replacement text for one criterion. Never a whole-description overwrite. */
  exactText: string;
  /** Preconditions the approval must re-verify. */
  sourceHash: string;
  issueFingerprint: string;
  expiresAt: string;
  revision: number;
  createdBy: string;
}

export interface ApprovalRequest {
  proposal: Proposal;
  approverAccountId: string;
  /** Live values fetched by the server immediately before the write. */
  currentSourceHash: string;
  currentIssueFingerprint: string;
  canWriteIssue: boolean;
  now: string;
}

export type ApprovalRejection =
  | 'stale-source'
  | 'stale-issue'
  | 'expired-proposal'
  | 'permission-denied'
  | 'tenant-mismatch';

export type ApprovalResult =
  | { ok: true; approval: Approval }
  | { ok: false; reason: ApprovalRejection };

export interface Approval {
  proposalId: string;
  proposalHash: string;
  approvedBy: string;
  sourceHash: string;
  issueFingerprint: string;
  approvedAt: string;
  singleUse: true;
}

export interface AuditRecord {
  operationId: string;
  tenantId: string;
  blockId: string;
  issueKey: string;
  action: 'analysis' | 'approval-rejected' | 'apply-succeeded' | 'apply-failed' | 'reconciled';
  actor: string;
  beforeFingerprint: string;
  afterFingerprint: string;
  sourceVersion: number;
  remoteResult: string;
  status: 'ok' | 'rejected' | 'error';
  at: string;
}
