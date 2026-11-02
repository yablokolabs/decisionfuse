# Production deploy and judge distribution — 2026-11-02

The Devpost field asks for an installation link. An installation link only installs
the **production** build, and sharing is off until an admin turns it on. This records
what was done here and what is still a console click.

## What the CLI did

| Step | Command | Result |
| --- | --- | --- |
| Auth | `FORGE_EMAIL` / `FORGE_API_TOKEN` loaded from `~/.hermes/.env` by name only | `forge whoami` → Santhosh Balasa (ceo@yablokolabs.com) |
| Production deploy | `forge deploy -e production --non-interactive` | **✔ Deployed** version **2.0.0**, `forge lint` clean during the run |
| Runs on Atlassian | deploy output | **Eligible** for the program at 2.0.0 |
| Distribution page | deploy output | `https://developer.atlassian.com/console/myapps/42074d3d-8872-4475-850b-8a75eb4d10b4/manage/distribution` |

The deploy output also points at the console: *"To install on any other site, generate
an installation link in the developer console and share it with the site admin."*

## What cannot be done from this host

`forge install --help` (CLI **15.0.0**) has no sharing flag, and the distribution
reference (last updated **Oct 30, 2026**) describes sharing as a developer-console
action: Distribution → Edit → choose a distribution status → select the Atlassian
apps → Save → copy the installation link. There is no documented API for it.

So the link itself must be copied by a human in the console. Nothing about install
eligibility, link signing or admin rights is in doubt: the blocker is a UI control.

## Distribution status, as documented

| Status | Who can install |
| --- | --- |
| **Not sharing** (current) | App contributors only, via the Forge CLI |
| Sharing within organization | Anyone with the link who belongs to an org the app owner belongs to |
| **Sharing** | Anyone with the link — the only status that works for a judge outside the owner's org |

Judges are outside the owner's organization, so **Sharing** is required. Selecting
Jira **and** Confluence in the console is required too: our app ships a Jira issue
panel and a Confluence byline item, and the console restricts installation to sites
running every selected product. A judge must then install it on both products, or the
Confluence panel that registers decisions never appears.

## Judge instructions

`docs/JUDGE_SETUP.md` carries the paste-ready setup: what to install, then how to
create the decision block and linked issue on their own site, what the panel should
show at each step, and what is deliberately not enabled.
