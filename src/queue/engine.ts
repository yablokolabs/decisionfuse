import { classifyChange, sharedWord } from '../domain/classify';
import { assertFindingEvidence, dedupeKey } from '../domain/evidence';
import { diffText, extractDecisionBlocks, hashText, normalizeText } from '../domain/text';
import type { Decision, Finding, Span } from '../domain/types';
import type { Repository } from '../storage/repository';

export const ENGINE_VERSION = 'deterministic-1';

export interface CriterionSnapshot {
  fingerprint: string;
  criteria: Array<{ id: string; text: string }>;
}

export interface AnalysisDeps {
  repo: Repository;
  fetchPage(pageId: string): Promise<{ version: number; text: string }>;
  fetchIssue(issueKey: string): Promise<CriterionSnapshot>;
  now(): string;
  newId(): string;
}

export interface AnalysisRequest {
  tenantId: string;
  pageId: string;
  blockId: string;
}

export interface AnalysisOutcome {
  status: 'baseline-captured' | 'unchanged' | 'analysed' | 'source-unavailable' | 'not-accepted' | 'deduplicated';
  findings: Finding[];
  sourceVersion: number;
}

/**
 * One idempotent analysis pass. Identity is the dedupe key, so replaying the
 * same event (or out-of-order delivery) produces no duplicate findings.
 */
export async function analyzeBlock(deps: AnalysisDeps, request: AnalysisRequest): Promise<AnalysisOutcome> {
  const { repo } = deps;
  const registered = await repo.getDecision(request.blockId);
  if (!registered) throw new Error(`Unknown decision block ${request.blockId}`);

  const page = await deps.fetchPage(request.pageId);
  const block = extractDecisionBlocks(page.text).find((b) => b.id === request.blockId);
  if (!block) {
    return { status: 'source-unavailable', findings: [], sourceVersion: page.version };
  }

  const text = normalizeText(block.body);
  const textHash = hashText(text);

  if (registered.baselineVersion === 0 || registered.textHash === '') {
    await repo.putDecision({ ...registered, baselineVersion: page.version, text, textHash, updatedAt: deps.now() });
    return { status: 'baseline-captured', findings: [], sourceVersion: page.version };
  }

  if (registered.textHash === textHash) {
    return { status: 'unchanged', findings: [], sourceVersion: page.version };
  }

  if (block.status !== 'accepted') {
    return { status: 'not-accepted', findings: [], sourceVersion: page.version };
  }

  const links = await repo.linksForBlock(request.blockId);
  const findings: Finding[] = [];
  const changed = changedRegion(registered.text, text);
  const diff = diffText(registered.text, text);

  for (const link of links) {
    const issue = await deps.fetchIssue(link.issueKey);
    const criterion = issue.criteria.find((c) => c.id === link.criterionId) ?? null;
    const verdict = classifyChange({
      oldBlockText: registered.text,
      newBlockText: text,
      criterionText: criterion?.text ?? '',
      blockStatus: block.status,
    });

    const key = dedupeKey({
      tenantId: request.tenantId,
      blockId: request.blockId,
      sourceHash: textHash,
      issueKey: link.issueKey,
      criterionId: link.criterionId,
      issueFingerprint: issue.fingerprint,
      engineVersion: ENGINE_VERSION,
    });

    const existing = (await repo.listFindings(request.blockId)).find((f) => f.dedupeKey === key);
    if (existing && existing.lifecycle === 'dismissed') continue;

    const sourceSpan: Span = {
      start: changed.start,
      end: changed.end,
      quote: text.slice(changed.start, changed.end),
    };
    const needle = criterion
      ? verifiedNeedle(diff.added || diff.removed, criterion.text) ?? sharedWord(text, criterion.text)
      : null;
    const criterionSpan = criterion
      ? spanWithin(needle, criterion.text) ?? { start: 0, end: criterion.text.length, quote: criterion.text }
      : null;

    const finding: Finding = {
      id: deps.newId(),
      tenantId: request.tenantId,
      blockId: request.blockId,
      issueKey: link.issueKey,
      criterionId: link.criterionId,
      classification: verdict.classification,
      confidence: verdict.confidence,
      sourceVersion: page.version,
      sourceHash: textHash,
      issueFingerprint: issue.fingerprint,
      sourceSpan,
      criterionSpan,
      rationale: verdict.rationale,
      engine: 'deterministic',
      dedupeKey: key,
      lifecycle: 'needs-review',
      createdAt: deps.now(),
    };

    assertFindingEvidence(finding, text, criterion?.text ?? null);
    await repo.putFinding(finding);
    findings.push(finding);
  }

  await repo.putDecision({ ...registered, baselineVersion: page.version, text, textHash, updatedAt: deps.now() });

  return {
    status: findings.length === 0 ? 'deduplicated' : 'analysed',
    findings,
    sourceVersion: page.version,
  };
}

/** Offsets of the changed region inside the new text, trimmed to word boundaries. */
export function changedRegion(oldText: string, newText: string): { start: number; end: number } {
  const prefix = commonPrefix(oldText, newText);
  const suffix = commonSuffix(oldText, newText);
  const start = Math.min(prefix, newText.length);
  const end = Math.max(start, newText.length - suffix);
  return { start, end };
}

/** First shared word (>= 4 chars) between the changed decision text and the criterion. */
export function verifiedNeedle(changedText: string, criterionText: string): string | null {
  const words = normalizeText(changedText)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  const target = normalizeText(criterionText).toLowerCase();
  for (const word of words) {
    if (target.includes(word)) return word;
  }
  return null;
}

function spanWithin(needle: string | null, text: string): Span | null {
  if (!needle) return null;
  const start = normalizeText(text).toLowerCase().indexOf(needle);
  if (start < 0) return null;
  const normalized = normalizeText(text);
  return { start, end: start + needle.length, quote: normalized.slice(start, start + needle.length) };
}

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

function commonSuffix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

export function decisionForRegistration(input: {
  tenantId: string;
  pageId: string;
  blockId: string;
  ownerAccountId: string;
  status: Decision['status'];
  version: number;
  text: string;
  now: string;
}): Decision {
  const text = normalizeText(input.text);
  return {
    tenantId: input.tenantId,
    pageId: input.pageId,
    blockId: input.blockId,
    ownerAccountId: input.ownerAccountId,
    status: input.status,
    baselineVersion: input.version,
    text,
    textHash: hashText(text),
    updatedAt: input.now,
  };
}
