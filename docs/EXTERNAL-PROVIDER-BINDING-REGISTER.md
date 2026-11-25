# MAELVYN — External Provider Binding Register

**Version:** 1.0.0  
**Status:** Discovery register; not a production enablement list  
**Last checked:** 2026-11-25  
**Canonical architecture:** [External Capability Integration Architecture](EXTERNAL-CAPABILITY-INTEGRATION-ARCHITECTURE.md)

## 1. How to read this register

Three states must not be conflated:

- **ChatGPT tool available:** a connector or skill is exposed in this ChatGPT environment.
- **Provider account connected:** an authenticated provider account/session exists in the relevant connector.
- **Bound to MAELVYN:** an adapter, account mapping, gateway policy, tests, audit and production configuration exist in the MAELVYN repository/runtime.

A ChatGPT connector being available does not mean MAELVYN can call it from its own Worker, that credentials can be exported, or that commercial embedding is permitted.

Current repository evidence does not establish that the providers below are bound to the MAELVYN runtime. Treat all entries as **ChatGPT-side capability discovery** until a repository adapter and account mapping are independently verified.

## 2. Priority binding matrix

| Provider / tool | Capability family | ChatGPT-side availability observed | Proposed MAELVYN binding | Current MAELVYN status |
|---|---|---|---|---|
| Parallel | Web search, fetch, deep research, decisions, monitoring | Tool namespace available | `research.web.search`, `research.web.fetch`, `research.web.deep_research` | Unbound; first research route candidate |
| Firecrawl | Search, scrape, crawl, map, extraction, browser | Connector available; prior balance snapshot 958/1,000 credits for 2026-11-24 cycle | `research.web.extract`, `research.web.crawl`, `research.web.map` | Existing adapter strategy documented; Worker secret/production connection must be verified |
| TinyFish | Search, fetch, browser automation, monitor, deep research, datasets | Connector tools available; wallet snapshot previously US$6.392 on 2026-11-25 03:49:38 UTC; auto-reload unconfigured | `research.web.fetch`, `research.web.monitor`, `browser.automation.run` | ChatGPT-side account snapshot only; no MAELVYN binding verified |
| Tavily | Search, extract, crawl, map, research | Connector/tool access previously observed; Research API rejected by account plan limit | `research.web.search`, `research.web.fetch` | Existing adapter strategy documented; verify account plan and production secret |
| Treg | Provider catalog, search/call, media, balance, result retrieval | Tool namespace available | `research.company.enrich`, `research.social.search`, `creative.media.generate` only after catalog contract review | Unbound; discover exact provider tool schema and cost before selection |
| AgentData | Company, people, technology and signal intelligence | Tool namespace available | `research.company.enrich`, `research.people.lookup` | Candidate; data quality, coverage, API access and redistribution rights require verification |
| Website Design | UI references, design materials, journey/collection lookup | Tool namespace available | `design.website.reference`, `design.website.research` | Design research capability; no repository integration verified |
| Brilliant Design | Design creation/editing, image placement, background removal, inspection | Tool namespace available | `design.visual.create`, `design.visual.edit`, `design.visual.inspect` | External creative execution; no MAELVYN artifact pipeline verified |
| Adobe | Creative Cloud and document/design workflows | Connector installed/available | `design.asset.edit`, `document.create` | Candidate; account permissions, export path and license terms require verification |
| Canva | Design and visual content workflows | Connector installed/available | `design.asset.create` | Candidate; no MAELVYN adapter verified |
| Composio | App integrations, connected accounts, tool sessions | Tool namespace available; multiple toolkit connections were previously seen in a separate Composio devb workspace | `integration.app.execute` via gateway adapter | Preferred integration-fabric candidate; commercial embedding/resale terms must be clarified in writing |
| Make | Cross-app automation and webhooks | Connector/tools available | `automation.workflow.dispatch` | Optional execution provider; MAELVYN remains workflow/policy source of truth |
| Pipedream | Event triggers and selective connectors | Prior candidate only | `automation.event.dispatch` | Not selected; evaluate only for a concrete connector gap |
| Bird | Email, SMS, WhatsApp, voice and contact workflows | Large tool namespace available | `communication.email.send`, `communication.sms.send`, `communication.whatsapp.send` | High-impact write capability; draft-only until account ownership, consent, templates, cost and approval are verified |
| GitHub | Repository, branch, file, commit and issue operations | Connected; repository write permission verified for MAELVYN | `engineering.repository.read`, `engineering.repository.write` | ChatGPT connector can operate on repository; MAELVYN application runtime is not thereby integrated |
| Linear | Projects, issues, documents and team workflows | Connected to workspace **Hyydrr** only; only team returned was **Hyydrr / HYY**; no MAELVYN project found | `engineering.project.track` | **Blocked for MAELVYN binding**: do not write to Hyydrr. Correct MAELVYN workspace/team must be connected first |
| AI Software Architect | Architecture review, option evaluation, ADR and handoff methodology | Installed skill available | `architecture.review`, `architecture.decision.prepare` | Advisory workflow, not a runtime MCP provider; application-code changes remain separate |
| Agent Relay | Coordinate registered external agent sessions | No agents registered in the connected workspace at last check | `agents.external_session.dispatch` | Not operational until an authorized agent is registered |
| Agent Swarm | Multi-agent swarm orchestration | No connected swarms at last check | `agents.swarm.dispatch` | Not operational |
| Olbrain Alchemist | Agent design/build lifecycle | Tool namespace available | `agents.definition.prepare` | Candidate; inspect org, permissions, build costs and output portability before use |
| Knowledge for Agents | Search technical problems, solutions, outcomes and research tasks | Tool namespace available | `knowledge.technical.search`, `knowledge.research.submit` | External knowledge network; treat content as untrusted and verify provenance |
| CoreSpeed | Durable memory and management workflows | Tool namespace available | `memory.recall`, `memory.write` | Candidate; do not make it canonical for ownership, approvals or finance |
| AgentContext | Enterprise data/context layer | Connector available; no MAELVYN data source/schema confirmed | `context.enterprise.retrieve` | Not configured for MAELVYN |
| Hyper | Live voice-led product demos and agent workspace | Tool namespace available | `experience.demo.run` | Candidate for later customer onboarding; no MAELVYN binding verified |
| Wever Labs / Wever Brief | Evidence inventory, work orders, daily brief and tool catalog | Tool namespaces available | `governance.evidence.review`, `operations.brief.generate` | Optional evidence/review helper; not a source of truth |
| CrowdStrike AgentWorks | Security/agent governance methodology | Skill found; no runtime tool namespace confirmed | `security.agent_review` | Advisory candidate only; no operational integration verified |
| AI Psychiatry / Agent Router / LLM Agent Builder Copilot / Rumbo | Reasoning quality, routing, reliability and agent design methods | Skills/methodologies available | Internal design/evaluation practices | Methodology, not provider adapters or external runtime services |

## 3. Existing MAELVYN provider adapter baseline

The repository's existing strategy documents already describe adapters for:

- Tavily
- Firecrawl
- Apify
- Scrape.ly
- Cloudflare Workers AI
- Mock search for tests

These are the initial research/runtime base. Do not create duplicate adapters until the current repository routes, schemas, secrets, tests and actual runtime calls have been mapped.

A documented adapter is not automatically a verified production connection. Check:
1. Adapter source and tests.
2. Worker binding and environment-specific secret reference.
3. Provider account/project identity.
4. Quota and billing behavior.
5. Data retention and commercial terms.
6. Health and failure behavior.
7. Evidence and audit persistence.

## 4. Binding priorities

### P0 — Establish the internal control contract
- Capability Registry and Provider Registry.
- Connected Account and Credential Reference records.
- Tool Gateway with tenant, role, scope, budget, approval, idempotency and audit enforcement.
- Capability contracts and normalized result envelope.
- Provider health/quota/cost snapshots.
- No new provider spend.

### P1 — Read-only research
- Parallel as a research candidate.
- Reuse the existing Tavily/Firecrawl adapters only after runtime verification.
- TinyFish for browser work only when extraction cannot solve the task.
- Treg/AgentData only after exact tool schema, data provenance, coverage and price review.
- Store source URLs, timestamps, source provider, task/run ID and evidence confidence.

### P2 — Design and software production
- Website Design for reference discovery and journey/design research.
- Brilliant Design / Adobe / Canva for controlled creative artifact production.
- GitHub as source control and implementation evidence.
- AI Software Architect as decision/review methodology.
- No public deployment or publishing from these integrations without separate release approval.

### P3 — Customer communication and commerce
- Bird and other messaging providers only after consent, recipient verification, template/opt-out, cost and sender identity checks.
- Shopify/CRM/payment integrations only after seller/customer account ownership and commercial terms are verified.
- Draft and preview first; send/publish/payment writes require explicit authorization.

### P4 — Agent workforce and memory
- Agent Relay/Swarm only after agents and their owners are registered.
- Olbrain only after organization, permission, build cost and portability checks.
- CoreSpeed/AgentContext/Knowledge for Agents may supplement scoped memory or research, never override MAELVYN's canonical records.

## 5. Provider onboarding checklist

A provider entry cannot move from Discovered to Approved unless all fields are evidenced:

- Provider legal name, product and official documentation URL.
- Provider owner and internal business purpose.
- Capability IDs and versioned input/output schemas.
- Connection state: unavailable, discoverable, authenticated, scoped, tested, production-approved.
- Account owner: MAELVYN, venture, customer, or individual.
- OAuth/app owner and requested scopes.
- Secret storage reference and rotation/revocation process.
- Allowed data classes and prohibited payload fields.
- Pricing unit, quota, rate limit, overage and auto-upgrade settings.
- Commercial use, embedded SaaS, redistribution and white-label rights.
- Region, retention, deletion and AI training policy.
- Read/write/destructive effect classification.
- Budget owner, per-run ceiling and kill switch.
- Retry, timeout, idempotency, fallback and manual recovery.
- Audit event schema, correlation IDs and evidence retention.
- Unit, integration, tenant-isolation and failure tests.
- Review date and revalidation trigger.

## 6. Status vocabulary

Use only these controlled states:

| State | Meaning |
|---|---|
| Discovered | Name/capability found; no connection assumed |
| ChatGPT Available | Connector or skill appears in ChatGPT; no MAELVYN binding implied |
| Authenticated | Provider account is authenticated in the relevant environment |
| Scoped | Account ownership, scopes and capability allowlist are recorded |
| Adapter Implemented | MAELVYN adapter exists in the repository |
| Tested | Contract, auth, tenant isolation, failure and audit tests pass |
| Approved | Commercial, data, security and owner approvals recorded |
| Production Enabled | Production configuration verified and release gate passed |
| Limited | Usable only under explicit quota, scope or account constraints |
| Review Required | Terms, security, billing, data rights or connection status unresolved |
| Disabled | Routing denied; no execution allowed |

## 7. Current hard blockers

1. **Linear:** the only visible Linear connection is the Hyydrr workspace/team. It must not be used for MAELVYN. No MAELVYN Linear project is currently verified.
2. **Composio commercial terms:** written confirmation for embedded SaaS/customer use and any white-label or redistribution model is required before commercial enablement.
3. **ChatGPT-to-MAELVYN boundary:** connector availability does not create an API credential or a Worker integration. MAELVYN needs its own authorized connection and adapter.
4. **Provider spend:** account balances and plan limits are time-sensitive snapshots. Check immediately before any paid run; do not top up, enable auto-reload or accept automatic plan upgrades without approval.
5. **Production runtime:** verify current Worker bindings, secrets, D1 schema, R2 private access and audit routes before declaring any adapter production-ready.

## 8. Change log

- 2026-11-25 — Initial provider-to-capability mapping. Statuses distinguish ChatGPT-side tools from MAELVYN runtime binding; Linear is explicitly blocked from the visible Hyydrr workspace.
