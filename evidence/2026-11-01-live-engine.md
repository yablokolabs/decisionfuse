# Live-site engine evidence — 2026-11-01

What this proves: the real analysis engine, proposal builder and approval gate
produce correct decisions when fed **live Confluence and Jira content** from
`yablo.atlassian.net`. What it does not prove: the Forge runtime path. Requests
here carry the owner's API token directly, not `asUser()`, so platform
permission delegation is still unverified.

## Reproduce

```bash
DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts
```

Credentials come from `FORGE_EMAIL` / `FORGE_API_TOKEN` in the environment only.
Site, space and parent page are overridable with `DECISIONFUSE_SITE`,
`DECISIONFUSE_SPACE_ID`, `DECISIONFUSE_PARENT_ID`.

## Scenario and result

Test page `426019` in space `SD` (parent `Software development`), synthetic, no
customer content. Same block id as the demo page: `checkout-guest`.

| Step | Live state | Engine result |
| --- | --- | --- |
| 1. Register baseline | page v1, "Guest checkout is enabled for first-time buyers. Guest cart sessions expire after 60 minutes." | baseline captured at v1 |
| 2. Withdraw the decision | page v2, "… is no longer enabled …" | `analysed`, finding for `DFS-1` and `DFS-2` |
| 3. `DFS-1` (`ac-1`) | criterion "Guest checkout allowed for first-time buyers without an account." | `obsolete-scope`, high confidence, source v2, quote `no longer` |
| 4. `DFS-2` (`ac-1`) | criterion "Guest cart sessions expire after 60 minutes." | `obsolete-scope`, medium — **false positive**, see limitations |
| 5. `DFS-3` (unlinked control) | criterion "Order confirmation shows a tax summary line." | no finding raised |
| 6. Propose | proposal bound to source hash of v2 | `remove-scope-recommendation`, exact text `Out of scope: Guest checkout is no longer enabled for first-time buyers.` |
| 7. Rewrite the page again | page v3, "… no longer enabled for any buyer …" | approval bound to v2 rejected `stale-source` |
| 8. Write attempt | — | `writes: 0`; audit row `approval-rejected`; no `decisionfuse-proposal` comment on `DFS-1` |

The permission branch used a real `GET /rest/api/3/mypermissions?issueKey=DFS-1&permissions=EDIT_ISSUES`
(`havePermission: true`); the token holder can edit the issue, so the rejection
comes from staleness alone, not from a permission shortcut.

## Limitations

- **Not the Forge runtime.** No resolver, queue consumer, Rovo agent or MCP tool
  was invoked. Identity delegation, Forge storage and the app's own permission
  checks on the platform are untested here.
- **False positive on `DFS-2`.** The withdrawal does not touch session expiry,
  but the classifier only reasons about the decision text and the criterion, not
  about whether the criterion's subject is inside the changed region. The
  reviewer dismisses it with a reason; a comment-only write path means a
  dismissal costs nothing, but it is noise. Recorded rather than hidden.
- **No denied-access user.** Denial paths are covered by mocked tests only; the
  site has no reviewer-without-write-permission account.
- **Page left in place** at v3 as evidence. It is synthetic and titled
  `DecisionFuse live engine check 1793560879495`.
