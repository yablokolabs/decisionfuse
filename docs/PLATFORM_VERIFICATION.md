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

Consequences for claims: Rovo and MCP modules are **declared and lint-clean but never invoked**. No bonus eligibility is claimed until a real invocation and an admin enablement are recorded here with redacted output.
