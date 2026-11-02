# Demo and pilot
Target video 3:45, strictly under five minutes. Real Forge app inside Atlassian, synthetic labeled project.
0:00-0:25: show a ready-to-ship ticket and linked old decision. Explain requirement drift and wasted effort without invented personal claims.
0:25-1:10: edit accepted Confluence decision: disable guest checkout. Trigger verified update/rescan.
1:10-2:00: show three different affected tasks plus unrelated control; reveal source diff and exact criterion evidence.
2:00-2:40: owner approves scoped proposal; verify native Jira record/audit. If comment-only, explicitly show it is a recommendation awaiting editing.
2:40-3:10: modify source again; attempt old approval; show stale rejection.
3:10-3:35: real Rovo query and a working read-only MCP tool **only if** an invocation has been recorded in docs/PROGRESS.md; otherwise spend this time on the core recovery flow and state on screen that bonuses are declared but unproven. Never film a tool call you cannot reproduce.
3:35-3:45: state present scope and pilot next step. No decorative end card/footer.

Pilot: one consenting engineering team, one project and 5-10 registered accepted decisions, suggested two weeks. Observe decisions changed, relevant findings, dismissed false alarms, review time and proposals accepted. Compare an agreed manual review baseline; do not equate ticket estimates with proven hours saved. Interview owner and developer. Stop writes on permission failures or conflict uncertainty. Do not claim users, partnerships or technical-debt reduction before evidence exists.

## Recording the panel run (needs a signed-in browser)

Full sequence with the expected strings, failure codes and evidence templates: [`PANEL_AND_MCP_RUNBOOK.md`](PANEL_AND_MCP_RUNBOOK.md). The short version follows.

This is the one gap the build host cannot close. Follow it in order on `yablo.atlassian.net`
and save what you see; the app writes only a comment, so nothing is closed or transitioned.

1. Open `https://yablo.atlassian.net/wiki/spaces/SD/pages/426003`, then the **DecisionFuse** byline panel. Register `checkout-guest`; it should show `accepted` at baseline v1.
2. Link `DFS-1` / `ac-1` (the guest-checkout criterion). Link `DFS-3` / `ac-1` as the control.
3. Edit the block to `Guest checkout is no longer enabled for first-time buyers.`, publish, then **Rescan**. Expect `DFS-1` flagged as obsolete scope, `DFS-2` reported unaffected, and no finding for `DFS-3`.
4. On `DFS-1`, open the DecisionFuse panel, choose **Propose correction**, and note the exact proposed text and its expiry.
5. Press **Approve and apply**. Expect a comment tagged `decisionfuse-proposal` on `DFS-1` and an `apply-succeeded` audit row.
6. Edit the page again, then approve a second proposal. Expect a `stale-source` refusal with no write — this is the guarantee worth showing.
7. Save the screenshots and the panel's JSON output as `evidence/<date>-panel-run.md`. Redact account ids that are not already public.
8. Only after that: Administration → Apps → Sites → site → Connected apps, enable the three tools, run one client call per tool, and record the redacted output next to the screenshots.
