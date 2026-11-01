import type { Finding, Span } from './types';

export class EvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvidenceError';
  }
}

/** A span is only evidence if it resolves to the quote inside the exact version given. */
export function isValidSpan(span: Span, text: string): boolean {
  if (span.start < 0 || span.end > text.length || span.end <= span.start) return false;
  return text.slice(span.start, span.end) === span.quote;
}

/**
 * Rejects a finding whose evidence does not resolve. This is the gate that
 * stops plausible-sounding model output from reaching a reviewer.
 */
export function assertFindingEvidence(finding: Finding, sourceText: string, criterionText: string | null): void {
  if (!isValidSpan(finding.sourceSpan, sourceText)) {
    throw new EvidenceError(`Source span does not resolve for ${finding.issueKey}/${finding.criterionId}`);
  }
  if (finding.classification === 'unaffected') return;
  if (finding.criterionSpan === null) {
    if (finding.classification !== 'insufficient-evidence') {
      throw new EvidenceError(`Finding ${finding.id} claims an impact without a criterion span`);
    }
    return;
  }
  if (criterionText === null || !isValidSpan(finding.criterionSpan, criterionText)) {
    throw new EvidenceError(`Criterion span does not resolve for ${finding.issueKey}/${finding.criterionId}`);
  }
}

/** Stable identity for an analysis attempt; identical inputs never re-queue work. */
export function dedupeKey(parts: {
  tenantId: string;
  blockId: string;
  sourceHash: string;
  issueKey: string;
  criterionId: string;
  issueFingerprint: string;
  engineVersion: string;
}): string {
  return [
    parts.tenantId,
    parts.blockId,
    parts.sourceHash,
    parts.issueKey,
    parts.criterionId,
    parts.issueFingerprint,
    parts.engineVersion,
  ].join('|');
}
