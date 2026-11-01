# Progress
Status: M1 CORE + ROVO/MCP MODULES IMPLEMENTED LOCALLY; NOT DEPLOYED, NOT INSTALLED, NO REAL-SITE PROOF, NO TOOL INVOCATION.
Category: Software Teams. Bonus targets: Rovo first, MCP second; TWG and Marketplace conditional.

## Checkpoint — 2026-11-01 ~17:40 UTC / working tree after `4395204` / milestone M4 (modules declared)
Changed:
- `manifest.yml`: three `action` modules (`inspect_decision_change`, `list_affected_work`, `get_proposal`) on dedicated functions, one `rovo:agent`, one `rovo:mcp`. Contracts read from the official Rovo Agent (Oct 2 2026) and Rovo MCP (Oct 29 2026) pages.
- `src/actions/tools.ts`: shared read-only tool layer. Installation-scoped storage, identifier allow-lists, fail-closed source and issue permission checks, no approval or mutation surface.
- `tests/tools.test.ts`: denied source, withheld issues, invalid inputs, installation isolation, and no-approval assertions.
Checks actually run: `npx tsc --noEmit` → exit 0; `npx vitest run` → 5 files / 40 tests; `forge lint` → No issues found.
Capability status: Rovo agent and MCP server **declared and lint-clean, never invoked**; bonus eligibility unclaimed. Teamwork Graph unverified and unused. No deployment, so nothing is judge-testable yet.
Open issue: no authorized site → cannot deploy, install, enable MCP exposure or record a real invocation.
Next executable action: deploy to the chosen development site, install for Jira and Confluence separately, then exercise `list_affected_work` from a real client and record redacted evidence here.

## Checkpoint — 2026-11-01 ~17:25 UTC / commit `fc2f1bc` + working tree / milestone M1 (local)
Changed:
- Forge app registered (`ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4`) in Developer Space `DecisionFuse`.
- `manifest.yml` with `jira:issuePanel`, `confluence:contentBylineItem`, resolver, consumer on queue `decisionfuse-analysis`. Runtime `nodejs24.x`, scopes `read:jira-work`, `write:jira-work`, `read:confluence-content.all`, `storage:app`.
- TypeScript domain: `src/domain/{types,text,classify,evidence,approval}.ts`; `src/queue/engine.ts`; `src/review/apply.ts`; `src/services/{jira,confluence}.ts`; `src/storage/{repository,forge-kv}.ts`; `src/index.ts` resolvers and consumer.
- Review panel `static/hello-world` rebuilt with esbuild (react-scripts 5 + React 16 could not resolve peer deps).
- Media: `assets/architecture.svg` (brand tokens), video project `videos/decisionfuse-demo` (Remotion, 2:35, logo in intro and outro).

Checks actually run (command → result):
- `forge --version` → `15.0.0`; `forge whoami` → logged in as Santhosh Balasa (ceo@yablokolabs.com).
- `forge lint` → `No issues found` (after fixing the consumer module shape).
- `npx tsc --noEmit` → exit 0.
- `npx vitest run` → 4 files, **34 tests passed**.
- `cd static/hello-world && npm run build` → `build/app.js 235.6kb`, `build/index.html`.
- `node scripts/stills.mjs b1 3 14 30 50 75 100 145` → 8 stills + contact sheet inspected.
- `forge create` initially failed: not a member of a Developer Space; resolved by creating `DecisionFuse` via a PTY session.

Evidence path: `videos/decisionfuse-demo/stills/b1/sheet.jpg`; no real-site evidence exists yet.

Capability status:
- working (local only): domain state machine, evidence gate, approval gate, replay dedupe, tenant partition, reconcile-before-retry.
- blocked: deployment and installation (no site chosen by the owner), all live Jira/Confluence calls.
- planned, not started: Rovo agent, Forge MCP tools, Teamwork Graph, Marketplace.

Open issue: location `src/index.ts` resolvers → cause no live site to exercise them → next fix deploy to a chosen development site and run the M0 read path.
Next executable action: owner names the authorized site with Jira + Confluence entitlements; then `forge deploy -e development` and `forge install --site <site> --product Jira` plus a separate Confluence install, and verify cross-product module availability.
