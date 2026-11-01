# Real-site evidence — 2026-11-01

Scope: deployment and installation on the owner-designated site, plus synthetic
data seeding. No review-loop invocation is recorded here yet; see Limitations.

## Site facts

| Item | Value | How it was checked |
| --- | --- | --- |
| Site | `yablo.atlassian.net` | named by the owner in session |
| Jira | reachable | `GET /rest/api/3/serverInfo` → 200 |
| Confluence | installed, caller-scoped | `GET /wiki/rest/api/space` → 200 with credentials; unauthenticated `/wiki/rest/api/content` → Confluence's own 403 |
| Jira Service Management | enabled | `GET /rest/servicedeskapi/servicedesk` → 200, `size: 0` |
| Jira projects before seeding | none | `GET /rest/api/3/project/search` → `total: 0` |
| Confluence spaces | `SD` (onboarding), one personal | `GET /wiki/rest/api/space` |

Products the owner listed were Jira Service Management and Customer Service
Management. Confluence is also present and is what the decision source needs.
No Customer Service Management project was created or tested.

## App deployment

Environment `development`, versions `2.0.0` then `2.1.0` (page-mode panel). Installation rows keep showing major version `2`, which is the major version of the install, not the deployment.

The Confluence byline module renders on the seeded page: page `426003` shows a `DecisionFuse (Development)` entry in the byline, which confirms the Confluence install is live and the module resolves on a real page.

```
$ forge deploy -e development --non-interactive
Running forge lint...
No issues found.
✔ Deployed
ℹ The version of your app [2.0.0] ... is eligible for the Runs on Atlassian program.
```

First attempt failed with `TypeScript emitted no output for src/index.ts` because
`tsconfig.json` set `noEmit: true`. Fixed by setting `noEmit: false` and moving
`--noEmit` to the `typecheck`/`build` scripts.

## App installations

```
$ forge install list -s yablo.atlassian.net
ca73eaa3-ea71-4e76-a8e9-89cf74520fe2  development  Site  yablo.atlassian.net: Confluence  v2  Up-to-date
e63b5663-a630-468b-883a-cfcaf946d437  development  Site  yablo.atlassian.net: Jira        v2  Up-to-date
```

Cross-product behaviour confirmed in practice: the Jira install reported
`We detected your app requires scopes across multiple Atlassian apps` and
required a separate `forge install -p Confluence`. A Jira install did not grant
Confluence access.

## Synthetic data created on the site

| Object | Value |
| --- | --- |
| Jira project | `DFS` "DecisionFuse Synthetic", software / Kanban, description marks it synthetic |
| Issue | `DFS-1` Guest checkout for first-time buyers |
| Issue | `DFS-2` Guest cart session expiry |
| Issue | `DFS-3` Order confirmation tax summary (intended unaffected control) |
| Confluence page | `426003` "Checkout decisions (synthetic)", space `SD`, version 1 |
| Decision block | `checkout-guest`, `status=accepted`, present in page storage body |

Project creation note: `POST /rest/api/3/project` with
`projectTemplateModuleKey` returned `400 Invalid request payload`. The same
request to `/rest/api/2/project` with `projectTemplateKey:
com.pyxis.greenhopper.jira:gh-simplified-agility-kanban` returned `201`.
Recorded because the v3 shape is widely documented and does not work here.

Account permissions observed: `ADMINISTER: true`, `ADMINISTER_PROJECTS: false`,
`BROWSE_PROJECTS: false` (site-level check, which is false when no project
existed yet), `CREATE_ISSUES: false` (same reason). Issue creation as project
lead returned `201` for all three issues.

## Limitations

- No review-loop invocation is recorded. Registering a decision, linking a
  criterion, rescanning and approving all run through the Forge resolver, which
  is invoked from the Jira issue panel inside a signed-in browser session. No
  browser session is available to this host, so those calls have not run.
- The Rovo agent and the three MCP tools are installed but have never been
  invoked. External MCP exposure is disabled until a site admin enables each
  tool, and no supported MCP client has been connected.
- No test accounts for "reviewer without write permission" or "user denied
  source access" exist. Both would need additional Atlassian accounts on the
  site; the permission code paths are covered only by the mocked tests in
  `tests/tools.test.ts`.
- Nothing was written to Jira or Confluence by the app itself. All objects above
  were created by direct REST calls as the owner, to prepare the scenario.
