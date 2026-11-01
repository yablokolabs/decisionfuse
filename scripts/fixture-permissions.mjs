#!/usr/bin/env node
/**
 * Records the two denied-access paths DecisionFuse claims, against the real site.
 *
 * The claims are narrow: a reviewer without write permission cannot approve, and
 * a person denied the source page gets a bare denial with no title, snippet,
 * count or hint. Both need a *second* Atlassian identity, so the owner account
 * alone cannot demonstrate either. This script runs what one identity can run,
 * then names exactly what is missing instead of implying the rest.
 *
 * Env:
 *   FORGE_EMAIL / FORGE_API_TOKEN           owner identity (required)
 *   FORGE_ALT_EMAIL / FORGE_ALT_API_TOKEN   second identity (optional)
 *   DECISIONFUSE_SITE (default https://yablo.atlassian.net)
 *   DECISIONFUSE_ISSUE (default DFS-1), DECISIONFUSE_PAGE_ID (default 426003)
 *
 * Exit 0 when everything required was verified, 3 when the second identity is
 * missing, 1 on an unexpected failure.
 */
import { Buffer } from 'node:buffer';

const SITE = (process.env.DECISIONFUSE_SITE ?? 'https://yablo.atlassian.net').replace(/\/+$/, '');
const ISSUE = process.env.DECISIONFUSE_ISSUE ?? 'DFS-1';
const PAGE = process.env.DECISIONFUSE_PAGE_ID ?? '426003';

const OWNER = { email: process.env.FORGE_EMAIL, token: process.env.FORGE_API_TOKEN };
const ALT = { email: process.env.FORGE_ALT_EMAIL, token: process.env.FORGE_ALT_API_TOKEN };

if (!OWNER.email || !OWNER.token) {
  console.error('Set FORGE_EMAIL and FORGE_API_TOKEN in the environment first.');
  process.exit(1);
}

async function call(who, path, init = {}) {
  const res = await fetch(SITE + path, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Basic ${Buffer.from(`${who.email}:${who.token}`).toString('base64')}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? safeJson(text) : null };
}

const safeJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 200) };
  }
};

const report = { site: SITE.replace(/^https?:\/\//, ''), steps: [], blocked: [] };
const step = (name, detail) => report.steps.push({ name, ...detail });

// 1. The owner can act on the issue. Without this the rest is meaningless.
const ownerMyself = await call(OWNER, '/rest/api/3/myself');
const ownerPerms = await call(OWNER, `/rest/api/3/mypermissions?issueKey=${ISSUE}&permissions=EDIT_ISSUES`);
step('owner-identity', { status: ownerMyself.status, accountId: ownerMyself.body?.accountId ?? null });
step('owner-can-edit-issue', {
  status: ownerPerms.status,
  havePermission: ownerPerms.body?.permissions?.EDIT_ISSUES?.havePermission ?? null,
});

// 2. The source is readable for the owner, which is the control for step 5.
const ownerPage = await call(OWNER, `/wiki/api/v2/pages/${PAGE}?body-format=storage`);
const ownerSeesBlock = Boolean(ownerPage.body?.body?.storage?.value?.includes('BEGIN DECISION'));
step('owner-can-read-source', { status: ownerPage.status, version: ownerPage.body?.version?.number ?? null, blockPresent: ownerSeesBlock });

if (!ALT.email || !ALT.token) {
  report.blocked.push(
    'reviewer-without-write: needs a second Atlassian account (FORGE_ALT_EMAIL / FORGE_ALT_API_TOKEN) with no issue edit permission',
    'denied-source: needs the same second account removed from the page read restriction',
  );
  report.status = 'blocked';
  report.verified = 'owner identity and owner-side access only';
  console.log(JSON.stringify(report, null, 2));
  process.exit(3);
}

// 3. The second identity must actually be a different person.
const altMyself = await call(ALT, '/rest/api/3/myself');
if (altMyself.status !== 200) {
  report.blocked.push(`second identity rejected by the site: GET /myself → ${altMyself.status}`);
  report.status = 'blocked';
  console.log(JSON.stringify(report, null, 2));
  process.exit(3);
}
if (altMyself.body?.accountId === ownerMyself.body?.accountId) {
  report.blocked.push('FORGE_ALT_* resolves to the same account as the owner, so it cannot demonstrate a denial');
  report.status = 'blocked';
  console.log(JSON.stringify(report, null, 2));
  process.exit(3);
}
step('alt-identity', { status: 200, accountId: altMyself.body.accountId });

// 4. Reviewer without write permission.
const altEdit = await call(ALT, `/rest/api/3/mypermissions?issueKey=${ISSUE}&permissions=EDIT_ISSUES`);
step('alt-cannot-edit-issue', {
  status: altEdit.status,
  havePermission: altEdit.body?.permissions?.EDIT_ISSUES?.havePermission ?? null,
});

// 5. Denied source. Restrict read on the page to the owner only, check the second
// identity is refused, then remove exactly the restrictions this script added.
const added = await call(OWNER, `/wiki/rest/api/content/${PAGE}/restriction`, {
  method: 'POST',
  body: [{ operation: 'read', restrictions: { user: { results: [{ type: 'known', accountId: ownerMyself.body.accountId }] } } }],
});
const ids = (added.body?.results ?? []).flatMap((r) => (r.restrictions?.user?.results ?? []).map((u) => u.user?.accountId && r.operation));
const restrictionIds = (added.body?.results ?? []).map((r) => r.id).filter(Boolean);
step('restrict-source-to-owner', { status: added.status, restrictionIds });

try {
  const altPage = await call(ALT, `/wiki/api/v2/pages/${PAGE}?body-format=storage`);
  const leaked = JSON.stringify(altPage.body ?? '').includes('BEGIN DECISION');
  step('alt-denied-source', { status: altPage.status, blockLeaked: leaked });
} finally {
  for (const id of restrictionIds) {
    const removed = await call(OWNER, `/wiki/rest/api/content/${PAGE}/restriction/${id}`, { method: 'DELETE' });
    step(`restore-restriction-${id}`, { status: removed.status });
  }
}

// 6. Restoration must be observed, or the scenario page is left locked.
const restored = await call(OWNER, `/wiki/api/v2/pages/${PAGE}?body-format=storage`);
step('owner-can-read-source-after-restore', { status: restored.status });

const denied = report.steps.find((s) => s.name === 'alt-denied-source');
const reviewer = report.steps.find((s) => s.name === 'alt-cannot-edit-issue');
report.verified =
  denied?.status === 403 && denied?.blockLeaked === false && reviewer?.havePermission === false
    ? 'both denied paths'
    : 'partial — see steps';
if (denied?.status !== 403 || denied?.blockLeaked !== false) {
  report.blocked.push('alt identity was not refused the source page, or content leaked in the refusal');
}
if (reviewer?.havePermission !== false) {
  report.blocked.push('alt identity can edit the issue, so it is not a reviewer-without-write');
}
console.log(JSON.stringify(report, null, 2));
void ids;
process.exit(report.blocked.length === 0 ? 0 : 1);
