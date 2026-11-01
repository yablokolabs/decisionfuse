# Forge runtime proof attempt — 2026-11-01 (failed, then reverted)

## Goal

Prove that register, rescan and the analysis engine run inside the Forge runtime, not only over REST from this
host. Those paths are otherwise reachable only from the panel in a signed-in browser, which this host does not have.

## Approach

A token-gated `webtrigger` module (`decisionfuse-smoke`) calling the same production code: `fetchPageText`,
`decisionForRegistration`, `analyzeBlock`, `fetchIssueSnapshot`, and installation-scoped Forge storage. The shared
token came from a Forge environment variable (`SMOKE_TOKEN`), compared inside the handler, and the handler returned
versions, counts and classifications only — never page text, titles or quotes.

## What happened

| Step | Command | Result |
| --- | --- | --- |
| Lint with the module | `forge lint` | `1 issue (0 errors, 0 warnings, 1 approval)`: *"This deployment triggers a major version upgrade … Change due to RoA trust signal loss"* `MAJOR_VERSION_RULE` |
| Deploy with the approval | `forge deploy --approve MAJOR_VERSION_RULE` | Deployed **3.0.0**; *"is not eligible for the Runs on Atlassian program"* |
| Create trigger before upgrading installs | `forge webtrigger create -f decisionfuse-smoke -s yablo.atlassian.net -p Confluence` | `Webtrigger 'decisionfuse-smoke' was not found in the provided installation context` |
| Upgrade both installs | `forge install --upgrade -p Jira` / `-p Confluence` | Both `✔ Upgrade complete!` |
| Create trigger | same command | URL issued: `https://42074d3d-…hello.atlassian-dev.net/x1/D0zo…` |
| Invoke without the token | `curl <url>` | **424 Failed Dependency** |
| Invoke with the token, `register=1` | `curl -H 'x-decisionfuse-token: …' '<url>?blockId=checkout-guest&pageId=426003&register=1'` | **424 Failed Dependency** |
| Invoke with an unknown block | `curl -H … '<url>?blockId=not-a-block&pageId=426003'` | **424 Failed Dependency** |
| Delete trigger | `forge webtrigger delete -f decisionfuse-smoke …` | CLI asked to rerun with `--verbose`; no URL listed afterwards |
| Revert module and handler | manifest + `src/index.ts` restored | `forge lint` → **No issues found** |
| Redeploy | `forge deploy -e development` | Deployed **3.1.0**, *"eligible for the Runs on Atlassian program"* |
| Eligibility | `forge eligibility -e development` | *"eligible for the Runs on Atlassian program"* |

## Conclusion

**The Forge runtime path is still not proven.** Every invocation returned `424` from the platform, before the
handler produced any response — no `401`, `200`, `400` or `404` came back, so the handler itself never ran. The 424
is not explained by this record; the trigger URL exists and the module was deployed, so the cause lies with Forge
trigger dispatch for this installation and was not diagnosed further.

Cost incurred and recovered: deploying the module dropped Runs on Atlassian eligibility at 3.0.0. Reverting the
module restored it at 3.1.0, confirmed by `forge eligibility`.

Housekeeping: the local token file was deleted and the `SMOKE_TOKEN` Forge variable was unset.

## What would actually prove it

1. A signed-in browser session loading the DecisionFuse panel on a real Jira issue or Confluence page, then
   Register → Link → Rescan → Propose → Approve. This also exercises `asUser()` permission delegation, which no
   server-side path can demonstrate.
2. An admin enabling the three MCP tools, then a supported MCP client calling them (see
   `evidence/2026-11-01-mcp-probe.md`).
