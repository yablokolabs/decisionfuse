export interface Criterion {
  id: string;
  text: string;
}

/** Flattens an Atlassian Document Format description to plain text lines. */
export function adfToText(node: unknown): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToText).join('\n');
  if (typeof node !== 'object') return '';
  const record = node as { type?: string; text?: string; content?: unknown[] };
  if (record.type === 'text') return record.text ?? '';
  const children = (record.content ?? []).map(adfToText).join('');
  return record.type === 'paragraph' ? `${children}\n` : children;
}

/** Extracts acceptance criteria as plain text keyed by ordinal position. */
export function extractCriteria(description: string): Criterion[] {
  const lines = description.split(/\r?\n/);
  const criteria: Criterion[] = [];
  for (const line of lines) {
    const trimmed = line.replace(/^[-*•\d.\s]+/, '').trim();
    if (trimmed.length === 0) continue;
    criteria.push({ id: `ac-${criteria.length + 1}`, text: trimmed });
  }
  return criteria;
}
