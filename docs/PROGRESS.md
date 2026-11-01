# Progress
Status: M1 CORE IMPLEMENTED LOCALLY; NOT DEPLOYED, NOT INSTALLED, NO REAL-SITE PROOF.
Category: Software Teams. Bonus targets: Rovo first, MCP second; TWG and Marketplace conditional.

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
