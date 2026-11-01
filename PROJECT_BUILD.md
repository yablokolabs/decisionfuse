# Implementation specification
## Product contract
Primary user: engineering lead or product owner who changes requirements in Confluence while linked Jira work continues. Hypothesis: version-aware impact review reduces obsolete work and requirement drift. This does not eliminate all technical debt; debt can remain intentionally valuable or unrelated to decisions.

MVP: one registered decision block on a Confluence page linked explicitly to Jira issues and specific acceptance criteria. A changed decision produces a reviewable source diff and per-issue proposal. Include negative controls. An owner approves an exact amendment or a scope-removal recommendation. Existing workflows remain authoritative.

## Architecture
TypeScript Forge app; React Custom UI (or UI Kit if it meets diff UX), Forge resolvers/functions, async processing and current supported Forge storage. Jira issue panel for contextual findings; a compact project review queue and decision registry if supported. Confluence integration registers the page, decision block and baseline version. Verify current module keys, events and cross-product installation before implementation.

Source update event or explicit Rescan -> deduplicate event -> fetch latest authorized source -> isolate registered block -> normalize semantic text -> compare baseline -> enumerate explicit links -> retrieve scoped issue content -> structured analysis -> validate evidence -> persist finding -> authorized review -> revalidate versions/permission -> apply exact approved mutation -> verify remote result -> audit.

Use updated-page events only after verifying the contract; manual rescan is a transparent MVP option. Bound event fanout, queue depth, pagination, retry count and cost; use backoff for 429. Ignore formatting-only changes and self-generated mutations. Unknown or deleted source means review needed, never automatic completion.

## Detection and proposal policy
Do not treat every prose change as an authoritative new decision. Registered blocks have status (draft/accepted/superseded), owner, version and decision text. Require accepted status for actionable findings. Human confirms extracted decisions if structure is unclear. Contradictory accepted decisions become unresolved, not inferred precedence from newest timestamp.

Classification: unaffected; requirement-conflict; obsolete-scope; implementation-review; insufficient-evidence. Confidence is a heuristic, not a probability of truth. Each actionable finding includes old/new source spans and issue criterion spans verifiable against exact saved versions. Models return schema-bound data with no executable code or API addresses.

Use Rovo agent reasoning for interactive explanation where supported. For background semantic analysis verify a supported Forge inference API and entitlement first. A rovo:agent manifest is not a generic callable background inference endpoint. If unavailable, ship deterministic structured-decision comparisons with explicit uncertainty, or configure a separately authorized provider and declare egress/retention. Document which mode produced every result.

## Data contracts
Decision: tenant/site, pageId, stable blockId, ownerId, status, baselineVersion, normalizedTextHash, source excerpt references.
Link: decisionId, issueId, criterion identifier, createdBy, acknowledged baseline.
Analysis: id, sourceVersion/hash, issueRevision/fingerprint, engine version, mode, dedupe key, timestamps.
Finding: class, evidence spans, rationale, confidence bucket, current owner, proposed edit, lifecycle.
Proposal: immutable id, allowed operation, exact patch, precondition hashes, expiry, revision.
Approval: proposalId/hash, reviewer identity, permission check, timestamp; server-generated and single use.
Audit: operation id, before/after fingerprint, actor, source version, remote result and status.

Lifecycle: pending -> analyzed -> needs-review -> proposed -> approved -> applying -> verified; separate dismissed, superseded, failed, uncertain. A correction is not resolved until write/readback succeeds. A stale source/issue invalidates approval.

## Safe write protocol
Re-fetch both source decision and Jira fields as reviewer. Compare source/criterion fingerprints, proposal hash, expiry and permissions. Use documented optimistic concurrency if available. Do not pretend an app lock prevents human Jira edits. If API cannot guarantee safe conditional mutation, default to an approved comment containing the exact proposed amendment and require native issue editing; mark suggested, not applied. Enable direct acceptance-criteria patch only with a tested conflict-safe strategy. Never replace unrelated ADF nodes. Cancellation/removal is a recommendation requiring permitted workflow transition, not an inferred delete operation.

Exactly-once local record is not exactly-once remote write. Store operation state and use a stable marker plus remote reconciliation after timeout; do not blindly retry comments or transitions. Recover crashes between remote write and local acknowledgement. Record dismiss reasons and baseline acknowledgements so identical changes do not nag repeatedly.

## Milestones
M0: current contracts, CLI/site access, real read path, capability ledger.
M1: synthetic fixture plus actual Jira/Confluence registered decision and rescan.
M2: evidence validator, diff/review UI, unaffected control, guarded proposal.
M3: permissions, stale approval, duplicate/event retry, audit/reconciliation tests.
M4: working Rovo agent, then read-only MCP exposure; evaluate TWG and Marketplace separately.
M5: frozen evaluation, judge install rehearsal, media, accurate story and submission packet.

## UX
Navy/amber brand with high contrast. Evidence first: what changed, what work is affected, why, proposed action. Label uncertain, source unavailable, superseded and applied distinctly. Keyboard navigation, focus management, accessible diff (not color alone), responsive host sizing. No busy dashboard as the main experience. No footer.
