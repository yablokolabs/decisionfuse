import api, { route } from '@forge/api';
import { adfToText, extractCriteria } from '../domain/issue-text';
import type { Criterion } from '../domain/issue-text';
import { hashText, normalizeText } from '../domain/text';

export { extractCriteria };
export type { Criterion };

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

