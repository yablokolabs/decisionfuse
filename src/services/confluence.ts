import api, { route } from '@forge/api';
import { extractDecisionBlocks, hashText, normalizeText } from '../domain/text';

export interface PageSnapshot {
  version: number;
  text: string;
}

/** Confluence content is read as the acting user, so denied pages fail closed. */
export async function fetchPageSnapshot(pageId: string): Promise<PageSnapshot> {
  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${pageId}?body-format=storage`);
  if (!res.ok) throw new Error(`Confluence page ${pageId} unavailable (${res.status})`);
  const data = (await res.json()) as {
    version?: { number?: number };
    body?: { storage?: { value?: string } };
  };
  const storageBody = data.body?.storage?.value ?? '';
  return { version: data.version?.number ?? 0, text: normalizeText(storageBody) };
}

/** Strips tags from a storage-format body so block markers can be read as text. */
export async function fetchPageText(pageId: string): Promise<{ version: number; text: string; blocks: ReturnType<typeof extractDecisionBlocks> }> {
  const page = await fetchPageSnapshot(pageId);
  const withBreaks = await fetchRawStorage(pageId);
  return { ...page, text: withBreaks, blocks: extractDecisionBlocks(withBreaks) };
}

async function fetchRawStorage(pageId: string): Promise<string> {
  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${pageId}?body-format=storage`);
  if (!res.ok) throw new Error(`Confluence page ${pageId} unavailable (${res.status})`);
  const data = (await res.json()) as { body?: { storage?: { value?: string } } };
  const html = data.body?.storage?.value ?? '';
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
}

export function sourceHashOf(text: string): string {
  return hashText(normalizeText(text));
}
