# DecisionFuse

<img src="assets/decisionfuse-logo.png" alt="DecisionFuse — Decisions change. Work should catch up." width="520">

Decisions change. Work should catch up.

Catch Jira work that no longer matches a linked Confluence decision. DecisionFuse shows the evidence, proposes an exact correction or a scope reduction, and lets an authorized owner approve it. It never closes tickets on its own and never claims to remove all technical debt.

Category: Apps for Software Teams (Atlassian Codegeist 2026).

## What runs today

Installed on the development site `yablo.atlassian.net`, verified 2026-11-01:

- Forge app `ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4`, deployed to `development` as v2.2.0.
- Installed separately for **Jira** (`e63b5663-a630-468b-883a-cfcaf946d437`) and **Confluence** (`ca73eaa3-ea71-4e76-a8e9-89cf74520fe2`). A Jira install does not grant Confluence access; both were required.
- `forge lint` reports **No issues found** for the full manifest: Jira issue panel, Confluence byline module, resolver, queue consumer, three `action` modules, `rovo:agent` and `rovo:mcp`.
- `npx tsc --noEmit` clean; `npx vitest run` **46 tests passing** across six suites, plus a gated live-site suite.
- The engine, proposal builder and approval gate ran against live site content: a withdrawn accepted decision raised findings on two linked issues, left the unlinked control alone, produced exact proposal text, and rejected a stale approval without writing. See [`evidence/2026-11-01-live-engine.md`](evidence/2026-11-01-live-engine.md).
- Deterministic domain: block extraction, formatting-insensitive hashing, span diffing, classification, evidence validation, proposal-bound approval, single-use approvals, tenant partitioning, replay-safe findings, reconcile-before-retry.
- Deterministic proposals: the criterion sentence sharing the decision's subject is replaced and the rest is preserved; no shared subject means no proposal rather than a guess.
- Read-only tool layer shared by the Rovo agent and the MCP server, with input allow-lists and fail-closed permission checks.

Synthetic scenario seeded on that site: project `DFS` with `DFS-1`/`DFS-2` and the unaffected control `DFS-3`, plus Confluence page `426003` holding an accepted `checkout-guest` decision block. See [`evidence/2026-11-01-site-install.md`](evidence/2026-11-01-site-install.md).

Not yet verified — do not assume it works:

- The review loop has not run through the Forge runtime. Register, link, rescan, propose and approve are resolver calls reached only from the panel in a signed-in browser session, which this build environment does not have. The domain has run against live content over REST, but nothing has been written to Jira or Confluence by the app itself.
- The Rovo agent and MCP server have **never been invoked**. No admin has enabled external MCP exposure. Bonus eligibility is not claimed.
- No reviewer-without-write-permission or denied-source-access accounts exist on the site. Those paths are covered only by mocked tests.
- Teamwork Graph is not used. No Marketplace listing exists.

## Architecture

<img src="assets/architecture.png" alt="DecisionFuse review pipeline: a Confluence decision block is registered with a baseline, compared by a deterministic analysis consumer, validated against evidence spans, reviewed in a Jira panel, and written only after a permission-checked human approval. A separate read-only Rovo and MCP surface reads the same records." width="900">

Source: [`assets/architecture.svg`](assets/architecture.svg). The dashed edges are proposals that have not been written and the read-only surface; the amber edge is the only remote write, gated by a fresh permission and hash recheck.

## How the review loop works

1. **Register.** A decision block inside a Confluence page is registered with an owner, a status and a baseline page version. Only `accepted` blocks are actionable.
2. **Link.** Issues are linked explicitly, criterion by criterion. No guessed links.
3. **Compare.** A changed block is compared against the baseline. Formatting-only edits are ignored.
4. **Classify.** Requirement conflict, obsolete scope, implementation review, or uncertain. Contradictory accepted decisions stay unresolved.
5. **Validate.** Every finding must carry spans that resolve against the exact stored source and criterion text, or it is rejected.
6. **Propose.** The proposal is one criterion with exact replacement text, precondition hashes and an expiry.
7. **Approve.** A permission-checked, single-use approval bound to the proposal hash and the live source and issue versions.
8. **Write and reconcile.** A marker-tagged comment carries the amendment, so a timeout reconciles instead of posting twice. Scope removal stays a recommendation on the native workflow.

## Rovo agent and MCP tools

Both surfaces call the same read-only actions, so they cannot diverge from the review flow:

| Tool | Answers |
| --- | --- |
| `inspect_decision_change` | What is the registered baseline, and which issues are flagged? |
| `list_affected_work` | Which issues are linked, and what is the evidence for each? |
| `get_proposal` | What is the exact proposed text, and its preconditions? |

Safety properties enforced in code and tested:

- Tenant identity is not an input. Forge storage is installation-scoped, so a caller cannot name another site.
- `blockId` and `proposalId` must match a plain identifier pattern. No URLs, API paths or queries reach the platform.
- A source the caller cannot read returns a bare denial with no title, count, span or hint.
- Issues the caller cannot browse are omitted, and the response flags that evidence was withheld.
- No tool exposes an approval, and none can mutate or transition anything. `get_proposal` returns the review path instead.

The agent prompt keeps the same boundary: it explains and quotes evidence, and always directs the user to approve in the authenticated Jira panel.

## Run the checks

```bash
npm install
npm run typecheck
npm test
forge lint
(cd static/hello-world && npm install && npm run build)

# Real-site domain check; needs FORGE_EMAIL and FORGE_API_TOKEN in the environment
DECISIONFUSE_LIVE=1 npx vitest run tests/live-site.test.ts
```

## Project layout

| Path | What it holds |
| --- | --- |
| `manifest.yml` | Forge modules, scopes and runtime |
| `src/domain` | Types, text and hashing, classification, evidence, approval gate |
| `src/queue` | Idempotent analysis engine |
| `src/review` | Approved apply path with remote reconciliation |
| `src/actions` | Read-only tools shared by Rovo and MCP |
| `src/services` | Jira and Confluence reads and the marker comment |
| `src/storage` | Tenant-partitioned repository and the Forge KV adapter |
| `static/hello-world` | Review panel bundle |
| `tests` | Domain, permission, concurrency, reconciliation and tool tests |
| `docs` | Build spec, verification notes, evaluation scenarios, progress |
| `videos/decisionfuse-demo` | Remotion walkthrough (logo in intro and outro) |

## Competition notes

The uploaded brief is preserved in `docs/COMPETITION_BRIEF.txt`. Official listing checked November 1, 2026: deadline December 22, 2026 12:00 PST. Recheck the official rules before submitting, and read `docs/PLATFORM_VERIFICATION.md` for what is verified versus merely declared. Public posting, Marketplace submission and the final competition entry remain the owner's decisions.

## License

MIT for this repository; third-party obligations and Atlassian trademark notes are in `THIRD_PARTY_NOTICES.md`.
