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
