export interface DecisionBlock {
  id: string;
  status: 'draft' | 'accepted' | 'superseded';
  body: string;
}

const BLOCK_START = /^BEGIN DECISION\s+(\S+)\s+status=(draft|accepted|superseded)\s*$/i;
const BLOCK_END = /^END DECISION\s*$/i;

/**
 * Decisions are registered as fenced blocks in Confluence page text. The marker
 * syntax is deliberately dull: it is extracted deterministically, never
 * inferred from prose by a model.
 */
export function extractDecisionBlocks(pageText: string): DecisionBlock[] {
  const blocks: DecisionBlock[] = [];
  const lines = pageText.split(/\r?\n/);
  let current: { id: string; status: DecisionBlock['status']; body: string[] } | null = null;
  for (const line of lines) {
    const start = line.trim().match(BLOCK_START);
    if (start && !current) {
      current = { id: start[1], status: start[2].toLowerCase() as DecisionBlock['status'], body: [] };
      continue;
    }
    if (BLOCK_END.test(line.trim()) && current) {
      blocks.push({ id: current.id, status: current.status, body: current.body.join('\n').trim() });
      current = null;
      continue;
    }
    if (current) current.body.push(line);
  }
  return blocks;
}

/** Collapses whitespace and line endings so formatting-only edits never look semantic. */
export function normalizeText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** FNV-1a 64-bit over UTF-16 code units, hex encoded. Stable and dependency free. */
export function hashText(text: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}

export interface TextDiff {
  changed: boolean;
  removed: string;
  added: string;
  /** Offsets of the changed region inside the *old* and *new* text. */
  oldSpan: { start: number; end: number };
  newSpan: { start: number; end: number };
}

/**
 * Trims the shared prefix and suffix at token boundaries, then reports the
 * single replaced region. Enough for acceptance-criterion edits, and every
 * span stays verifiable against the exact stored versions.
 */
export function diffText(oldText: string, newText: string): TextDiff {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  let prefix = 0;
  while (prefix < oldTokens.length && prefix < newTokens.length && oldTokens[prefix].value === newTokens[prefix].value) {
    prefix++;
  }
  let suffix = 0;
  while (
    suffix < oldTokens.length - prefix &&
    suffix < newTokens.length - prefix &&
    oldTokens[oldTokens.length - 1 - suffix].value === newTokens[newTokens.length - 1 - suffix].value
  ) {
    suffix++;
  }
  const oldStart = prefix < oldTokens.length ? oldTokens[prefix].start : oldText.length;
  const oldEnd = suffix > 0 ? oldTokens[oldTokens.length - suffix].end : oldText.length;
  const newStart = prefix < newTokens.length ? newTokens[prefix].start : newText.length;
  const newEnd = suffix > 0 ? newTokens[newTokens.length - suffix].end : newText.length;
  return {
    changed: oldText !== newText,
    removed: oldText.slice(oldStart, oldEnd),
    added: newText.slice(newStart, newEnd),
    oldSpan: { start: oldStart, end: oldEnd },
    newSpan: { start: newStart, end: newEnd },
  };
}

function tokenize(text: string): Array<{ value: string; start: number; end: number }> {
  const tokens: Array<{ value: string; start: number; end: number }> = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    tokens.push({ value: match[0], start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}
