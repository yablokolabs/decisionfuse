# Marketplace bonus — status 2026-11-02

**Nothing to submit for this field.** There is no Marketplace listing and no submitted
review ticket, so there is no URL to paste. The bonus is not claimed.

| Item | State |
| --- | --- |
| Marketplace listing | **None.** No listing exists, published or draft |
| Review ticket | **None.** Nothing was submitted for Marketplace review |
| Distribution in use | Developer-console installation link (sharing), installing production 2.0.0 |
| Bonus claim | **Not claimed** — the Devpost field should be left empty rather than filled with something that is not a listing |

## The documented conflict, quoted

From https://developer.atlassian.com/platform/forge/distribute-your-apps/ (last updated
**Oct 30, 2026**):

> Apps that already have a license in the app manifest or have been submitted for listing
> on Marketplace can't be shared via installation link; in order to share and test these
> apps, you'll need to copy the app's code, create a new, unlicensed version of the app,
> and share this version via installation link.

Read plainly: **submitting this app for Marketplace review would stop the installation
link we just gave the judges from working.** The link is what the review team uses to
install, and the judging window runs to Dec 22, 2026. Submitting before judging finishes
trades the primary judge path for a bonus field.

The documented way to have both is to duplicate the app into a second, unlicensed app and
share that one. That is not a rename: a new app id means a fresh install on the
development site, a fresh deployment, and re-verifying everything the current evidence
rests on. With the deadline on Dec 22, 2026 there is time to do it properly, but it is still a second app with its own installs and its own unverified evidence, so the bonus is not worth starting before the primary install link has been tested by a non-contributor.

## What a listing would actually take

A Forge app reaches Marketplace by a Marketplace partner account creating a listing —
app details, screenshots, support and privacy/security disclosures, a pricing and
licensing model, and then Atlassian's review. None of that exists in this repository,
and none of it can be manufactured from this host. Marketplace eligibility requires the
real listing or the real submitted review ticket, never a draft screenshot.

## Independent check, 2026-11-02

The owner's account was not trusted to answer this one. Atlassian's public Marketplace API
was queried directly:

| Query | Result |
| --- | --- |
| `GET marketplace.atlassian.com/rest/2/addons?text=DecisionFuse&limit=10` | **200**, `matches 0` |
| `GET marketplace.atlassian.com/rest/2/addons?text=yablokolabs&limit=10` | **200**, `matches 0` |

Both searches are empty, so there is no listing under the app name or the vendor name.
A Marketplace URL therefore cannot be produced honestly, and neither can a review-ticket
link, because nothing was ever submitted.

## Recommendation

1. Leave the Marketplace bonus field empty. Do not describe a listing that does not exist.
2. Keep the installation link and the sharing distribution alive through judging.
3. If the bonus matters more than the judge path later, duplicate the app first, then
   submit the original — in that order — and re-run the panel and MCP checks against the
   duplicate before anything is claimed.
