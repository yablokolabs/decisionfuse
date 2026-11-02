# Judge setup

Ten minutes end to end. You need a site with **both Jira and Confluence** and admin
rights on it. Nothing here uses an existing customer site, and every object you create
is disposable.

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

3. Publish. Open the **DecisionFuse** byline item in the page's toolbar area.
4. Press **Register**. The block should move from `not registered` to `baseline v1`.
   The baseline is the page version at that moment, and it is immutable.

## 3. Create linked work (Jira)

1. Create a project (any software template) with key `DFS`, or reuse one.
2. Create two issues, each with an acceptance-criterion list in the description:
   - `Guest checkout for first-time buyers` with criterion
     `Guest checkout is enabled for first-time buyers.`
   - `Guest cart session expiry` with criterion
     `Guest cart sessions expire after 60 minutes.`
3. The app links to criteria as `ac-1`, `ac-2`, … in order of appearance. `ac-1` is
   the first criterion on the issue.

## 4. Link, change, rescan

1. Back on the Confluence page, in **Link one issue criterion**, link the checkout
   decision block to `DFS-1` / `ac-1`, then to `DFS-2` / `ac-2` (the cart-session
   criterion is `ac-1` on its own issue).
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

## Reset

Delete the page and the two issues. The app stores baselines per installation; a fresh
install starts empty, and nothing is shared between sites.
