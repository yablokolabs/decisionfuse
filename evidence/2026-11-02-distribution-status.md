# Distribution status — 2026-11-02

Reported from the developer console Distribution page for app
`42074d3d-8872-4475-850b-8a75eb4d10b4`.

| Field | Value |
| --- | --- |
| Distribution status | **Sharing with anyone** — "Anyone with the distribution link can install your app on any Atlassian site" |
| App owner | Santhosh Balasa |
| Company / Department | Yabloko Labs Ltd. |
| Customer support contact | https://yablokolabs.com/#contact |
| Privacy policy | https://yablokolabs.com/privacy-policy |
| Terms of Service | **Not provided** |
| Stores personal data? | **No** |

## What this settles

`Sharing with anyone` is the only status that lets a judge outside the owner's
organization install. That was the last open risk against the Access requirement, and it
is now answered at the settings level rather than by inference from a working URL.

Still unproven: nobody outside the owner's accounts has completed an install. The setting
permits it; the install itself is untried. `docs/PANEL_AND_MCP_RUNBOOK.md` Part 0 is the
ten-minute confirmation, and it is optional now that the setting is confirmed.

## Two discrepancies worth the owner's attention

1. **"Stores personal data? No" does not match what the app persists.** Audit records and
   approvals keep Atlassian account identifiers: `Decision.ownerAccountId`,
   `Approval.approvedBy` and `AuditRecord.actor`. An account id is a pseudonymous
   identifier; whether it counts as personal data depends on jurisdiction and on how it is
   linked to a person. The declaration is visible to any admin on the install screen, so
   it should either be changed to "Yes" with the privacy policy covering it, or backed by
   a written decision that account ids are not personal data for this purpose. Nothing was
   changed in code for this: stripping the ids would weaken the audit trail, which is the
   opposite of what this app is for.
2. **Terms of Service is empty.** Not required to install, and not a judging criterion, but
   it is one of the fields a reviewer reads on the install screen, and it is required for
   Marketplace listing later. A one-page terms page would close it.

Both are disclosure questions, not defects in behaviour.
