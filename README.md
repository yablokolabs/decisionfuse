# DecisionFuse

<img src="assets/decisionfuse-logo.png" alt="DecisionFuse — Decisions change. Work should catch up." width="520">

Decisions change. Work should catch up.

Catch Jira work that no longer matches a linked Confluence decision. DecisionFuse shows the evidence, proposes an exact correction or a scope reduction, and lets an authorized owner approve it. It never closes tickets on its own and never claims to remove all technical debt.

Category: Apps for Software Teams (Atlassian Codegeist 2026).

## What runs today

Local, verified on 2026-11-01:

- Forge app registered as `ari:cloud:ecosystem::app/42074d3d-8872-4475-850b-8a75eb4d10b4` in the `DecisionFuse` Developer Space.
- `forge lint` reports **No issues found** for the manifest (Jira issue panel, Confluence content byline module, resolver, queue consumer).
- `npx tsc --noEmit` clean; `npx vitest run` **34 tests passing** across four suites.
- Deterministic domain: block extraction, formatting-insensitive hashing, span diffing, classification, evidence validation, proposal-bound approval, single-use approvals, tenant partitioning, replay-safe findings, reconcile-before-retry.

Not yet verified — do not assume it works:

- No deployment to a site and no real Jira/Confluence read or write has been executed.
- No Rovo agent and no Forge MCP tools are implemented.
- Teamwork Graph is not used. No Marketplace listing exists.
- The UI bundle builds, but its resolvers have only been exercised against fakes.

## Architecture

<img src="assets/architecture.png" alt="DecisionFuse review pipeline: a Confluence decision block is registered with a baseline, compared by a deterministic analysis consumer, validated against evidence spans, reviewed in a Jira panel, and written only after a permission-checked human approval." width="900">

Source: [`assets/architecture.svg`](assets/architecture.svg). The dashed edge is a proposal that has not been written; the amber edge is the only remote write, and it is gated by a fresh permission and hash recheck.

## How the review loop works

1. **Register.** A decision block inside a Confluence page is registered with an owner, a status and a baseline page version. Only `accepted` blocks are actionable.
2. **Link.** Issues are linked explicitly, criterion by criterion. No guessed links.
3. **Compare.** A changed block is compared against the baseline. Formatting-only edits are ignored.
4. **Classify.** Requirement conflict, obsolete scope, implementation review, or uncertain. Contradictory accepted decisions stay unresolved.
5. **Validate.** Every finding must carry spans that resolve against the exact stored source and criterion text, or it is rejected.
6. **Propose.** The proposal is one criterion with exact replacement text, precondition hashes and an expiry.
7. **Approve.** A permission-checked, single-use approval bound to the proposal hash and the live source and issue versions.
8. **Write and reconcile.** A marker-tagged comment carries the amendment, so a timeout reconciles instead of posting twice. Scope removal stays a recommendation on the native workflow.

## Run the checks

```bash
npm install
npm run typecheck
npm test
forge lint
(cd static/hello-world && npm install && npm run build)
```

## Project layout

| Path | What it holds |
| --- | --- |
| `manifest.yml` | Forge modules, scopes and runtime |
| `src/domain` | Types, text and hashing, classification, evidence, approval gate |
| `src/queue` | Idempotent analysis engine |
| `src/review` | Approved apply path with remote reconciliation |
| `src/services` | Jira and Confluence reads and the marker comment |
| `src/storage` | Tenant-partitioned repository and the Forge KV adapter |
| `static/hello-world` | Review panel bundle |
| `tests` | Domain, permission, concurrency and reconciliation tests |
| `docs` | Build spec, verification notes, evaluation scenarios, progress |
| `videos/decisionfuse-demo` | Remotion walkthrough (renders offline; logo in intro and outro) |

## Competition notes

The uploaded brief is preserved in `docs/COMPETITION_BRIEF.txt`. Official listing checked November 1, 2026: deadline December 22, 2026 12:00 PST. Recheck the official rules before submitting. Public posting, Marketplace submission and the final competition entry remain the owner's decisions.

## License

See `docs/BUILT_WITH.md` for the technologies actually in use and `LICENSE` for the app's own terms; third-party notices live in `THIRD_PARTY_NOTICES.md`.
