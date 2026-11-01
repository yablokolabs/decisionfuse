import api, { route } from '@forge/api';
import { hashText, normalizeText } from '../domain/text';

export interface Criterion {
  id: string;
  text: string;
}

export interface IssueSnapshot {
  fingerprint: string;
  criteria: Criterion[];
  description: string;
}

/**
 * Reads one issue as the acting user. Criteria are addressed by their ordinal
 * `ac-<n>` identifier inside the description, so a proposal targets exactly one
 * node and never the whole document.
 */
export async function fetchIssueSnapshot(issueKey: string): Promise<IssueSnapshot> {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}?fields=description,summary`);
  if (!res.ok) throw new Error(`Issue ${issueKey} unavailable (${res.status})`);
  const data = (await res.json()) as { fields?: { description?: unknown; summary?: string } };
  const description = adfToText(data.fields?.description);
  return {
    fingerprint: hashText(`${normalizeText(description)}|${data.fields?.summary ?? ''}`),
    criteria: extractCriteria(description),
    description,
  };
}

export async function canEditIssue(issueKey: string): Promise<boolean> {
  const res = await api.asUser().requestJira(route`/rest/api/3/mypermissions?issueKey=${issueKey}&permissions=EDIT_ISSUES`);
  if (!res.ok) return false;
  const data = (await res.json()) as { permissions?: { EDIT_ISSUES?: { havePermission?: boolean } } };
  return data.permissions?.EDIT_ISSUES?.havePermission === true;
}

export async function findMarkerComment(issueKey: string, marker: string): Promise<string | null> {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment?maxResults=100`);
  if (!res.ok) return null;
  const data = (await res.json()) as { comments?: Array<{ id: string; body?: unknown }> };
  for (const comment of data.comments ?? []) {
    if (adfToText(comment.body).includes(marker)) return comment.id;
  }
  return null;
}

export async function postComment(issueKey: string, body: string): Promise<{ id: string }> {
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] } }),
  });
  if (!res.ok) throw new Error(`Comment write failed for ${issueKey} (${res.status})`);
  const data = (await res.json()) as { id: string };
  return { id: data.id };
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

function adfToText(node: unknown): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToText).join('\n');
  if (typeof node !== 'object') return '';
  const record = node as { type?: string; text?: string; content?: unknown[] };
  if (record.type === 'text') return record.text ?? '';
  const children = (record.content ?? []).map(adfToText).join('');
  return record.type === 'paragraph' ? `${children}\n` : children;
}
