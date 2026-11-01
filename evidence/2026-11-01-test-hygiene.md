# Test hygiene and the denied-access fixture — 2026-11-01

Two things this record covers: the live suite stopped leaving pages behind, and
the denied-access claims now have an executable fixture that says out loud when
it cannot run.

## Live suite: self-seeding and self-cleaning

`tests/live-site.test.ts` now calls `scripts/seed-synthetic.mjs` in `beforeAll`,
so it no longer depends on content someone created by hand, and deletes the page
it created in `afterAll`. Only the page from the current run is touched; nothing
older is removed by the suite.

Three orphan pages from earlier runs were left on `yablo.atlassian.net`, all
titled `DecisionFuse live engine check …`: `426019` (v3), `393458` (v2),
`262291` (v3). They were deleted once, by hand, before the change was verified:

```
before: ['426019', '393458', '262291']
deleted 426019 -> 204
deleted 393458 -> 204
deleted 262291 -> 204
after: []
```

Then the suite was run with the new lifecycle:

```
$ npx vitest run
 Test Files  6 passed | 1 skipped (7)
      Tests  49 passed | 1 skipped (50)

$ DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts
 ✓ tests/live-site.test.ts (1 test) 5656ms
   ✓ live site integration > runs register → rescan → propose → stale rejection against real content 4049ms

post-run leftovers: []
```

So the run creates one page, asserts against it, and removes it. The scenario
page `426003` is outside that lifecycle and still reads version 1.

## Denied-access fixture: `scripts/fixture-permissions.mjs`

The two claims are narrow — a reviewer without write permission cannot approve,
and a person denied the source page gets a refusal with no title, snippet, count
or hint. Both need a **second Atlassian identity**. The owner account cannot
demonstrate a denial, because the owner is the site administrator.

Run on 2026-11-01 with the owner identity only:

```
$ node scripts/fixture-permissions.mjs
{
  "site": "yablo.atlassian.net",
  "steps": [
    { "name": "owner-identity", "status": 200, "accountId": "712020:6ad05c8f-…" },
    { "name": "owner-can-edit-issue", "status": 200, "havePermission": true },
    { "name": "owner-can-read-source", "status": 200, "version": 1, "blockPresent": true }
  ],
  "blocked": [
    "reviewer-without-write: needs a second Atlassian account (FORGE_ALT_EMAIL / FORGE_ALT_API_TOKEN) with no issue edit permission",
    "denied-source: needs the same second account removed from the page read restriction"
  ],
  "status": "blocked",
  "verified": "owner identity and owner-side access only"
}
exit: 3
```

What that output does and does not mean:

- **Verified:** the owner can edit `DFS-1` and can read page `426003` (v1) with
  the `BEGIN DECISION` block present. Those are the control values the denied
  cases are compared against.
- **Not verified:** either denial. No second account exists, so no refusal was
  observed on the real site. `exit 3` is the script refusing to imply otherwise.
- **Written but never executed:** the restriction path. With a second identity
  present the script restricts read on the page to the owner, checks the second
  identity is refused and that no block content leaks in the refusal, then
  removes exactly the restriction ids it added and re-reads the page to prove
  restoration. None of that has run, so treat it as untested code.

To unblock it, the second identity needs: an account on the same site, no issue
edit permission on `DFS-1`, and read access removed from `426003`. Then:

```
FORGE_ALT_EMAIL=… FORGE_ALT_API_TOKEN=… node scripts/fixture-permissions.mjs
```

Until that exists, `tests/tools.test.ts` remains the only evidence for the
denial behaviour, and it is mocked.
