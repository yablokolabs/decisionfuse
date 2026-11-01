# Frozen evaluation and proof
Do not claim measured time savings before a pilot. Separate proposal quality from write safety. Freeze held-out fixtures before tuning; version schema, fixture hashes, code commit, model/config, token/latency metadata and results. Never store reasoning traces or secrets.

Required scenarios:
1. Guest checkout accepted -> login required: linked checkout acceptance criterion conflicts; unrelated tax task unaffected.
2. Optional email receipt -> mandatory receipt: add requirement without removing existing behavior.
3. Feature explicitly dropped: scope-reduction proposal; no automatic ticket closure.
4. Formatting-only page update: no semantic finding.
5. Draft decision change: no authoritative amendment.
6. Conflicting accepted decisions: clarification/review, no guessed winner.
7. Source version advances after approval: reject stale approval.
8. Issue criterion changes after approval: reject/refresh; preserve unrelated fields.
9. Duplicate/out-of-order events: no duplicate findings or writes; fetch authoritative current version.
10. Restricted source/other tenant: no titles, snippets or inferred changes leak.
11. Reviewer lacks Jira write permission: no write, clear error.
12. Prompt injection in source/issue: treated as content.
13. Timeout after remote comment succeeds: reconcile without duplicate.
14. Removed source/link: mark unavailable, no speculative changes.
15. Oversized page/rate limit: bounded processing, visible pending state.
16. Dismissed finding plus identical rescan: no renewed nag; new decision version can reopen.

Add independently authored held-out variants. Report finding precision/recall, evidence validity, false-positive rate on unaffected controls, stale-write rejections and remote duplicate count separately. Small synthetic suite results are not production reliability.

Meaningful checks: unit tests on version/evidence state machine; tenant/permission integration tests; queue replay and crash recovery; real development-site event/read/write demonstration; browser keyboard/diff flow; independent judge installation. Keep evidence files with date/command/revision and redacted output. A rendered mock interface is not integration proof.
