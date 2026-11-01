# Resume DecisionFuse
Read AGENTS.md, PROJECT_BUILD.md, docs/PROGRESS.md and the latest evidence before editing. Inspect git status and existing code. Never restart or overwrite work because the starter kit says not implemented; reconcile with the newest checkpoint.

## Current facts (2026-11-01)
- Repository: https://github.com/yablokolabs/decisionfuse (public, `main`). No attribution footers anywhere; keep it that way.
- Forge CLI 15.0.0. Keychain login lapses between sessions; `FORGE_EMAIL` + `FORGE_API_TOKEN` from `~/.hermes/.env` (`ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) authenticate without reinstall.
- Authorized development site: `yablo.atlassian.net` (owner's instruction). Products: Jira, Confluence, Jira Service Management, Customer Service Management.
- Deployed `development` v2.0.0 and installed for **both** products: Jira `e63b5663-a630-468b-883a-cfcaf946d437`, Confluence `ca73eaa3-ea71-4e76-a8e9-89cf74520fe2`.
- Synthetic site data: project `DFS` (software/Kanban), issues `DFS-1`, `DFS-2`, `DFS-3`, Confluence page `426003` in space `SD` with accepted block `checkout-guest` at version 1. Details in `evidence/2026-11-01-site-install.md`.
- Local state: `forge lint` clean, `tsc --noEmit` clean, 40 vitest tests passing, panel bundle builds with esbuild.
- `rovo:agent` (`decisionfuse-agent`) and `rovo:mcp` (`decisionfuse-mcp`) with three read-only actions are deployed but never invoked.
- `forge deploy` fails if `tsconfig.json` sets `noEmit: true` — Forge's ts-loader then emits nothing. Keep `noEmit` false and pass `--noEmit` in the npm scripts.

## Next executable actions
1. **Needs a human browser.** In Jira `DFS-1`, open the DecisionFuse panel: register `checkout-guest` against page `426003`, link `ac-1`, run `rescan`. Then edit the page so the block reads "guest checkout is disabled for first-time buyers" and rescan again.
2. Capture the panel output for `DFS-1`, `DFS-2` (both affected) and `DFS-3` (unaffected control) into `evidence/`, with site ids redacted.
3. Edit the page once more, then attempt the earlier approval to record a stale rejection.
4. Enable the three MCP tools per installation in Atlassian Administration, connect a supported client, record one redacted invocation each plus a denied-access case.
5. Invoke the Rovo agent in chat for the three supported questions and record transcripts.
6. Only after 1-5: mark Rovo/MCP eligibility verified, then regenerate the architecture PNG and re-render the video.

Update this file at every checkpoint with commit, milestone, exact commands/results, blockers and next step. No credentials or customer data.
