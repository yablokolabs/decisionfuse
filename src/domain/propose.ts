import { normalizeText } from './text';
import type { Decision, Finding, Proposal } from './types';

export interface ProposalInput {
  finding: Finding;
  decision: Decision;
  /** Current criterion text read from the issue, or null when it is unavailable. */
  criterionText: string | null;
  now: string;
  id: string;
  ttlMinutes?: number;
}

export type ProposalResult =
  | { ok: true; proposal: Proposal; criterionSentence: string }
  | { ok: false; reason: string };

const SENTENCE = /[^.!?]+[.!?]?/g;

/**
 * Builds the exact change for one criterion from the decision text alone.
 *
 * No model is involved: the sentence in the criterion that shares its subject
 * with the decision is replaced by the decision's own sentence, and everything
 * else in the criterion is preserved. If the two share no subject there is no
 * honest correction to propose, so the caller gets a refusal instead of a guess.
 */
export function buildProposal(input: ProposalInput): ProposalResult {
  const { finding, decision } = input;

  if (finding.lifecycle !== 'needs-review') {
    return { ok: false, reason: 'finding-not-actionable' };
  }
  if (finding.classification === 'unaffected' || finding.classification === 'insufficient-evidence') {
    return { ok: false, reason: 'no-exact-change' };
  }
  if (finding.sourceHash !== decision.textHash) {
    return { ok: false, reason: 'finding-not-current' };
  }

  const criterion = normalizeText(input.criterionText ?? '');
  if (criterion.length === 0) {
    return { ok: false, reason: 'criterion-unavailable' };
  }

  const decisionSentence = pickSentence(decision.text, criterion) ?? pickSentence(decision.text, finding.sourceSpan.quote);
  if (!decisionSentence) {
    return { ok: false, reason: 'no-shared-subject' };
  }

  const criterionSentence = pickSentence(criterion, decisionSentence);
  if (!criterionSentence) {
    return { ok: false, reason: 'no-shared-subject' };
  }

  const expiresAt = new Date(Date.parse(input.now) + (input.ttlMinutes ?? 1440) * 60_000).toISOString();
  const operation: Proposal['operation'] =
    finding.classification === 'obsolete-scope' ? 'remove-scope-recommendation' : 'amend-criterion';

  const exactText =
    operation === 'remove-scope-recommendation'
      ? `Out of scope: ${decisionSentence}`
      : criterion.replace(criterionSentence, decisionSentence).trim();

  if (exactText.length === 0 || exactText === criterion) {
    return { ok: false, reason: 'no-exact-change' };
  }

  return {
    ok: true,
    criterionSentence,
    proposal: {
      id: input.id,
      tenantId: finding.tenantId,
      findingId: finding.id,
      issueKey: finding.issueKey,
      criterionId: finding.criterionId,
      operation,
      exactText,
      sourceHash: finding.sourceHash,
      issueFingerprint: finding.issueFingerprint,
      expiresAt,
      revision: 1,
      createdBy: decision.ownerAccountId,
    },
  };
}

/** Sentence containing the first word (>= 4 chars) shared with the reference text. */
function pickSentence(text: string, reference: string): string | null {
  const target = normalizeText(reference).toLowerCase();
  const sentences = normalizeText(text).match(SENTENCE) ?? [];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (sentence.length === 0) continue;
    const words = sentence
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4);
    if (words.some((w) => target.includes(w))) return sentence;
  }
  return null;
}
