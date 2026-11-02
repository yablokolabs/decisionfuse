# Devpost answers

Paste-ready text for the submission form. Every claim here is either verified in
`evidence/` or explicitly labelled as declared-and-not-demonstrated. Do not strengthen a
sentence without new evidence.

## Main technology requirement — Forge, integrated with Jira and Confluence

DecisionFuse is built on Atlassian's Forge platform and runs entirely inside Atlassian.
There is no external server, no hosted database, no model provider and no credential a
judge has to supply.

**Forge building blocks used**

- **Modules:** `jira:issuePanel`, `confluence:contentBylineItem`, five `function`
  entries, a `consumer` bound to the `decisionfuse-analysis` queue, three read-only
  `action` modules, `rovo:agent` and `rovo:mcp`.
- **Runtime:** `nodejs24.x`, 256 MB, arm64. The app is **eligible for the Runs on
  Atlassian program**, which means the code and the data stay inside Atlassian rather
  than calling out.
- **Storage:** `@forge/kvs` behind a repository layer. Forge storage is partitioned per
  installation, so a tenant is never a caller-supplied value.
- **UI:** Custom UI (`static/hello-world`) bridged to a resolver with `@forge/bridge`.
  The resolver is the only path from the interface to the platform.
- **Scopes:** `read:jira-work`, `write:jira-work`, `read:confluence-content.all`,
  `storage:app`. Confluence is **read-only by scope**, so the app cannot rewrite a
  decision page even by mistake.
- **Async work:** an idempotent consumer on a Forge queue runs the analysis; findings are
  keyed by a dedupe hash, so a replayed message writes nothing new.

**Products and what each does here**

| Product | Role in DecisionFuse |
| --- | --- |
| **Jira** | The review surface. The issue panel shows findings tied to that issue, reads the issue and its acceptance criteria, checks the reviewer's edit permission, and — only after a human approval — posts one marker-tagged comment with the exact amendment. It never transitions, closes or deletes anything. |
| **Confluence** | The source of truth. The byline panel registers a fenced decision block with an immutable baseline page version. The engine re-reads the page later and diffs against that baseline, so a decision that changed after review is detected rather than assumed. |
| **Rovo** | Declared, not demonstrated. `rovo:agent` with a review-only prompt and the same three read-only actions. It has never been invoked, so no Rovo eligibility is claimed. |
| **Forge MCP (`rovo:mcp`)** | Declared, not demonstrated. Exposes `inspect_decision_change`, `list_affected_work` and `get_proposal`. External exposure is off — the app endpoint returns 404 — so judges cannot call it and no MCP eligibility is claimed. |
| **Teamwork Graph** | Not used. Ordinary Jira and Confluence links are not graph evidence, so nothing is claimed. |
| **Jira Service Management** | Not integrated. The site has JSM; this app does not use it. |

**State of the build:** `forge lint` reports no issues for the full manifest; production
`2.0.0` is deployed and eligible for Runs on Atlassian; the app is installed separately
for Jira and Confluence on a development site; 49 offline tests cover the domain,
permissions, concurrency and reconciliation paths. The panel flow is deployed but has not
yet been exercised in a signed-in browser, which the README states rather than hides.

**Why Forge is the right home for this:** the problem is a cross-product consistency
problem. Registering a Confluence decision, comparing it over time, and correcting a Jira
criterion needs both products' data in one runtime, with the user's own permissions
applied at the moment of writing. Forge supplies that identity, that storage and that
audit path without hosting anything.
