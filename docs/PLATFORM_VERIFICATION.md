# Verify before implementation
Checked reference links November 1, 2026; API availability must be tested on the actual tenant. Read the latest docs before writing manifest or CLI commands.

- Competition: https://codegeist2026.devpost.com/ and /rules
- Forge: https://developer.atlassian.com/platform/forge/
- Confluence events: https://developer.atlassian.com/platform/forge/events-reference/confluence/
- Rovo agent: https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/
- Forge MCP: https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/
- TWG API: https://developer.atlassian.com/platform/teamwork-graph/call-the-teamwork-graph-api/

Verify installed CLI via help/version, required runtime, authentication, app ownership, site URL, product entitlements, cross-product compatibility, read/write scopes, storage constraints, events, queue limits and inference availability. Do not invent login-status flags; inspect help. Never print tokens.

Forge MCP is a preview module; verify admin enablement, client connection and usable tools. App-exposed MCP is distinct from using Atlassian/Forge documentation MCP while coding. Start read-only: inspect_decision_change, list_affected_work, get_proposal. Writes stay in the authenticated human review flow.

Rovo bonus requires a working eligible module and real agent/tool demonstration. A normal chat UI or unused manifest is insufficient evidence. TWG bonus requires actual supported Graph ingestion/consumption, entitlement and reproducible request evidence; locally stored links do not qualify. If unavailable mark blocked and retain the main app.

Judge sharing: inspect current Forge sharing/distribution requirements, production environment install flow, licensing/account constraints, and eligibility of multi-product installation. Rehearse with another authorized site/account. Marketplace eligibility requires actual listing or submitted review ticket, never a draft screenshot. Public posting and submission remain user actions unless explicitly authorized.

## Verification results, 2026-11-01 (local host, no site)

| Item | Command or source | Result |
| --- | --- | --- |
| CLI version | `forge --version` | 15.0.0 |
| Authentication | `forge whoami` | Logged in as Santhosh Balasa (ceo@yablokolabs.com) |
| Developer Space | `forge create` (first attempt) | None existed; creating an app requires membership. Created `DecisionFuse`. |
| Template ids | interactive template picker | `<product>-<module>-<ui-kind>`; `jira-issue-panel-custom-ui` used |
| Manifest validity | `forge lint` | No issues found (Jira panel, Confluence byline, resolver, consumer, 3 actions, rovo:agent, rovo:mcp) |
| Storage API | `@forge/api` typings | No `storage` export in 8.4.0-next.8; Forge storage comes from `@forge/kvs` (`kvs.get/set/delete`) |
| Rovo agent contract | developer.atlassian.com Rovo Agent page, last updated Oct 2 2026 | `rovo:agent`: key, name, description, icon, prompt, conversationStarters, actions, skills, followUpPrompt |
| Rovo MCP contract | Rovo MCP (Preview) page, last updated Oct 29 2026 | `rovo:mcp`: key, name, tools (action keys), max one module per app; tools come from `action` modules; external clients use `https://mcp.atlassian.com/forge/<appId>` |
| External MCP exposure | same page | Disabled by default; a site or org admin must enable each tool per installation before a client can connect |
| Teamwork Graph | not testable | No site connected, so entitlement and API access are unverified. Native Jira/Confluence links are not TWG use |
| Tenant entitlements | not testable | Rovo availability, admin policies and cross-product install require a real site |

## Verification results, 2026-11-01 (site `yablo.atlassian.net`)

| Item | Command or request | Result |
| --- | --- | --- |
| CLI authentication | `forge whoami` with `FORGE_EMAIL`/`FORGE_API_TOKEN` | Logged in; keychain login had lapsed, token env auth works |
| Deployment | `forge deploy -e development` | v2.0.0 deployed after fixing `noEmit` in `tsconfig.json` |
| Jira install | `forge install -p Jira -e development` | Complete, installation `e63b5663-a630-468b-883a-cfcaf946d437` |
| Confluence install | `forge install -p Confluence -e development` | Complete, installation `ca73eaa3-ea71-4e76-a8e9-89cf74520fe2` |
| Cross-product scopes | install output | Jira install explicitly required a separate Confluence install; no implied access |
| Site products | REST probes | Jira 200, Confluence 200 authenticated, JSM servicedesk API 200, 0 Jira projects before seeding |
| Project creation shape | `POST /rest/api/3/project` vs `/rest/api/2/project` | v3 with `projectTemplateModuleKey` → 400; v2 with `projectTemplateKey` → 201 |
| Block extraction input | page `426003` storage body | `BEGIN DECISION checkout-guest status=accepted` present and normalized |
| Review loop | panel resolver | **Not invoked** — needs a signed-in browser session |
| Rovo agent | `rovo:agent` | **Not invoked**, no conversation recorded |
| MCP tools | `rovo:mcp` | **Not invoked**; exposure disabled until a site admin enables each tool |
| Teamwork Graph | — | Not tested, not used. Jira/Confluence links are not TWG evidence |

Consequences for claims: deployment and installation are **verified**. The review loop, Rovo agent and MCP tools are **installed but never invoked**. No bonus eligibility is claimed until a real invocation and an admin enablement are recorded here with redacted output.
