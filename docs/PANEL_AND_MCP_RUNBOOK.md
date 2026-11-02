# Owner runbook — panel click-through and MCP invocation

Two things are unproven because they need a signed-in human, not this build host:
the review loop running through the Forge runtime, and the `rovo:mcp` tools being
invoked by a client. This file is the exact sequence for both, with the strings the
product actually produces so you can tell a pass from a failure.

Site: `yablo.atlassian.net`. App: `ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4`.
Page: `426003` in space `SD`. Issues: `DFS-1` (affected), `DFS-2` (unaffected control), `DFS-3` (unlinked control).

## 0. Pre-flight (2 minutes)

1. `npm run seed:synthetic` — idempotent. Every object should report `existing`, and the page should stay at **version 1**. If it rewrites the page, stop: the stored baseline in a previous run is now meaningless.
2. Open `https://yablo.atlassian.net/wiki/spaces/SD/pages/426003`. The body must contain:

   ```
   BEGIN DECISION checkout-guest status=accepted
   Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.
   END DECISION
   ```

3. If the block text is already edited from that wording, set it back and publish before registering. Registering a changed block baselines the change, and there is then no drift to find.

## Part 1 — the panel run (needs a signed-in browser)

Order matters: register, link, then edit the page, then rescan. An edit before
registration is not drift, it is the new baseline.

1. **Open the byline panel.** Page `426003` → **DecisionFuse** byline item.
   Expected header: `Page 426003 · version 1. Decisions are fenced blocks; only accepted blocks are actionable.`
   Expected block row: `checkout-guest`, chip `accepted`, chip `not registered`, and the block preview.
2. **Register.** Press **Register**.
   Expected: `Registered checkout-guest.` and the chip changes to `baseline v1`. This stores the accepted text and its page version. Capture the screenshot here — this is the first Forge-runtime invocation of the build.
3. **Sanity check before linking.** Press **Rescan** now, with the page unchanged.
   Expected: `Rescanned checkout-guest.` and `No drift found for the linked decisions at their current versions.` If anything is already flagged, the baseline and the page disagree — re-baseline and repeat.
4. **Link `DFS-1`.** In **Link one issue criterion**: select block `checkout-guest`, issue key `DFS-1`, criterion `ac-1`, press **Link**.
   Expected: `Linked DFS-1 ac-1 to checkout-guest.` The button stays disabled unless all three values are valid (`DFS-1` matches `^[A-Z][A-Z0-9_]{0,15}-\d{1,9}$`, `ac-1` matches `^ac-\d{1,4}$`).
5. **Link the control `DFS-3`** the same way: block `checkout-guest`, `DFS-3`, `ac-1`, **Link**. This is the issue that must stay silent at the end. Do not link `DFS-2`; it is already linked from seeding and is the "unaffected" control.
6. **Edit the decision.** In the page body change only the first sentence to:
   `Guest checkout is no longer enabled for first-time buyers.`
   leaving the cart-session sentence untouched. Publish. The page version becomes 2.
7. **Rescan.** Press **Rescan** on the block.
   Expected: `Rescanned checkout-guest.` and `N findings need review.`
   - `DFS-1` — **Obsolete scope**, high confidence, rationale naming the withdrawal, and a monospace quote of the changed source span, footer `DFS-1 · ac-1 · source v2`.
   - No finding for `DFS-3` (never linked content changed) and none for `DFS-2` (its criterion sits in the untouched clause).
   If `DFS-2` appears, the classifier regressed — that is a bug report, not a pass.
8. **Propose.** On the `DFS-1` card press **Propose correction**.
   Expected proposal panel: `PROPOSED remove-scope-recommendation · ac-1 · expires <date> <time> UTC`, then exact text beginning `Out of scope: Guest checkout is no longer enabled for first-time buyers.`
   The expiry is 24 hours from creation; a proposal is single use.
9. **Approve and apply.** Press **Approve and apply** on that proposal.
   Expected message: **`Recorded as a recommendation. No status transition was performed.`**
   This is a pass, not a failure. An `obsolete-scope` proposal is a scope-removal recommendation, so the app posts a marker-tagged comment and deliberately performs no transition. `Applied to the issue and recorded in the audit trail.` only appears for `amend-criterion`.
   Verify on `DFS-1`: one comment whose first line is `{{decisionfuse-proposal-<proposalId>}}`, carrying the exact text inside `{quote}` markers, the approver, and `This is a recommendation only. No status transition was performed.` Keep the `<proposalId>` — Part 2 needs it.
10. **Prove stale rejection.** Edit the page again (any wording change to the same sentence, publish). Back on `DFS-1`, press **Propose correction** on the same finding, then **Approve and apply**.
    Expected: `Approval rejected: stale-source. Nothing was written.` and no second marker comment on the issue.
    The approval gate checks in this order: `permission-denied`, `expired-proposal`, `stale-source`, `stale-issue`. `stale-source` is the expected code here; if you see `expired-proposal`, more than 24 hours passed.
11. **Prove dismissal.** In the panel press **Dismiss with reason**, type a reason at the prompt.
    Expected: `Finding dismissed with a reason recorded.` The finding leaves the list.
12. **The denied-access path** needs a second Atlassian account that cannot edit `DFS-1` or cannot read page `426003`. Without one, record it as unproven — do not write it up as verified.

Save as `evidence/<date>-panel-run.md`: screenshots of steps 2, 7, 8, 9 and 10, the exact proposal text, the comment id, the `<proposalId>`, and the audit rows. Nothing here is secret; redact account ids that are not already public.

## Part 2 — MCP enablement and one real invocation

1. **Enable exposure.** As a site admin: **Apps › Sites › yablo.atlassian.net › Connected apps** → select **DecisionFuse** → turn on `inspect_decision_change`, `list_affected_work` and `get_proposal`.
   If the app is listed once per product installation, enable on both. Exposure is per installation, off by default.
2. **Confirm exposure flipped.** Before and after, these must change from 404:

   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' https://mcp.atlassian.com/forge/42074d3d-8872-4475-850b-8a75eb4d10b4
   curl -s -o /dev/null -w '%{http_code}\n' https://mcp.atlassian.com/forge/42074d3d-8872-4475-850b-8a75eb4d10b4/.well-known/oauth-protected-resource
   ```

   A still-404 result means the toggle did not take. Record the status codes either way.
3. **Connect a client.** Atlassian's MCP page lists the supported clients; pick one from that list rather than assuming. The server is remote and OAuth-protected, so the client must support remote HTTP with OAuth; a stdio-only client needs a bridge (`npx -y mcp-remote https://mcp.atlassian.com/forge/42074d3d-8872-4475-850b-8a75eb4d10b4`). The inspector (`npx -y @modelcontextprotocol/inspector`) is the quickest way to see the tool list. Complete the OAuth consent as your own user — the tools act as you, not as the app.
4. **`tools/list`.** Expect exactly three tools — `inspect_decision_change`, `list_affected_work`, `get_proposal` — each with one string input (`blockId` or `proposalId`). No approval, transition or write tool may appear. If one does, that is a defect to report.
5. **`list_affected_work` with `{"blockId":"checkout-guest"}`.**
   Expected: `status: "ok"`, `blockId`, `work[]` containing `DFS-1` / `ac-1` with `obsolete-scope` and its `sourceQuote`, `DFS-3` as `unaffected`, and `withheldIssueEvidence: false`.
   A `not-found` here while the panel shows findings means the tools are reading a different product installation's storage. That is a real finding — record it, do not paper over it.
6. **`inspect_decision_change` with `{"blockId":"checkout-guest"}`.**
   Expected: `baselineVersion`, `textHash`, `summary[]` with issue, criterion, classification, confidence and `sourceVersion`, plus the fixed `notes` string. No title, no page body, no span beyond the summary.
7. **`get_proposal` with `{"proposalId":"<the id from the marker comment in step 9>"}`.**
   Expected: `status: "ok"`, the proposal's `exactText`, `sourceHash`, `issueFingerprint`, `expiresAt`, and `approvalPath` telling the user to approve in the Jira panel. No tool approves.
8. **Negative cases, all safe to run:**
   - `{"blockId":"../admin"}` → `invalid-input`. No URL or path is ever passed to the platform.
   - `{"blockId":"no-such-block"}` → `not-found`.
   - `{}` or `{"blockId":""}` → `invalid-input`.
   - A source the caller cannot read → `denied` with no title, span or count. Needs the second account from Part 1 step 12.
9. **Save** as `evidence/<date>-mcp-invocation.md`: the two status codes, the client name and version, `tools/list` output, one redacted response per tool, and the negative-case results. Redact account ids and any page text not already synthetic.

## What each outcome means for the claim

| Observed | Then |
| --- | --- |
| Part 1 steps 7–10 produce the finding, exact text, recommendation comment and `stale-source` refusal | The review loop is **verified through the Forge runtime**. Update README and `docs/PLATFORM_VERIFICATION.md`; the "not yet verified" bullet comes out. |
| Part 2 `tools/list` and one `tools/call` succeed with a real client | MCP is **verified and judge-testable**. Rovo agent is still separate — it needs its own chat invocation. |
| Toggle happened but the client cannot connect | Exposure enabled, invocation unproven. Both facts get written down; eligibility stays unclaimed. |
| Nothing in Part 2 works and the toggle is absent from the admin UI | Record the exact blocker and the page you looked at. Do not describe it as a technical failure of the app. |

Re-render the video and regenerate the architecture PNG only after these results are known, so the demo states what is actually true.
