#!/usr/bin/env node
/**
 * Seeds the synthetic DecisionFuse scenario on a development site.
 *
 * Idempotent by design: every object is looked up before it is created, so a
 * second run reports `existing` and writes nothing. That matters for the
 * Confluence page most — rewriting it would bump the version and invalidate any
 * baseline the app already stored against it.
 *
 * Usage (credentials come from the environment, never from this file):
 *   FORGE_EMAIL=... FORGE_API_TOKEN=... node scripts/seed-synthetic.mjs
 *
 * Optional: DECISIONFUSE_SITE (default https://yablo.atlassian.net),
 *           DECISIONFUSE_SPACE_ID (default 393220).
 *
 * It seeds content as the calling user over REST. It does not exercise the Forge
 * runtime: registering a decision, linking criteria and approving all run through
 * the app inside a signed-in browser.
 */
import { Buffer } from 'node:buffer';

const SITE = (process.env.DECISIONFUSE_SITE ?? 'https://yablo.atlassian.net').replace(/\/+$/, '');
const SPACE_ID = process.env.DECISIONFUSE_SPACE_ID ?? '393220';
const EMAIL = process.env.FORGE_EMAIL;
const TOKEN = process.env.FORGE_API_TOKEN;
const PROJECT_KEY = 'DFS';
const PAGE_TITLE = 'Checkout decisions (synthetic)';
const LABEL = 'decisionfuse-synthetic';

if (!EMAIL || !TOKEN) {
  console.error('Set FORGE_EMAIL and FORGE_API_TOKEN in the environment first.');
  process.exit(2);
}

const JIRA = SITE;
const WIKI = `${SITE}/wiki`;

const ISSUES = [
  { summary: 'Guest checkout for first-time buyers', criterion: 'Guest checkout is enabled for first-time buyers.' },
  { summary: 'Guest cart session expiry', criterion: 'Guest cart sessions expire after 60 minutes.' },
  { summary: 'Order confirmation tax summary', criterion: 'Order confirmation shows the tax summary.' },
];

const BLOCK = {
  id: 'checkout-guest',
  status: 'accepted',
  body: 'Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.',
};

async function call(base, path, init = {}) {
  const res = await fetch(base + path, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Basic ${Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${text.slice(0, 240)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

const adf = (...lines) => ({
  type: 'doc',
  version: 1,
  content: lines.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
});

const storage = () =>
  [
    `<p>BEGIN DECISION ${BLOCK.id} status=${BLOCK.status}</p>`,
    `<p>${BLOCK.body}</p>`,
    '<p>END DECISION</p>',
    '<p>This page holds synthetic decision blocks for DecisionFuse verification. Not customer data.</p>',
  ].join('');

async function ensureProject(accountId) {
  try {
    const found = await call(JIRA, `/rest/api/3/project/${PROJECT_KEY}`);
    return { key: found.key, action: 'existing' };
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const created = await call(JIRA, '/rest/api/2/project', {
    method: 'POST',
    // The v3 shape (projectTemplateModuleKey) answers 400 on this tenant; v2 works.
    body: {
      key: PROJECT_KEY,
      name: 'DecisionFuse Synthetic',
      description: 'Synthetic project for DecisionFuse verification. Not customer data.',
      projectTypeKey: 'software',
      projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-agility-kanban',
      leadAccountId: accountId,
    },
  });
  return { key: created.key, action: 'created' };
}

async function projectIssues() {
  const path = `/rest/api/3/search/jql?jql=${encodeURIComponent(`project = ${PROJECT_KEY} ORDER BY created ASC`)}&fields=summary&maxResults=100`;
  try {
    return (await call(JIRA, path)).issues ?? [];
  } catch (e) {
    if (e.status !== 404 && e.status !== 410) throw e;
    const legacy = `/rest/api/3/search?jql=${encodeURIComponent(`project = ${PROJECT_KEY} ORDER BY created ASC`)}&fields=summary&maxResults=100`;
    return (await call(JIRA, legacy)).issues ?? [];
  }
}

async function ensureIssues() {
  const existing = await projectIssues();
  const bySummary = new Map(existing.map((i) => [i.fields.summary, i.key]));
  const out = [];
  for (const issue of ISSUES) {
    const key = bySummary.get(issue.summary);
    if (key) {
      out.push({ key, summary: issue.summary, action: 'existing' });
      continue;
    }
    const created = await call(JIRA, '/rest/api/3/issue', {
      method: 'POST',
      body: {
        fields: {
          project: { key: PROJECT_KEY },
          issuetype: { name: 'Task' },
          summary: issue.summary,
          labels: [LABEL],
          description: adf(issue.criterion, 'Synthetic acceptance criterion for DecisionFuse verification.'),
        },
      },
    });
    out.push({ key: created.key, summary: issue.summary, action: 'created' });
  }
  return out;
}

async function ensurePage() {
  const query = `/api/v2/pages?title=${encodeURIComponent(PAGE_TITLE)}&space-id=${SPACE_ID}&body-format=storage`;
  const found = await call(WIKI, query);
  const page = (found.results ?? [])[0];
  if (page) {
    return { id: page.id, version: page.version?.number, action: 'existing' };
  }
  const created = await call(WIKI, '/api/v2/pages', {
    method: 'POST',
    body: {
      spaceId: SPACE_ID,
      status: 'current',
      title: PAGE_TITLE,
      body: { representation: 'storage', value: storage() },
    },
  });
  return { id: created.id, version: created.version?.number, action: 'created' };
}

const me = await call(JIRA, '/rest/api/3/myself');
const project = await ensureProject(me.accountId);
const issues = await ensureIssues();
const page = await ensurePage();

console.log(
  JSON.stringify(
    {
      site: SITE.replace(/^https?:\/\//, ''),
      project,
      issues,
      page,
      block: { id: BLOCK.id, status: BLOCK.status, body: BLOCK.body },
      next: 'Open the DecisionFuse panel on the page and on an issue inside a signed-in browser.',
    },
    null,
    2,
  ),
);
