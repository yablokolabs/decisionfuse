# Progress
Status: DEPLOYED AND INSTALLED ON `yablo.atlassian.net` (Jira + Confluence, development v3.1.0, eligible for Runs on Atlassian). Engine, proposal and approval gate have run against live site content, including the unaffected-control rule; the Forge-runtime invocation, Rovo agent call and MCP call are still unproven — they need a signed-in browser session or an admin.
Category: Software Teams. Bonus targets: Rovo first, MCP second; TWG and Marketplace conditional.

## Checkpoint — 2026-11-01 ~22:00 UTC / working tree after `e74b210` / milestone M8 (test hygiene, permissions fixture, theme-safe logo)
Changed:
- `tests/live-site.test.ts`: `beforeAll` runs `scripts/seed-synthetic.mjs`, `afterAll` deletes the page the run created. The suite no longer depends on hand-made content and no longer accumulates orphan pages.
- `scripts/fixture-permissions.mjs` (new): verifies owner-side access (edit permission on `DFS-1`, readable `426003` at v1 with the block present) and then exits **3**, naming the second identity it needs. The restriction path is written but has never executed.
- `assets/decisionfuse-logo-dark.png` + README `<picture>`: the logo is RGBA dark-navy artwork, invisible on GitHub's dark theme. PIL is not installed on this host, so the dark variant is an ffmpeg light-plate composite rather than a recolour.
Checks actually run: `npx vitest run` → 6 files passed, 1 skipped, **49 tests**; `DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts` → 1 passed (4.0s) with **post-run leftovers `[]`**; three pre-existing orphan pages `426019`/`393458`/`262291` deleted (204 each) and a follow-up CQL search returned `[]`; `node scripts/fixture-permissions.mjs` → exit 3, `status: blocked`, owner control values recorded.
Capability status: unchanged where it matters — the Forge runtime, Rovo agent and MCP tools are still uninvoked, and both denied-access paths are still mocked-only.
Next executable action: unchanged — panel click-through in a signed-in browser, then the admin MCP toggle.

## Checkpoint — 2026-11-01 ~21:15 UTC / working tree after `37ae687` / milestone M7 (reproducible synthetic scenario)
Changed:
- `scripts/seed-synthetic.mjs` (new) and `npm run seed:synthetic`: idempotent seeding of project `DFS`, issues `DFS-1`–`DFS-3` and page `426003` holding block `checkout-guest`. Objects are found by summary and page title, so a re-run writes nothing and cannot bump the page version that a stored baseline depends on.
- The scenario previously existed only because it was created by hand over REST, which meant nobody could rebuild it after the live check mutated pages.
Checks actually run: `node --check scripts/seed-synthetic.mjs` → `syntax: ok`; `npm run seed:synthetic` against `yablo.atlassian.net` → exit 0, every object `existing`, page still **version 1** (`evidence/2026-11-01-synthetic-seed.md`).
Capability status: the synthetic scenario is rebuildable by anyone holding a token. Seeding is REST as the calling user, so the Forge-runtime resolver path, the Rovo agent and the MCP tools remain **unproven**.
Next executable action: unchanged — panel click-through on page `426003` and `DFS-1` in a signed-in browser, then the admin MCP toggle.

## Checkpoint — 2026-11-01 ~20:40 UTC / working tree after `e0c1ce8` plus uncommitted changes / milestone M6 (classifier fix, MCP probe, demo scenes)
Changed:
- `src/domain/classify.ts`: new `changedClause()` and `subjectTokens()`. A withdrawal now only flags a criterion whose head nouns sit in the changed clause; a criterion in an untouched clause is reported `unaffected`. This replaces a keyword test that matched against the whole block, which is why `DFS-2` was a false positive.
- `src/queue/engine.ts`: unaffected findings are persisted with lifecycle `analyzed` (never queued for review) and retire any older `needs-review` finding for the same issue and criterion.
- Tests: three classifier cases and one engine case for the control path; the gated live suite now asserts `DFS-2` is `unaffected`/`analyzed` and only `DFS-1` is queued.
- `videos/decisionfuse-demo`: storyboard now 3:23 with an `Architecture` scene (trimmed diagram) and a `Recorded run` scene carrying the real page, finding, quote, proposal and stale refusal; `scripts/trim.mjs` trims the PNG with ffmpeg; `narration.json` + `scripts/voiceover.py` prepared for narration.
Checks actually run: `npx tsc --noEmit` → 0; `npx vitest run` → 6 files / 49 tests; `DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts` → 1 passed (4.0s), findings now `['DFS-1']` only, `DFS-2` recorded `unaffected`/`analyzed`, `DFS-3` unlinked, proposal text unchanged, stale refusal `stale-source` with `writes: 0`; `forge lint` → No issues found; `forge deploy -e development` → `✔ Deployed` 2.3.0; video `npx tsc -p .` → 0.
MCP probe (`evidence/2026-11-01-mcp-probe.md`): `mcp.atlassian.com/forge/<appId>` → **404**, `/.well-known/oauth-protected-resource` → 404, server OAuth metadata → 200. The owner account holds `ADMINISTER`, so rights are not the blocker; external exposure is off and the documented toggle is UI-only.
Narration: ElevenLabs refused synthesis with **402** — free tier at 9907/10000 characters — so the same lines were spoken locally by piper `en_GB-alba-medium` and muxed into the render: **AAC mono 44.1 kHz, 203.00 s**, one clip per scene, `atempo` 1.07 on the single overrunning scene, video stream copied (`scripts/narrate-local.py`, `evidence/2026-11-01-narration.md`). No paid plan and no hosted provider fallback.
Render: `npx remotion render Video out/video.mp4 --concurrency=4` completed; `ffprobe` reports **203.0 s** (3:23), inside the five-minute cap. Scene stills inspected before rendering (`stills/chk7/sheet.jpg`).
Runtime proof attempt (failed, then reverted): a token-gated `webtrigger` was added to run `analyzeBlock` inside Forge. Deploying it required `--approve MAJOR_VERSION_RULE` and **dropped Runs on Atlassian eligibility at 3.0.0**; after upgrading both installs a trigger URL was issued, but all three invocations returned **424 Failed Dependency** with no handler output. Module and handler were reverted, redeployed **3.1.0**, `forge lint` clean and `forge eligibility` reports eligible again. Detail: `evidence/2026-11-01-runtime-proof-attempt.md`. The runtime path stays unproven.
Next executable action: enable the three MCP tools in Atlassian Administration, connect a supported client and record one redacted invocation; then click the panel path through the Forge runtime.

## Checkpoint — 2026-11-01 ~19:25 UTC / working tree after `d38ab63` / milestone M5 (proposal + approval reachable, live engine proof)
Changed:
- `src/domain/propose.ts` (new): deterministic proposal builder. Replaces only the criterion sentence that shares the decision's subject, preserves the rest, refuses when no subject is shared, when the finding is stale, or when the change leaves the text identical. No model involved.
- `src/index.ts`: new `proposeForFinding` resolver (re-reads source and issue, refuses to propose against drift) and `listAudit`; `approveAndApply` now resolves the finding across decision blocks instead of a non-existent `block:` prefix, so the approval path is reachable at all.
- `src/storage/repository.ts`: `putDecision` now maintains the decision list; without it the issue panel and the approval lookup saw an empty list.
- `src/domain/issue-text.ts` (new): ADF and criterion parsing split out of the platform adapter so it runs off-platform; `src/services/jira.ts` re-exports it.
- `static/hello-world/src/index.tsx`: each finding now has Propose correction → exact text, expiry and single-use Approve and apply; dismissal uses the finding's real block id and dedupe key (both were read from the wrong fields, so dismiss was broken).
- `tests/propose.test.ts` (6 tests) and `tests/live-site.test.ts` (gated real-site suite).
Checks actually run: `npx tsc --noEmit` → 0; `npx vitest run` → 6 files / 46 tests; `DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts` → 1 passed (4.1s) against `yablo.atlassian.net`; `forge lint` → No issues found; UI bundle 242.2kb; `forge deploy -e development` → `✔ Deployed` 2.2.0.
Live-site result: new page seeded, decision withdrawn at v2, findings raised for `DFS-1` (obsolete-scope, high) and `DFS-2` (obsolete-scope, medium), none for the unlinked `DFS-3`; proposal `Out of scope: Guest checkout is no longer enabled for first-time buyers.`; page moved to v3 → approval rejected `stale-source`, `writes: 0`, audit row `approval-rejected`, no `decisionfuse-proposal` comment on `DFS-1`.
Known limitation from that run: `DFS-2` is a false positive (its session-expiry criterion is untouched by the withdrawal). The classifier has no notion of "criterion subject untouched"; the reviewer dismisses it, but it is noise a stricter rule should remove.
Capability status: domain, proposal and approval gate — verified against live content over REST. Forge-runtime resolvers, Rovo agent and MCP — still never invoked.
Next executable action: owner opens the DecisionFuse byline panel on page `426003`, registers `checkout-guest`, links `DFS-1`/`ac-1` and `DFS-3`/`ac-1`, edits the block to "no longer enabled" and rescans, then proposes and approves in the panel.

## Checkpoint — 2026-11-01 ~18:40 UTC / working tree after `e6d63b0` / milestone M3 (page panel)
Changed:
- `src/index.ts`: new `pageBlocks` resolver; `context` now returns the Confluence `pageId`; `linkIssue` validates block id, issue key and criterion id.
- Storage partition fix: resolvers were writing to a per-cloud-id partition while the Rovo/MCP tools read the installation partition, so tools could never have seen panel data. Both now use `INSTALLATION_SCOPE`.
- `static/hello-world/src/index.tsx`: page mode for the Confluence byline item — lists fenced blocks with status and baseline, Register/Re-baseline, Rescan, explicit link form and the finding list. Jira issue mode unchanged.
Checks actually run: `npx tsc --noEmit` → 0; `npx vitest run` → 5 files / 40 tests; `forge lint` → No issues found; `npm run build` (UI) → `build/app.js 240.3kb`; `forge deploy -e development` → `✔ Deployed` v2.1.0.
Capability status: panel now covers the register/link/rescan path on a real Confluence page. Still no invocation recorded end to end — the owner confirmed the byline item renders, but the panel has not been clicked through with data in it.
Next executable action: owner reloads page `426003`, opens the DecisionFuse byline panel, registers `checkout-guest`, links `DFS-1`/`ac-1`, rescans; then edit the block to "guest checkout is disabled" and rescan again.

## Checkpoint — 2026-11-01 ~18:20 UTC / working tree after `3062cc2` / milestone M2 (deployed + installed)
Changed:
- `tsconfig.json` `noEmit` false; `build` script now `tsc --noEmit`. Forge's ts-loader emitted no output with `noEmit: true`, which failed `forge deploy`.
- Deployed `development` v2.0.0. Installed separately for Jira (`e63b5663-a630-468b-883a-cfcaf946d437`) and Confluence (`ca73eaa3-ea71-4e76-a8e9-89cf74520fe2`) on `yablo.atlassian.net` by the owner's instruction.
- Seeded synthetic site data: project `DFS`, issues `DFS-1`/`DFS-2`/`DFS-3`, Confluence page `426003` in space `SD` holding accepted block `checkout-guest` at version 1.
- `evidence/2026-11-01-site-install.md` records the commands, ids and limitations.
Checks actually run: `forge deploy` → `✔ Deployed`; `forge install -p Jira` → complete; `forge install -p Confluence` → complete; `forge install list` → both rows `Up-to-date`; REST probes → Jira 200, Confluence 200 authenticated / 403 unauthenticated, JSM 200; project create `201`; three issues `201`; page create `200`; block marker confirmed in storage body.
Capability status: deployed and installed — verified. Review loop, Rovo agent and MCP tools — declared and installed, **never invoked**.
Open issue: resolver calls (register, link, rescan, approve) are reachable only from the Jira issue panel in a signed-in browser; this host has no browser session.
Next executable action: a human opens the DecisionFuse panel on `DFS-1`, registers `checkout-guest` on page `426003`, links `ac-1`, rescans, then edits the page to "guest checkout is disabled" and rescanning again; capture the panel output into `evidence/`.

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
