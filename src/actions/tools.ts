import type { Finding, Proposal } from '../domain/types';
import type { Repository } from '../storage/repository';

/**
 * Forge storage is partitioned per app installation, so tool calls never accept
 * a tenant or user identity from the caller. The scope below means "this
 * installation"; it is not a caller-supplied value.
 */
export const INSTALLATION_SCOPE = 'installation';

const BLOCK_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const PROPOSAL_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export interface ToolDeps {
  repoFor(scope: string): Repository;
  /** Verifies the invoking person can read the linked Confluence source. */
  canReadSource(pageId: string): Promise<boolean>;
  /** Verifies the invoking person can browse the issue. */
  canReadIssue(issueKey: string): Promise<boolean>;
}

export type ToolResult =
  | { status: 'ok'; [key: string]: unknown }
  | { status: 'invalid-input'; problem: string }
  | { status: 'denied'; problem: string }
  | { status: 'not-found'; problem: string };

/**
 * Read-only: what changed in a registered decision, relative to its baseline.
 * No mutation path exists here, and a source the invoking person cannot read
 * returns a bare denial with no title, span, count or hint.
 */
export async function inspectDecisionChange(deps: ToolDeps, payload: { blockId?: string }): Promise<ToolResult> {
  const blockId = payload.blockId ?? '';
  if (!BLOCK_ID.test(blockId)) {
    return { status: 'invalid-input', problem: 'blockId must match ^[a-zA-Z0-9_-]{1,64}$' };
  }
  const repo = deps.repoFor(INSTALLATION_SCOPE);
  const decision = await repo.getDecision(blockId);
  if (!decision) return { status: 'not-found', problem: 'Unknown registered decision' };

  if (!(await deps.canReadSource(decision.pageId))) {
    return { status: 'denied', problem: 'Source access denied for the invoking user' };
  }

  const findings = await repo.listFindings(blockId);
  const actionable = findings.filter((f) => f.lifecycle === 'needs-review');
  const readable: Finding[] = [];
  for (const finding of actionable) {
    if (await deps.canReadIssue(finding.issueKey)) readable.push(finding);
  }

  const withheld = readable.length !== actionable.length;

  return {
    status: 'ok',
    blockId: decision.blockId,
    decisionStatus: decision.status,
    baselineVersion: decision.baselineVersion,
    textHash: decision.textHash,
    summary: readable.map((f) => ({
      issueKey: f.issueKey,
      criterionId: f.criterionId,
      classification: f.classification,
      confidence: f.confidence,
      sourceVersion: f.sourceVersion,
    })),
    withheldIssueEvidence: withheld,
    notes: 'Only accepted decisions are actionable. Absent or contradictory evidence is reported as uncertain, never inferred.',
  };
}

/** Read-only: which issues are linked to a decision, and why each is flagged. */
export async function listAffectedWork(deps: ToolDeps, payload: { blockId?: string }): Promise<ToolResult> {
  const blockId = payload.blockId ?? '';
  if (!BLOCK_ID.test(blockId)) {
    return { status: 'invalid-input', problem: 'blockId must match ^[a-zA-Z0-9_-]{1,64}$' };
  }
  const repo = deps.repoFor(INSTALLATION_SCOPE);
  const decision = await repo.getDecision(blockId);
  if (!decision) return { status: 'not-found', problem: 'Unknown registered decision' };
  if (!(await deps.canReadSource(decision.pageId))) {
    return { status: 'denied', problem: 'Source access denied for the invoking user' };
  }

  const links = await repo.linksForBlock(blockId);
  const findings = await repo.listFindings(blockId);
  const work: Array<Record<string, unknown>> = [];
  let withheld = false;

  for (const link of links) {
    if (!(await deps.canReadIssue(link.issueKey))) {
      withheld = true;
      continue;
    }
    const finding = findings.find((f) => f.issueKey === link.issueKey && f.criterionId === link.criterionId);
    work.push({
      issueKey: link.issueKey,
      criterionId: link.criterionId,
      classification: finding?.classification ?? 'unaffected',
      rationale: finding?.rationale ?? 'Linked criterion still matches the accepted decision.',
      evidence: finding
        ? { sourceQuote: finding.sourceSpan.quote, criterionQuote: finding.criterionSpan?.quote ?? null }
        : null,
    });
  }

  return { status: 'ok', blockId, work, withheldIssueEvidence: withheld };
}

/**
 * Read-only: the exact proposal and its preconditions. Returns no approval
 * token and cannot approve; the reviewer must act in the authenticated panel.
 */
export async function getProposal(deps: ToolDeps, payload: { proposalId?: string }): Promise<ToolResult> {
  const proposalId = payload.proposalId ?? '';
  if (!PROPOSAL_ID.test(proposalId)) {
    return { status: 'invalid-input', problem: 'proposalId must match ^[a-zA-Z0-9_-]{1,64}$' };
  }
  const repo = deps.repoFor(INSTALLATION_SCOPE);
  const proposal = await repo.getProposal(proposalId);
  if (!proposal) return { status: 'not-found', problem: 'Unknown proposal' };
  if (!(await deps.canReadIssue(proposal.issueKey))) {
    return { status: 'denied', problem: 'Issue access denied for the invoking user' };
  }

  return {
    status: 'ok',
    proposal: publicProposal(proposal),
    approvalPath: 'Open the Jira issue panel in DecisionFuse and approve there. Tools cannot approve, apply or transition work.',
  };
}

function publicProposal(proposal: Proposal): Record<string, unknown> {
  return {
    id: proposal.id,
    issueKey: proposal.issueKey,
    criterionId: proposal.criterionId,
    operation: proposal.operation,
    exactText: proposal.exactText,
    sourceHash: proposal.sourceHash,
    issueFingerprint: proposal.issueFingerprint,
    expiresAt: proposal.expiresAt,
    revision: proposal.revision,
  };
}
