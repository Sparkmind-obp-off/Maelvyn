# MAELVYN — Free-First Provider Discovery & Productization Intelligence

**Status:** Discovery baseline / proposed operating policy  
**Reviewed:** 2026-11-25  
**Scope:** ChatGPT-connected capabilities, external provider plans, open-source/self-hosted options, commercial packaging  
**Important:** A provider being available as a ChatGPT tool does not mean its account is connected to MAELVYN runtime, nor that its use is free or commercially redistributable.

## 1. Decision

MAELVYN adopts a **free-first, trial-first, email-signup-first** provider acquisition policy.

A provider may enter the default stack only when:
1. A usable free tier or free trial is documented.
2. Email signup is sufficient, or any extra verification/card requirement is explicitly recorded.
3. No paid resource, top-up, auto-reload, paid subscription, or card authorization is required to begin the intended test.
4. Limits, reset windows, overage behavior, and stop conditions are known.
5. Commercial use, embedded SaaS use, white-labeling, resale, and customer-data processing terms are checked separately.
6. A MAELVYN adapter and policy gate exist before production execution.

**Free tier ≠ free trial ≠ free-to-host ≠ commercially redistributable.** These must be separate fields in the registry.

## 2. Provider status model

Use exactly these lifecycle states:
- `DISCOVERED`: capability or provider found.
- `PLAN_VERIFIED`: official pricing/terms reviewed.
- `ACCOUNT_AVAILABLE`: account or ChatGPT connector is accessible.
- `TEST_ELIGIBLE`: a bounded test can run without payment or card authorization.
- `TERMS_CLEARED`: commercial and data-processing use reviewed.
- `ADAPTER_DESIGNED`: internal contract and adapter defined.
- `BOUND_TO_GATEWAY`: routed through MAELVYN Execution Gateway.
- `PRODUCTION_APPROVED`: explicit owner approval and operational checks passed.
- `BLOCKED` / `REJECTED`: reason recorded.

Do not use a single boolean such as `connected=true` to represent all these states.

## 3. Initial discovery findings

The table below distinguishes public plan facts from the live connected-account snapshot. Public plan claims are based on official provider pages checked on 2026-11-25; account snapshots are read-only checks made during this discovery session.

| Provider | Capability | Public free entry | Live/account observation | Initial decision |
|---|---|---|---|---|
| TinyFish | Web search, fetch, browser, agent, monitoring, research, datasets | TinySearch and TinyFetch have free quotas; no card required for those two. Agent/browser/monitor/research are metered. | Wallet $6.392; auto-reload unconfigured. | Use Search/Fetch only for free-first research; gate all metered products. |
| Firecrawl | Search, scrape, crawl, map, browser interaction, agent, monitoring, paper research | 1,000 credits/month, no card on Free plan. | Connected account showed 0 remaining credits out of 1,000 plan credits; billing period 2026-11-13 to 2026-12-13. | Publicly eligible, current account execution blocked until credits reset or verified. |
| Tavily | Web search, extract, crawl, map, research | 1,000 API credits/month, no card; hard stop unless pay-as-you-go is enabled. | Connector exists; previous Research API access was plan-limited. | Recheck endpoint-specific access; do not assume Research API is included. |
| Scrape.ly | Actor store, crawlers, scrapers, MCP servers, tasks and automations | $5 usage included monthly on Free; no card to start; prepaid/no surprise billing. | Actor discovery works. Individual Actors can still be metered. | Good bounded discovery source; inspect actor price before every run. |
| Treg | Catalog of 3,800+ API endpoints, provider routing, own-key tools | Catalog discovery is available; execution is priced per endpoint or team key. | Current connection is team Templatekit, $1 balance, zero registered team tools. | Catalog-only until the MAELVYN team is explicitly connected; never spend this balance for MAELVYN. |
| Composio | 1,700+ app integrations, OAuth, MCP and tool calls | Free plan advertises 100k tool calls/month, 50k triggers, 3 members, no card. | ChatGPT tool namespace exists; workspace/account entitlement must be verified. | High-priority integration-fabric candidate; commercial embedded/white-label terms still require written clearance. |
| Nango | Auth, API/MCP connections, syncs, triggers, webhooks | Free plan with hard-capped monthly limits; public page lists 10 connections, 10 compute hours, 10GB data transfer. | Not yet connected to MAELVYN runtime. | Strong alternative/companion for BYOC OAuth and credential lifecycle. |
| Langfuse | LLM tracing, evaluation, prompt management, datasets | Cloud Hobby free/no card; self-hosted core is MIT-licensed. | No MAELVYN deployment verified. | Strong observability/evaluation candidate; self-hosting costs still depend on infrastructure. |
| Cloudflare | Workers, D1, R2, Queues, Workflows, Workers AI, KV, DO | Several components have meaningful Free quotas; some features and higher limits require Workers Paid ($5 minimum/month). | Existing MAELVYN is Cloudflare-first; exact current resource/billing state must be audited before changes. | Preferred control-plane runtime; remain inside verified Free quotas and do not enable Paid. |
| Make | Visual automation and app integrations | Free plan advertises 1,000 credits/month. | Connector exists; no current account plan verification. | Optional no-code bridge; verify card/signup requirements and execution-credit semantics. |
| n8n | Self-hosted workflow automation | Community Edition can be self-hosted free; email registration unlocks extra Community features. | No MAELVYN deployment verified. | Internal operations only unless licensing confirms customer-facing model. SUL does not permit hosting n8n as a service, white-labeling, or letting customers build/configure workflows without commercial licensing. |
| Mobirise | Visual website builder/export | Free desktop app, commercial website use, no card; 3 AI generations/month reported on official site. | No integration verified. | Useful low-cost design/build option; treat exported site assets as deliverables, not runtime dependency. |
| Website Design (ChatGPT) | UI reference discovery, material collections, journey extraction | Tool is available in ChatGPT; external runtime API/free allowance not established. | Connector tools available in this ChatGPT session. | Research/design intelligence only until runtime/API and terms are verified. |
| Brilliant Design (ChatGPT) | Design generation/editing, background removal, image placement, inspection | Tool is available in ChatGPT; free quota and external API terms not established. | Connector tools available in this ChatGPT session. | Treat as operator-assisted production capability, not an MAELVYN customer-facing API yet. |
| Parallel (ChatGPT) | Search, fetch, research, decisions, product/image/flight search, monitoring | Connector availability does not prove an unlimited free tier. | Connector tools available in this ChatGPT session. | Use only after account quota/cost check; adapter candidate for evidence/research. |
| AI Software Architect (skill) | Architecture workflow, ADRs, contracts, implementation planning | Installed methodology/skill, not a provider runtime API. | Skill content is available in ChatGPT. | Internal engineering method; not a billable provider integration. |

## 4. Productized MAELVYN capability packages

MAELVYN sells finished workflows, analysis, and outcomes—not raw provider API access.

### Package A — Scout
**Outcome:** a sourced opportunity or market intelligence brief.
- Research brief and source ledger
- Competitor and alternative mapping
- Demand signals and risk summary
- Recommendation with confidence and unknowns

**Default stack:** Tavily free allowance / TinyFish Search+Fetch / existing public sources. Firecrawl only when its free balance is available. No paid deep research or agent execution by default.

### Package B — Launch
**Outcome:** a validated offer and ready-to-publish launch kit.
- Offer positioning and pricing hypothesis
- Landing-page structure and copy
- Brand/UI reference board
- Product or service delivery checklist
- Analytics and validation plan

**Default stack:** MAELVYN templates + Website Design/Brilliant Design as assisted tools + Cloudflare Free static assets. Mobirise can be an export tool. Customer-specific production is reviewed before publication.

### Package C — Operate
**Outcome:** a controlled, repeatable business workflow.
- Intake → approval → execution → verification → delivery
- Task routing and notifications
- Audit trail and failure/retry handling
- Customer-specific account connections (BYOC)

**Default stack:** MAELVYN Core + Execution Gateway + Cloudflare Free quotas; Composio or Nango only after account and commercial terms are cleared. Make/n8n are optional implementation aids, not the system of record.

### Package D — Intelligence & Optimize
**Outcome:** recurring performance and improvement reports.
- Monitoring and evidence refresh
- KPI and funnel analysis
- Quality evaluation and regression checks
- Recommended next experiments

**Default stack:** Langfuse self-hosted or free cloud tier for AI observability; provider monitors only inside verified free quotas. Paid scraping and high-frequency monitoring are opt-in.

### Package E — Studio / Creative Delivery
**Outcome:** client-ready design, content, and digital assets.
- Creative brief and concept
- Design references and production
- QA, revisions, approval and private delivery
- Asset rights and provenance record

**Default stack:** ChatGPT design capabilities and open/free design tools for assisted production. Any generative provider with unclear commercial rights or paid metering remains disabled until verified.

## 5. Package economics and customer transparency

- Each package has a defined deliverable, scope, revision policy, service level, and evidence record.
- Free provider allowances are an internal cost advantage, not a promise of unlimited customer usage.
- Metered usage must have a hard per-job budget, per-customer quota, and owner-approved ceiling.
- Customer-specific paid usage is disclosed as an add-on before execution.
- No hidden provider pass-through charges. No automatic top-ups.
- If a free quota is exhausted, the job pauses, switches to an approved free fallback, or requests customer/owner approval.
- Never expose provider credentials or sell raw third-party access.
- Record provenance, license, commercial-use permission, attribution requirements, retention, and deletion policy for every output.

## 6. MAELVYN internal binding architecture

```text
Customer / Operator UI
        |
MAELVYN Product & Package Catalog
        |
MAELVYN Core (tenant, identity, RBAC, finance, approval, audit)
        |
Agentic OS (plan, agent, task contract, evaluation)
        |
Execution Gateway (policy, allowlist, budget, idempotency, approval)
        |
Capability Registry + Provider Registry
        |
Provider Adapter (stable MAELVYN contract)
        |
External provider / ChatGPT-assisted operator tool / self-hosted service
        |
Evidence, normalized output, cost record, audit event
        |
MAELVYN delivery & customer outcome
```

Provider adapters expose capability contracts, not provider-specific objects:
- `research.search`
- `research.fetch`
- `research.crawl`
- `browser.navigate`
- `browser.extract`
- `design.reference.discover`
- `design.asset.create`
- `design.asset.edit`
- `workflow.trigger`
- `integration.auth.connect`
- `agent.evaluate`
- `observability.trace.write`

Every execution must include tenant, actor, integration-account reference, capability, provider, policy decision, budget ceiling, idempotency key, approval state, evidence reference, and normalized result.

## 7. ChatGPT connector vs MAELVYN runtime

Maintain separate columns:
- `chatgpt_tool_available`
- `provider_account_connected`
- `provider_api_access_verified`
- `maelvyn_adapter_exists`
- `gateway_bound`
- `terms_cleared`
- `free_quota_verified_at`

A ChatGPT tool call is an operator-side capability. It does not create a durable MAELVYN runtime integration. Do not scrape ChatGPT UI or reuse ChatGPT credentials as an API.

## 8. Immediate discovery backlog

1. **P0 — Linear workspace correction:** current Linear connection is still Hyydrr / HYY; no MAELVYN team or project exists. Do not create MAELVYN issues there. Connect the correct workspace/team first.
2. **P0 — Account map:** verify which providers have a MAELVYN-owned account, which are user-owned/BYOC, and which are only ChatGPT-connected.
3. **P0 — Free quota ledger:** capture signup requirement, email verification, card requirement, recurring allowance, reset date, hard-stop/overage, and current balance.
4. **P1 — Integration fabric decision:** compare Composio vs Nango vs custom MCP for BYOC OAuth, credential refresh, webhook, logs, and commercial embedded use.
5. **P1 — Research vertical slice:** Tavily/TinyFish Search+Fetch → normalized evidence → MAELVYN research brief, with zero paid calls.
6. **P1 — Design vertical slice:** Website Design references → MAELVYN design brief; test Brilliant Design only within verified free allowance.
7. **P2 — Product package pilots:** Scout and Launch as human-approved deliverables before any autonomous customer-facing execution.
8. **P2 — Linear project/milestones/issues:** create only after the correct MAELVYN Linear workspace/team is connected.

## 9. Explicitly not authorized

This discovery does not authorize:
- payment, top-up, card addition, auto-reload, subscription or paid upgrade;
- running paid Actors, browser agents, deep research, or high-volume crawl;
- production deployment or new Cloudflare resources;
- customer-facing publishing, messaging, payments, or irreversible changes;
- moving credentials or provider accounts between workspaces;
- claiming a provider is commercially cleared without reviewing the applicable terms.

## 10. Official sources checked

- TinyFish pricing: https://www.tinyfish.ai/pricing
- Firecrawl pricing: https://www.firecrawl.dev/pricing
- Tavily pricing: https://www.tavily.com/pricing
- Tavily billing and limits: https://help.tavily.com/articles/8298987937-billing-credits-usage-limits
- Scrape.ly pricing: https://scrape.ly/pricing
- Composio pricing: https://composio.dev/pricing
- Nango pricing: https://nango.dev/pricing
- Langfuse cloud pricing: https://langfuse.com/pricing
- Langfuse self-hosted license/pricing: https://langfuse.com/pricing-self-host
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare D1 FAQ: https://developers.cloudflare.com/d1/reference/faq/
- n8n license FAQ: https://support.n8n.io/article/can-i-use-your-license-for-my-use-case
- Make pricing: https://www.make.com/en/pricing
- Mobirise: https://mobirise.com/

---
This document is a discovery and productization baseline. It is not proof that any provider is connected to the MAELVYN runtime or that every package is ready for public sale.
