# Resume DecisionFuse
Read AGENTS.md, PROJECT_BUILD.md, docs/PROGRESS.md and the latest evidence before editing. Inspect git status and existing code. Never restart or overwrite work because the starter kit says not implemented; reconcile with the newest checkpoint.

## Current facts (2026-11-01)
- Repository: https://github.com/yablokolabs/decisionfuse (public, `main`). No attribution footers anywhere; keep it that way.
- Forge CLI 15.0.0. Keychain login lapses between sessions; `FORGE_EMAIL` + `FORGE_API_TOKEN` from `~/.hermes/.env` (`ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) authenticate without reinstall. `python-dotenv` is **not** installed on this host — parse the file by hand and never print values.
- Authorized development site: `yablo.atlassian.net`. Products: Jira, Confluence, Jira Service Management, Customer Service Management.
- Deployed `development` **v2.3.0**, installed for both products: Jira `e63b5663-a630-468b-883a-cfcaf946d437`, Confluence `ca73eaa3-ea71-4e76-a8e9-89cf74520fe2`.
- Synthetic site data: project `DFS`, issues `DFS-1`, `DFS-2`, `DFS-3`; Confluence page `426003` (space `SD`, space id `393220`) with accepted block `checkout-guest` at v1. Live-check page `426019` sits beside it at v3.
- Local state: `forge lint` clean, `tsc --noEmit` clean, 49 offline tests, live-site suite gated behind `DECISIONFUSE_LIVE=1`, panel bundle builds with esbuild.
- `rovo:agent` and `rovo:mcp` with three read-only actions are deployed but never invoked. `https://mcp.atlassian.com/forge/<appId>` returns 404 (server OAuth metadata 200), so external exposure is off; the owner account holds `ADMINISTER`, and enabling is a UI toggle in Apps › Sites › site › Connected apps (evidence/2026-11-01-mcp-probe.md).
- Demo video: 3:23, silent. ElevenLabs returned 402 on synthesis, so `narration.json` and `scripts/voiceover.py` are ready but unused (evidence/2026-11-01-narration.md).
- `forge deploy` fails if `tsconfig.json` sets `noEmit: true` — Forge's ts-loader then emits nothing. Keep `noEmit` false and pass `--noEmit` in the npm scripts.

## What is proven, and what is not
- Proven: deployment, both installs, the byline module rendering on a real page, and — over REST against live content — baseline capture, drift detection on the affected criterion only (`DFS-2` reported `unaffected` after the subject fix), no finding on the unlinked control, exact proposal text, stale-source refusal with zero writes (evidence/2026-11-01-live-engine.md).
- Not proven: any resolver call through the Forge runtime, the queue consumer, Rovo agent invocation, MCP invocation and admin tool enablement. Denied-access paths are mocked only out of necessity: the site has no second account.

## Next executable actions
1. **Needs a human browser.** On page `426003`, open the DecisionFuse byline panel: Register `checkout-guest`, link `DFS-1`/`ac-1` and `DFS-3`/`ac-1`, then edit the block to "Guest checkout is no longer enabled for first-time buyers." and Rescan. Expect two findings, one of them the `DFS-3` control.
2. In the panel, press Propose correction, then Approve and apply. Capture the marker comment on `DFS-1` and the `apply-succeeded` audit row.
3. Edit the page again before approving a second proposal, to record the stale refusal through the real runtime.
4. Enable the three MCP tools per installation in Atlassian Administration, connect a supported client, record one redacted invocation each plus a denied case.
5. Invoke the Rovo agent in chat for the three supported questions and record transcripts.
6. Only after 1-5: mark Rovo/MCP eligibility verified, then regenerate the architecture PNG and re-render the video.
7. Fixed: `classifyChange` now compares the changed clause with the criterion's head nouns, so `DFS-2` is reported unaffected instead of flagged.

Update this file at every checkpoint with commit, milestone, exact commands/results, blockers and next step. No credentials or customer data.
