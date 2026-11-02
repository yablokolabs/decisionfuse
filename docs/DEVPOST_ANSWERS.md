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

## Experience building with Forge

### What worked well

- **The manifest is a real contract, and `forge lint` enforces it.** A malformed
  `consumer` module was caught before deploy instead of at runtime. That feedback loop is
  fast enough to shape design.
- **The resolver boundary made the safety rule structural.** Custom UI can only call
  `invoke()`; identity arrives in `req.context`, never in the payload. "A model may
  propose, only a permitted human approves a write" became one narrow path instead of a
  convention people have to remember.
- **`@forge/kvs` is installation-scoped, so tenant isolation was free** — no tenant
  parameter to validate, no tenant column to leak. I deleted a per-cloud-id partition I
  had written first, because it was strictly worse than the platform's own boundary.
- **The queue consumer made replay safety cheap.** One dedupe key per finding and a
  replayed message writes nothing new.
- **Runs on Atlassian turns "stays inside Atlassian" into a testable claim.** `forge
  eligibility` returns a yes or no instead of a promise.

### What I struggled with

1. **No way to invoke a resolver without a browser.** This is the biggest gap. Register,
   link, rescan, propose and approve are all resolver calls reachable only from the panel.
   I tried a token-gated `webtrigger` as a browser-free hook: deploying it required
   `--approve MAJOR_VERSION_RULE`, that dropped Runs on Atlassian eligibility, and every
   call then returned `424` without reaching the handler. I reverted it. The review loop
   is covered by tests and by a REST harness, but it has never run on the platform.
2. **Important controls are UI-only.** MCP exposure is an admin toggle with no API, and
   `https://mcp.atlassian.com/forge/<appId>` returns the same `404` whether the app is
   broken or simply not exposed. Those are different problems; I could only tell them
   apart by probing the server's OAuth metadata.
3. **Version numbers are per environment.** The same code sat at `3.1.0` in development
   and `2.0.0` in production. Correct, but it reads like two different builds in a demo.
4. **A silent build failure.** With `noEmit: true` in `tsconfig.json`, Forge's ts-loader
   emitted nothing and the deploy failed with no useful message. Cost an hour.
5. **Storage partition semantics were ambiguous in practice.** The panel wrote to one
   partition while the action handlers read another: the data existed and was invisible.
   Nothing was wrong except my reading, which is exactly the kind of bug that is invisible
   until you trace both paths.
6. **Distribution and Marketplace conflict late.** Registering for Marketplace listing
   voids the installation link — a real constraint, but I found it while filling a form,
   not while planning distribution.

### What I'd improve

1. **A supported way to invoke resolver functions as a chosen identity after install**,
   so panel logic can run in CI. A `forge invoke` for post-install resolvers would have
   changed this build more than any other single feature.
2. **APIs for distribution and MCP enablement**, returning explicit state — "exposed,
   enabled, zero tools" — instead of a bare `404`.
3. **Warn before deploy when a change drops Runs on Atlassian eligibility**, in lint,
   rather than after the deploy has already happened.
4. **Fail loudly when ts-loader emits nothing.** One sentence in the error output would
   have saved the hour I spent on it.
5. **State storage partitioning in one sentence, with the panel-versus-action example.**
   It is the most consequential platform detail I got wrong.
6. **Surface the installation-link/Marketplace-listing exclusivity when a listing is
   created**, not in a distribution document read days later.

None of this changes my answer to "would you use Forge again": yes. The constraints that
caused friction — permissions, isolation, no hosting, no arbitrary egress — are the same
constraints that make the app auditable. I would just like the review loop to be testable
without a browser.
