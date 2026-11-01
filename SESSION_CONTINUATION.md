# Resume DecisionFuse
Read AGENTS.md, PROJECT_BUILD.md, docs/PROGRESS.md and the latest evidence before editing. Inspect git status and existing code. Never restart or overwrite work because the starter kit says not implemented; reconcile with the newest checkpoint.

## Current facts (2026-11-01)
- Repository: https://github.com/yablokolabs/decisionfuse (public, `main`). No attribution footers anywhere; keep it that way.
- Forge CLI 15.0.0, authenticated as Santhosh Balasa (ceo@yablokolabs.com). Developer Space `DecisionFuse` exists; app `ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4` registered from template `jira-issue-panel-custom-ui`.
- Local state: `forge lint` clean, `tsc --noEmit` clean, 34 vitest tests passing, review panel bundle builds with esbuild.
- Implemented but unproven: `rovo:agent` (`decisionfuse-agent`) and `rovo:mcp` (`decisionfuse-mcp`) plus three read-only `action` modules. Lint-clean, 40 tests passing, but never invoked. External MCP exposure needs a site admin to enable each tool per installation; endpoint form is `https://mcp.atlassian.com/forge/<appId>`.
- Not done: no `forge deploy`, no `forge install`, no live Jira or Confluence request has ever run, no Teamwork Graph, no Marketplace listing.
- Media: `assets/architecture.svg` + `.png` (rendered with Playwright headless shell); `videos/decisionfuse-demo` (Remotion 4.0.534, 2:35 timeline, logo in intro and outro, stills verified). Narration not recorded.
- Hindsight bank `decisionfuse` on port 8888 healthy; memory retained per checkpoint.

## Next executable actions
1. Owner names the authorized development site with both Jira and Confluence entitlements.
2. `forge deploy -e development`, then `forge install --site <site> --product Jira` and a separate Confluence install; verify the byline module appears (cross-product access is not implied by a Jira install).
3. Register a real decision block on a synthetic page, link one issue criterion, run `rescan`, and capture redacted evidence into `evidence/`.
4. Enable the three MCP tools for the installation in Atlassian Administration, connect a supported client, and record one redacted invocation of each tool plus a denied-access case.
5. Invoke the Rovo agent in chat for the three supported questions and record the transcripts with site ids redacted.

Update this file at every checkpoint with commit, milestone, exact commands/results, blockers and next step. No credentials or customer data.
