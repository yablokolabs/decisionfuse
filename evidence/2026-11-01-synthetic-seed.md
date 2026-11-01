# Synthetic scenario seed — 2026-11-01

The scenario the app is tested against is now reproducible: `scripts/seed-synthetic.mjs`
(`npm run seed:synthetic`). Before this, `DFS`, `DFS-1`–`DFS-3` and page `426003` had
only been created by hand over REST, so nothing could rebuild them.

## What it ensures

| Object | Values |
| --- | --- |
| Jira project | `DFS` "DecisionFuse Synthetic", software / Kanban, description marks it synthetic |
| Issue | `DFS-1` Guest checkout for first-time buyers — criterion `Guest checkout is enabled for first-time buyers.` |
| Issue | `DFS-2` Guest cart session expiry — criterion `Guest cart sessions expire after 60 minutes.` |
| Issue | `DFS-3` Order confirmation tax summary — criterion `Order confirmation shows the tax summary.` (unlinked control) |
| Confluence page | `Checkout decisions (synthetic)`, space id `393220`, version 1 |
| Decision block | `checkout-guest`, `status=accepted` |

Lookup is by summary and by page title, so a second run writes nothing. That is
deliberate for the page: rewriting it would bump the version and invalidate any
baseline the app stored against it.

## Run, 2026-11-01, `yablo.atlassian.net`

```
$ node --check scripts/seed-synthetic.mjs && echo "syntax: ok"
syntax: ok
$ npm run seed:synthetic
{
  "site": "yablo.atlassian.net",
  "project": { "key": "DFS", "action": "existing" },
  "issues": [
    { "key": "DFS-1", "summary": "Guest checkout for first-time buyers", "action": "existing" },
    { "key": "DFS-2", "summary": "Guest cart session expiry", "action": "existing" },
    { "key": "DFS-3", "summary": "Order confirmation tax summary", "action": "existing" }
  ],
  "page": { "id": "426003", "version": 1, "action": "existing" },
  "block": { "id": "checkout-guest", "status": "accepted", "body": "Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes." }
}
```

Every object reported `existing` and the page still reports **version 1**, so the
idempotency claim is observed rather than assumed.

Notes recorded while writing it: `POST /rest/api/3/project` with
`projectTemplateModuleKey` answers 400 on this tenant, so the script uses
`/rest/api/2/project` with `projectTemplateKey`. Issue search uses
`/rest/api/3/search/jql` with a fallback to `/rest/api/3/search`.

Credentials are read from `FORGE_EMAIL` / `FORGE_API_TOKEN` in the environment and
are never printed, logged or written to a file.

## What this does and does not prove

- **Proves:** the synthetic scenario is real, present on the site, and rebuildable
  by anyone with a token. Domain behaviour against that content is covered by
  `DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts`.
- **Does not prove:** the Forge runtime. The script acts as the calling user over
  REST. Registering a decision, linking criteria, rescanning and approving still
  run inside a signed-in browser session, and the Rovo agent and MCP tools still
  have no recorded invocation. Seeding data cannot close that gap — only an
  invocation can.
