import { diffText, normalizeText } from './text';
import type { FindingClass } from './types';

const NEGATION = /\b(no longer|not required|removed|dropped|out of scope|instead of|never|without)\b/i;
const OBLIGATION = /\b(must|required|only|mandatory|before|after|shall)\b/i;

export interface ClassificationInput {
  oldBlockText: string;
  newBlockText: string;
  criterionText: string;
  blockStatus: 'draft' | 'accepted' | 'superseded';
  /** True when another accepted decision contradicts this one in the same page. */
  contradictsAcceptedDecision?: boolean;
}

export interface Classification {
  classification: FindingClass;
  confidence: 'low' | 'medium' | 'high';
  rationale: string;
}

/**
 * Deterministic, evidence-bound classification. The model boundary sits above
 * this function: nothing here reads free-form model output, and an unclear
 * change is reported as uncertain rather than guessed.
 */
export function classifyChange(input: ClassificationInput): Classification {
  const oldNorm = normalizeText(input.oldBlockText);
  const newNorm = normalizeText(input.newBlockText);

  if (input.blockStatus !== 'accepted') {
    return {
      classification: 'insufficient-evidence',
      confidence: 'low',
      rationale: `Block status is ${input.blockStatus}; only an accepted decision can change linked work.`,
    };
  }

  if (oldNorm === newNorm) {
    return {
      classification: 'unaffected',
      confidence: 'high',
      rationale: 'Normalized decision text is unchanged; formatting-only edits are ignored.',
    };
  }

  if (input.contradictsAcceptedDecision) {
    return {
      classification: 'insufficient-evidence',
      confidence: 'low',
      rationale: 'Two accepted decisions disagree. Precedence is not inferred from timestamps; a human must clarify.',
    };
  }

  const diff = diffText(oldNorm, newNorm);
  const mentionsCriterion = sharesKeyword(diff.added || diff.removed, input.criterionText);

  if (NEGATION.test(diff.added) && !NEGATION.test(diff.removed)) {
    return {
      classification: mentionsCriterion ? 'obsolete-scope' : 'obsolete-scope',
      confidence: mentionsCriterion ? 'high' : 'medium',
      rationale: `The decision now withdraws work ("${trim(diff.added)}")${mentionsCriterion ? ' and the linked criterion is in the changed region' : ''}. Recommend scope removal for a human to accept; nothing is closed automatically.`,
    };
  }

  const obligationTouched = OBLIGATION.test(newNorm) || OBLIGATION.test(oldNorm);
  if (obligationTouched) {
    const sameSubject = sharesSubject(newNorm, input.criterionText);
    return {
      classification: sameSubject ? 'requirement-conflict' : 'implementation-review',
      confidence: mentionsCriterion || sameSubject ? 'high' : 'medium',
      rationale: `Obligation wording in the decision changed ("${trim(diff.removed)}" → "${trim(diff.added)}")${sameSubject ? ' and the linked criterion shares its subject' : ''}. A human must confirm whether the criterion is now wrong.`,
    };
  }

  return {
    classification: 'implementation-review',
    confidence: 'low',
    rationale: 'The decision text changed without obligation or withdrawal wording. Review is requested rather than inferred.',
  };
}

/** First shared word (>= 4 chars) between two texts, used for evidence needles. */
export function sharedWord(text: string, criterion: string): string | null {
  for (const word of contentWords(text)) {
    if (normalizeText(criterion).toLowerCase().includes(word)) return word;
  }
  return null;
}

function sharesSubject(text: string, criterion: string): boolean {
  return sharedWord(text, criterion) !== null;
}

function contentWords(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
}

function sharesKeyword(changed: string, criterion: string): boolean {
  const words = normalizeText(changed)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return false;
  const target = normalizeText(criterion).toLowerCase();
  return words.some((w) => target.includes(w));
}

function trim(text: string): string {
  const clean = normalizeText(text);
  return clean.length > 90 ? `${clean.slice(0, 87)}…` : clean;
}
