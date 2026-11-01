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
  // Which clause actually moved, and does the linked criterion belong to it?
  const clause = changedClause(newNorm, diff.newSpan.start);
  const subject = subjectTokens(input.criterionText);
  const subjectInClause = subject.length > 0 ? subject.every((t) => clauseTokens(clause).has(t)) : null;

  if (NEGATION.test(diff.added) && !NEGATION.test(diff.removed)) {
    // A withdrawal in another clause does not reach a criterion with a
    // different subject. Saying so is more useful than flagging the whole block.
    if (subjectInClause === false) {
      return {
        classification: 'unaffected',
        confidence: 'medium',
        rationale: `The withdrawn clause ("${trim(clause)}") is about a different subject than this criterion ("${subject.join(' ')}"). The linked criterion is reported as unaffected by this page change.`,
      };
    }
    return {
      classification: 'obsolete-scope',
      confidence: subjectInClause === true || mentionsCriterion ? 'high' : 'medium',
      rationale: `The decision now withdraws work ("${trim(diff.added)}")${subjectInClause === true ? ` in the clause that names this criterion's subject ("${subject.join(' ')}")` : ''}. Recommend scope removal for a human to accept; nothing is closed automatically.`,
    };
  }

  const obligationTouched = OBLIGATION.test(newNorm) || OBLIGATION.test(oldNorm);
  if (obligationTouched) {
    const sameSubject = subjectInClause === true || sharesSubject(clause, input.criterionText);
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

/**
 * The sentence that contains the change, so a decision with several clauses can
 * be compared clause by clause instead of as one blob.
 */
export function changedClause(text: string, offset: number): string {
  const at = Math.max(0, Math.min(offset, text.length));
  let start = 0;
  for (let i = at - 1; i >= 0; i--) {
    if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
      start = i + 1;
      break;
    }
  }
  let end = text.length;
  for (let i = at; i < text.length; i++) {
    if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
      end = i + 1;
      break;
    }
  }
  return text.slice(start, end).trim();
}

/**
 * The head nouns of a criterion: its first two meaningful tokens, stopping at
 * an auxiliary or modal verb.
 *
 * 'Guest cart sessions must expire after 60 minutes.' → ['guest', 'cart']
 * 'Guest checkout allowed for first-time buyers.' → ['guest', 'checkout']
 *
 * Deliberately shallow: two tokens are enough to tell "guest checkout" from
 * "guest cart sessions", and guessing past them would invent a subject the
 * criterion does not state.
 */
export function subjectTokens(criterionText: string): string[] {
  const tokens = normalizeText(criterionText)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
  const subject: string[] = [];
  for (const token of tokens) {
    if (AUXILIARY.has(token)) break;
    if (ARTICLES.has(token) || token.length < 3) continue;
    subject.push(token);
    if (subject.length === 2) break;
  }
  return subject;
}

const ARTICLES = new Set(['the', 'a', 'an', 'every', 'each', 'all', 'any', 'no', 'our', 'its', 'their', 'this', 'that']);

/** Only auxiliaries and modals: content verbs belong to the predicate, not the subject. */
const AUXILIARY = new Set([
  'must', 'should', 'shall', 'will', 'would', 'can', 'could', 'may', 'might',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has', 'have', 'had',
  'does', 'do', 'did', 'needs', 'need',
]);

function clauseTokens(clause: string): Set<string> {
  return new Set(
    normalizeText(clause)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0),
  );
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
