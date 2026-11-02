# Judge setup

Ten minutes end to end. You need a site with **both Jira and Confluence** and admin
rights on it. Nothing here uses an existing customer site, and every object you create
is disposable.

## Credentials and configuration — none

There are **no credentials, API keys, tokens, environment variables, webhooks or
external services** to supply. The app runs entirely inside Forge on your own site and
acts as the signed-in reviewer. There is no model provider, no outbound server, no
database to create and no admin toggle to enable for the flow described here.

Configuration is two steps, both of which are just installation:

1. Install the app for **Jira**.
2. Install the app for **Confluence**.

The only thing a judge has to author is test content: one Confluence page and two Jira
issues, both described below. If a step here is skipped, the section that breaks says
so.

Installation link (installs the production build, Jira and Confluence):

```
https://developer.atlassian.com/console/install/42074d3d-8872-4475-850b-8a75eb4d10b4?signature=AYABeBvLkE5O1lkNhftM8CSSnbsAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucB%2FYvbTaE%2BKHLJ%2BevPPTTsbwAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDDmQ8Kc8S%2BlkPoaeLAIBEIA7F%2FpKpsEOaIqwM7DjmrmLkVxsA%2FA84Yo08LXPc%2B7lWydTMPhiH3F4iTDdQy9bN2ZBokaLnL%2FjzSE0%2FwsAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgGDrvWNGqKQGnFmw64a4jNkAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMnTKo%2BI0gq%2FQ0dhcsAgEQgDsJ5veft1QFruSHPaf6NmKTUUzm%2BxHdeRApXNA0CPyUQDM8aJtR%2BYWzUXfURBnC9RzZEePllYRmUBAL2wAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAVYzb9725xB3pTlksWGbILkAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAztznhJijzsskkyVNoCARCAOyGuhDO%2FUGwk5H5f6Tsu2Ww%2FnnCavbEO7S9W0aeH8Bxhyqct2ogBrrNTaO24QzpKcYbuh%2BTQXD3Ow76cAgAAAAAMAAAQAAAAAAAAAAAAAAAAAGWK7BertOS%2FctDdeB7SEij%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADLDk8POgZCZjETsqbM%2FF1Os87VSDHPOX9J7VtqUN%2FhYdt8CJKNmj%2F5Z9QN%2BTMg%2Fa7G6l5TI1aE4ZTb3RT49p%2BvpNDQ%3D&product=confluence&product=jira
```

That link carries `product=confluence&product=jira`, so it targets sites running both
products. If it is ever regenerated in the developer console, the old link stops
working for anyone who has not already installed.

## 1. Install

1. Open the installation link supplied with the submission.
2. Choose your site.
3. Install for **Jira**, then return to the link and install for **Confluence**.
   Both are required: the Jira issue panel is where a finding is reviewed, and the
   Confluence byline panel is where a decision is registered and linked.
4. Confirm both appear under **Manage apps** / **Apps → Manage apps**.

If only Jira is installed, the app still opens on an issue but there is nothing to
register, so the review loop cannot be exercised.

## 2. Create a decision (Confluence)

1. Create a blank page in any space titled `Checkout decisions (test)`.
2. Paste this as the page body — the fences are what the app parses:

   ```
   BEGIN DECISION checkout-guest status=accepted
   Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes.
   END DECISION
   ```

   Put **each of the three lines in its own paragraph** — press Enter after each line. A
   soft break (Shift+Enter) keeps them in one paragraph, and the block will not be found.
3. Publish. Open the **DecisionFuse** item that appears in the page's byline area under
   the title. If it is not visible, look in the **…** (more actions) menu next to the
   page title — Confluence places content-byline items there when the header is tight.
4. Press **Register**. The block should move from `not registered` to `baseline v1`.
   The baseline is the page version at that moment, and it is immutable.

An `accepted` status is what makes a block actionable; `draft` and `superseded` blocks
appear in the panel and can be registered, but a finding is never raised for one.

## 3. Create linked work (Jira)

1. Create a project (any software template) with key `DFS`, or reuse one.
2. Create two issues and give each a description of **exactly one line**:
   - `Guest checkout for first-time buyers` →
     `Guest checkout is enabled for first-time buyers.`
   - `Guest cart session expiry` →
     `Guest cart sessions expire after 60 minutes.`
3. How criteria are read, precisely: **every non-empty line of the description is one
   criterion**, numbered `ac-1`, `ac-2`, … in order, with leading bullets or numbers
   stripped. So a one-line description has only `ac-1`. If you add explanatory prose on
   a second line, that prose becomes `ac-2` and the numbering shifts — keep the
   description to the criterion alone, which is how the real workflow uses it.
4. Optional control: create a third issue `Order confirmation tax summary` with the line
   `Order confirmation shows the tax summary.` and **never link it**. It must stay
   silent, which is what proves links are explicit rather than guessed.

## 4. Link, change, rescan

1. Back on the Confluence page, in **Link one issue criterion**: select block
   `checkout-guest`, enter `DFS-1`, `ac-1`, press **Link**. Then link `DFS-2` / `ac-1`
   the same way. Each issue has one criterion, so both are `ac-1`.
   The Link button stays disabled until the block, a key matching `DFS-1` and a criterion
   matching `ac-1` are all valid — that is a check, not a bug.
2. Edit the page body: change the first sentence to
   `Guest checkout is no longer enabled for first-time buyers.` and publish. Only that
   sentence — leaving the second one intact is what makes the unaffected case visible.
3. Press **Rescan**.
   - `DFS-1` is flagged **Obsolete scope**, with a quote of the exact changed span.
   - `DFS-2` is reported **Unaffected**: its criterion sits in the clause nobody touched.
   - Nothing else is flagged, and no link is ever inferred from issue text.

## 5. Propose, then approve

1. On the `DFS-1` finding press **Propose correction**. You get one exact replacement,
   its criterion, and a 24-hour expiry.
2. Press **Approve and apply**. Expect **"Recorded as a recommendation. No status
   transition was performed."** A scope removal is never an automatic close; the app
   posts one marker-tagged comment and leaves the workflow alone.
3. The issue now carries a comment starting `{{decisionfuse-proposal-…}}` with the exact
   text.

## 6. Prove the guarantee

1. Edit the page sentence again and publish.
2. Propose on the same finding and approve again.
3. Expect **"Approval rejected: stale-source. Nothing was written."** — the approval is
   bound to the proposal hash, the source text and the issue fingerprint, and it is
   single use.

## What is deliberately not enabled

- **No automatic closure, transition or deletion.** The app writes one comment and
  nothing else.
- **No model writes.** Proposal text comes from deterministic comparison, not from a
  model, and only a permission-checked human approval applies it.
- **Rovo agent and MCP tools are not part of judge testing.** They are declared and
  lint-clean, but no invocation has been recorded, so no eligibility is claimed and
  their enablement is off.
- **One identity only.** Denied-access behaviour (reviewer without write permission, a
  user denied access to the source page) is covered by tests, not by a second account on
  a judge's site.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No `DecisionFuse` item on the page | Confluence install missing, or the item is collapsed into **…** | Install for Confluence from the link, reload, check the more-actions menu |
| Panel says `No fenced decision block on this page.` | The three fence lines are in one paragraph, or the page was not published | Put each line in its own paragraph with Enter, publish |
| Rescan reports zero findings | The page was edited before registering, so the edit became the baseline | Edit the sentence to something new, publish, rescan |
| Rescan reports the wrong issue | Link points at the wrong criterion number | Unlink by relinking: link the correct `issueKey`/`ac-n` pair again |
| `Approve and apply` says `stale-source` on the first attempt | The page changed after the proposal was built | Rescan, then propose again |
| No comment appears on the issue | The proposal was an `amend-criterion` recommendation that was never applied, or the issue already carries the marker | Check the audit rows in the panel; a second apply reconciles rather than duplicating |

## Reset

Delete the page and the two issues. The app stores baselines per installation; a fresh
install starts empty, and nothing is shared between sites.

## What has not been demonstrated in this setup

No judge has run this yet, and neither has the owner inside a browser: the panel path is
written and deployed but the Forge-runtime invocation is unrecorded. If a step above
does not behave as described, that is the first real failure report on this build —
worth noting in a submission comment rather than working around it silently.
