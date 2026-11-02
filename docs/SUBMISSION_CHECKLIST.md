# Submission readiness

## Submission status

The owner reports the Devpost form as **submitted on 2026-11-02**, with the installation
link, the public YouTube demo and the technology explanation. Bonus boxes were left
unticked (Rovo, MCP, Teamwork Graph, Marketplace) because none of those capabilities has a
recorded invocation or listing.

What remains is not a submission task, it is a risk check: **confirm the installation link
works for someone outside the owner's organization**, because that is the Access
requirement and it is the only thing judges will hit first. See
`docs/PANEL_AND_MCP_RUNBOOK.md` Part 0. Devpost normally allows edits until the deadline
(Dec 22, 2026), so bonuses remain addable later if an invocation is ever recorded.
Grounding: user's attached brief, archived in COMPETITION_BRIEF.txt. Check live rules again before submission.
- Main requirement: real Forge app integrating at least one eligible Atlassian product. Selected category Software Teams.
- All five judging criteria carry 20%: implementation, design, impact, innovation, presentation. Show proof for each, not speculative scores.
- Working installation link and complete judge setup/testing instructions. Check both Jira/Confluence access; use synthetic seed data and reset instructions.
- Public YouTube demo under five minutes. Show real app and any entered bonus capabilities.
- Technology explanation accurately distinguishes shipped, limited and planned features.
- Rovo bonus (Best Agents – Rovo/assignable agents): **do not select yet.** The `rovo:agent` module is declared and lint-clean, but it has never been invoked, so there is no conversation to show. It becomes selectable only after a real chat invocation of the three starter questions is recorded (runbook Part 3).
- MCP bonus (Best app with Atlassian MCP): **do not select yet.** The tools are declared, but external exposure is off — `https://mcp.atlassian.com/forge/<appId>` returns 404 and enabling it is a UI-only admin toggle with no documented API. It becomes selectable only after a real client lists and calls the tools (runbook Part 2).
- TWG bonus: actual graph API use or ingestion evidence, not native Jira links alone.
- Marketplace bonus: **not claimed and not applicable.** No listing, no review ticket. Submitting for Marketplace review would disable the installation link the judges use (documented on the Forge distribution page), so the field stays empty. `evidence/2026-11-02-marketplace-status.md` records the quote and the trade-off.
- Remove secrets, private records and unsupported claims. Keep licenses/disclosures.
- Deadline listing checked Nov 1: Dec 22 2026 12:00 PST / 20:00 UTC / Dec 23 01:30 IST. Reconfirm rules and eligibility.
- Publishing, messaging, Marketplace or competition submission only with user authorization.

## Submission facts

Copy-paste values for the Devpost form. Nothing here is a secret.

| Field | Value |
| --- | --- |
| App ID (Developer Console) | `42074d3d-8872-4475-850b-8a75eb4d10b4` |
| App ID (full ARI) | `ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4` |
| Developer console page | https://developer.atlassian.com/console/myapps/42074d3d-8872-4475-850b-8a75eb4d10b4 |
| Distribution page | https://developer.atlassian.com/console/myapps/42074d3d-8872-4475-850b-8a75eb4d10b4/manage/distribution |
| Installation link for judges | `docs/JUDGE_SETUP.md` (top of file) |
| Production version | 2.0.0, Runs on Atlassian eligible |
| Demo video | https://www.youtube.com/watch?v=nLg7tp5BkcY (2:23) |
| Judge testing instructions | `docs/JUDGE_SETUP.md`, linked in the submission |
| Marketplace | none; leave the bonus field empty |
| Main repo | https://github.com/yablokolabs/decisionfuse |

The UUID is the app id with the `ari:cloud:ecosystem::app/` prefix removed. If a form
rejects the bare id, paste the full ARI; if it rejects the ARI, paste the UUID. Both
identify the same app.

