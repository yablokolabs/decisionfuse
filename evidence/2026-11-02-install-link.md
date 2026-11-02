# Installation link for judges — 2026-11-02

The console link exists now. Recorded here as "supplied by the owner and reachable",
which is not the same as "a judge installed it successfully" — nobody outside the
owner's accounts has tried.

| Item | Value |
| --- | --- |
| Link | recorded in `docs/JUDGE_SETUP.md` (1,487 characters) |
| App | `ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4` |
| Products in link | `product=confluence` **and** `product=jira` |
| Production build it installs | **2.0.0**, Runs on Atlassian eligible |
| Anonymous HTTP check | `curl` → **200**, no redirect |
| Signature | present, managed by the console; regenerating it invalidates the old link |

## What the 200 does and does not prove

The install page loads without an Atlassian session. That confirms the URL is well
formed and the console serves it. It does **not** confirm the app's distribution status
is `Sharing` for a user outside the owner's organization: the page is a client-rendered
console view, and the actual install attempt happens after sign-in, where a site admin
chooses a site and confirms scopes.

Distribution status still cannot be read from this host — the CLI has no command for it
(`forge install --help` on 15.0.0 offers no sharing flag) and the reference documents
the control as console-only. The link existing with a signature is consistent with
sharing having been enabled, but the only conclusive check is a non-contributor
completing an install.

## Conclusive check, if it is wanted

1. Sign in to a site where the owner is **not** a contributor and is not an org member.
2. Open the link, install for Jira, then install again for Confluence.
3. Open any Confluence page and confirm the `DecisionFuse` byline item appears.

If the page reports that the app is not available, the distribution status is still
`Not sharing` or still restricted to the owner's organization.
