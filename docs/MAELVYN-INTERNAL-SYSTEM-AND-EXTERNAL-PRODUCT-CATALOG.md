# MAELVYN Internal System & External Product Catalog

**Status:** Architecture and product baseline — proposed, not production-enabled  
**Principle:** Build the control. Buy the capabilities. Connect the ecosystem. Monetize the outcomes.

This is the canonical bridge between MAELVYN's internal operating system, external provider capabilities, and customer-facing products. A listing does not prove that an account is connected, an API is enabled, a quota is available, or commercial use is licensed.

## 1. Three dimensions that must stay separate

MAELVYN has **five internal capability layers**, **six customer-facing products**, and **four rollout stages**. They are related but not interchangeable.

### Five internal capability layers

| Layer | Internal responsibility | Internal modules | External capability families |
|---|---|---|---|
| L1 — Intelligence & Evidence | Find, collect, normalize, assess and preserve market evidence | Signal Engine; Research Orchestrator; Search/Fetch adapters; Extraction Pipeline; Source & Evidence Registry; Entity Resolver; Market, Competitor and Trend Analyzer | Search/research, crawling, extraction, SEO/SERP, company data, social intelligence |
| L2 — Execution & Control | Own identity, policy, permissions, approval, budget, execution and audit | MAELVYN Core; Identity/Tenant Registry; RBAC/ABAC; Policy & Approval Engine; Execution Gateway; Budget Guard; Usage Ledger; Task State; Audit & Evidence Ledger | Cloud runtime, identity, observability, queue/workflow primitives |
| L3 — Design & Product Factory | Turn evidence into validated, defined and buildable products | Opportunity-to-Offer; Product Definition Registry; Product Strategy; Brand Registry; Design Workflow; Website/Prototype Factory; Product Knowledge Base | Product strategy, UX/design, brand systems, website builders, code/prototype tools |
| L4 — Creative & Content Factory | Produce, review, version and deliver creative assets and campaigns | Creative Brief Engine; Storyboard/Prompt Pipeline; Image/Video/Audio Workflows; Editing & QA; Asset Registry; Content Calendar; Publishing Approval | Image/video/audio generation, editing, design, social publishing |
| L5 — Integration & Automation | Connect external accounts and automate bounded business workflows | Provider Registry; Connection Manager; OAuth/BYOC; Provider Adapters; MAELVYN MCP Gateway; Workflow Orchestrator; Browser/Communication/Commerce Adapters | App connectors, OAuth, workflow automation, browser automation, CRM, communications, commerce APIs |

**Foundational boundary:** MAELVYN Core and Owner Control are internal ownership/governance foundations, not external providers and not a sixth layer. Agentic OS orchestrates work across layers but is not the source-of-truth database. All external calls pass through the MAELVYN Execution Gateway; agents never call provider APIs directly.

### Four rollout stages

1. **Stage 1 — SIGNAL + Internal Intelligence:** research, evidence, opportunity validation and report generation. No payment or seller API is required.
2. **Stage 2 — FLOW + Internal Venture Operations:** CRM, email, calendar, Sheets, workflow, customer workspace and BYOC connection controls.
3. **Stage 3 — REACH + CONCIERGE:** content operations, publishing and customer support after approval and delivery controls are verified.
4. **Stage 4 — COMMERCE + DISTRIBUTOR:** order, inventory, payment reconciliation, supplier/distributor and fulfillment adapters after transaction controls are verified.

L2 is shared by every stage. L3 helps turn Stage 1 research into offers and grows into a fuller factory in Stage 2. L5 progressively powers Stages 1–4.

## 2. Customer-facing product catalog

Products are outcome-oriented packages built on shared MAELVYN capabilities, not separate duplicated platforms.

| Product | Primary users | Customer outcome | Core features | Primary output | Stage |
|---|---|---|---|---|---|
| **MAELVYN SIGNAL** | Business owners, brands, sellers, affiliates, product managers, venture builders | Evidence-backed market and competitor decisions | Market opportunity search; competitor and pricing research; product/offer change monitoring; trend and customer-need analysis; opportunity recommendations | Dashboard, research report, sourced dataset, alerts | 1 |
| **MAELVYN FLOW** | MSMEs, agencies, service businesses, sales teams | Organized customer and sales operations | Lead capture; pipeline; follow-up queue; reminders; email/WhatsApp operations; scheduling; interaction history | Lead pipeline, follow-up queue, customer history, sales report | 2 |
| **MAELVYN COMMERCE** | Online sellers, brands, digital stores, commerce operators | Reliable commerce operations and margin visibility | Product catalog; order tracking; inventory monitoring; payment reconciliation; fulfillment queue; sales and margin analysis | Order dashboard, transaction report, inventory alerts, fulfillment queue | 4 |
| **MAELVYN REACH** | Creators, affiliates, brands, agencies, marketing teams | Evidence-led content planning and controlled distribution | Content/trend research; competitor content intelligence; content calendar; creative brief; approval; publishing connectors; performance reporting | Content plan, asset/approval queue, publishing workflow, analytics | 3 |
| **MAELVYN DISTRIBUTOR** | Distributors, suppliers, resellers, wholesalers, brands with sales networks | Managed partner discovery and B2B order pipeline | Supplier/distributor discovery; partner CRM; product catalog and price lists; inquiry and quotation; order intake; territory and partner performance | Partner directory, inquiry pipeline, quotation workflow, distributor reports | 4 |
| **MAELVYN CONCIERGE** *(add-on)* | Businesses needing customer support and service operations | Consistent customer support with human escalation | Support inbox/ticketing; knowledge base; response templates; WhatsApp/email operations; routing; escalation; service reporting | Support queue, response library, escalation log, service report | 3 |

### Product boundaries

- SIGNAL sells research, evidence synthesis and decision support; it does not guarantee market success.
- FLOW manages customer operations; it does not send messages or make commitments without authorized approval.
- REACH manages content workflows; publishing and outbound communications require explicit approval and platform-compliant account authorization.
- CONCIERGE is an optional add-on to FLOW or REACH with a distinct support workflow.
- COMMERCE and DISTRIBUTOR share catalog, order, partner and reporting primitives; they are separate customer propositions, not duplicate transaction databases.
- DISTRIBUTOR is more than a contact directory: its value is managing inquiry, quotation, partner and order lifecycles.
- No package resells raw third-party API access. MAELVYN sells workflows, analysis, managed services and outcomes.

## 3. External provider capability catalog

Provider names are candidates or known tools in the research inventory. Their presence here does not prove active credentials, runtime integration, free access, quota or commercial permission.

| Capability | Internal contract/module | Candidate providers | Product use | Binding rule |
|---|---|---|---|---|
| Web research/search | ResearchProvider.search | Tavily, TinyFish Search, Exa, Parallel, Search1API | SIGNAL, REACH, DISTRIBUTOR | Read-only; preserve query, source URL, retrieval time, provider and usage metadata |
| Page fetch/crawl/extract | ExtractionProvider.fetch/extract | Firecrawl, TinyFish Fetch, Scrape.ly, Apify | SIGNAL, REACH, DISTRIBUTOR | Domain allowlist, URL validation, bounded pages, rate/quota guard, provenance |
| SEO/SERP/keyword | MarketSignalsProvider | DataForSEO, Semrush, Ahrefs, Similarweb | SIGNAL, REACH | Separate paid endpoint gates; disclose source and timestamp |
| Company/contact data | BusinessDataProvider | AgentData, Apollo | SIGNAL, FLOW, DISTRIBUTOR | Purpose limitation, consent, privacy and provider terms; no indiscriminate scraping |
| Social/content intelligence | SocialSignalsProvider | TokConnect, platform-approved APIs, selected research providers | SIGNAL, REACH | Public/authorized data only; no bypassing platform restrictions |
| CRM and sales apps | CrmProvider | Composio app connectors, HubSpot and other authorized CRM APIs | FLOW, CONCIERGE, DISTRIBUTOR | BYOC per workspace; least-privilege scopes; writes require approval |
| Email/calendar/sheets | BusinessAppsProvider | Composio, Gmail, Google Calendar, Google Sheets and Microsoft connectors | FLOW, SIGNAL delivery | OAuth via approved connection manager; separate read/write scopes |
| Workflow automation | WorkflowProvider | Make, n8n, Pipedream, Cloudflare Workflows/Queues | FLOW, REACH, COMMERCE | MAELVYN owns task state and approvals; external workflow is an execution adapter |
| Content creation | CreativeProvider | Adobe, Canva, Magnific, OpenArt, Runway, VideoGen, Invideo, ElevenLabs | REACH, CONCIERGE | Asset rights, provenance, versioning, human QA and cost caps |
| Publishing/social | PublishingProvider | Buffer, Socialync, Zernio and approved platform APIs | REACH | Draft → review → explicit publish approval; no unattended public posting |
| Customer support/communications | SupportProvider | Bird, Gmail, Asyntai, Intercom, Zendesk, Front (subject to validation) | FLOW, CONCIERGE | Templates, recipient validation, consent, human escalation and send approval |
| Commerce/storefront | CommerceProvider | Shopify and approved commerce connectors | COMMERCE, DISTRIBUTOR | BYOC, idempotent writes, order reconciliation; no assumed marketplace API access |
| Payment | PaymentProvider | Xendit, Midtrans, Stripe where eligible | COMMERCE | Separate adapter, signed webhooks, reconciliation; no money movement without authorization |
| Logistics/fulfillment | FulfillmentProvider | Authorized Indonesian logistics APIs and aggregator partners | COMMERCE, DISTRIBUTOR | Contract and coverage validation before activation |
| Identity/runtime/storage | Internal platform services | Clerk; Cloudflare Workers, D1, R2, Queues, Workflows | All products | MAELVYN retains canonical identity, tenant boundaries, data and audit |
| Tracing/observability | Internal execution telemetry | Langfuse | All products | Observability only; never source-of-truth evidence or approval ledger |

### Existing adapter baseline

The repository already contains adapter foundations for **Tavily, Firecrawl, Apify, Scrape.ly, Cloudflare Workers AI and mock search**. Extend these only after inspecting current contracts and tests; do not create duplicate adapters. TinyFish, DataForSEO, Just One API, Composio, Nango, Make and other candidates remain planned until implementation and account/terms review prove otherwise.

## 4. Internal system components

### Core control plane

- **Identity & Tenant Registry:** distinct identities for owner, member, customer, workspace, venture, agent, provider and external connection.
- **Policy Engine:** RBAC/ABAC, purpose limitation, data classification, tenant isolation and deny-by-default decisions.
- **Approval Engine:** request, review, approve/reject, expiry, revocation and immutable decision record.
- **Execution Gateway:** provider allowlist, account routing, permission checks, budget reservation, idempotency, redaction, timeout and audit correlation.
- **Usage & Finance Ledger:** estimated/actual provider usage, per-workspace caps, cost attribution, revenue/cost/margin separation.
- **Audit & Evidence Registry:** append-only execution events, provenance, artifact version and review history.

### Agentic OS

- Agent registry and specialist roles.
- Task contract and plan generation.
- Orchestration, queueing and durable workflow state.
- Scoped memory with access logging and retraction.
- Tool discovery through internal capability contracts.
- Evaluations, quality checks, autonomy levels and fallback policy.

### Product engines

- **Product Engine:** product definitions, packages, entitlements, pricing hypotheses, versioning and lifecycle.
- **Service Engine:** service requests, briefs, delivery milestones, QA and acceptance.
- **Commerce Engine:** catalog, offers, orders, inventory, reconciliation and fulfillment.
- **Portfolio Operations:** venture workspaces, accountable operators, budgets, rights, performance and risk.

### Integration fabric

- Provider Registry and capability contracts.
- Connection Manager and OAuth/BYOC vault references.
- Provider-specific adapters and health/quota checks.
- Internal MAELVYN MCP Gateway.
- Workflow and browser execution adapters.
- No agent receives raw provider credentials.

## 5. Canonical execution flow

1. User selects a MAELVYN product and submits an objective.
2. Product Engine resolves the package, workspace entitlement and allowed capabilities.
3. Agentic OS creates a bounded task contract and execution plan.
4. Policy Engine checks identity, tenant, purpose, provider, data class and autonomy level.
5. Budget Guard reserves the allowed cost; if a paid endpoint or cap is unavailable, execution stops or asks for approval.
6. Execution Gateway routes the request to a verified provider adapter and authorized connection.
7. Adapter returns normalized output with provider request ID, usage, timestamp and provenance.
8. Evidence/Asset Registry stores the result; quality checks classify source facts, inference and unknowns.
9. Human review gates consequential decisions, external messages, publication, financial writes and delivery.
10. Audit and usage ledgers record outcome, cost, approvals and artifacts.

Never silently switch to a paid provider, exceed a cap, reuse another customer's credentials, treat synthetic data as live evidence, or let provider output change MAELVYN policy.

## 6. Explicit provider and product lifecycle

Provider lifecycle:
- **DISCOVERED:** candidate identified; no account or implementation claim.
- **TERMS_REVIEW:** pricing, privacy, data processing, commercial/embedded use and geography under review.
- **ACCOUNT_AVAILABLE:** authorized account is known to exist; credentials may still be absent.
- **CREDENTIAL_CONFIGURED:** secret reference exists in the intended environment; never expose secret values.
- **ADAPTER_IMPLEMENTED:** internal contract and adapter code exist.
- **TESTED:** deterministic tests and sandbox/health checks pass.
- **RUNTIME_BOUND:** adapter is registered and routed by the MAELVYN gateway in the intended environment.
- **LIMITED/LIVE:** explicitly enabled with quota, capability and cost caps.
- **SUSPENDED/EXHAUSTED:** disabled due to policy, quota, billing, security or provider condition.

Product lifecycle: **HYPOTHESIS → INTERNAL_DRAFT → PILOT_READY → PILOT → VERIFIED → PUBLIC_READY → ACTIVE → PAUSED/RETIRED**. A catalog entry alone never means public-ready.

## 7. Free-first and commercial guardrails

- Prefer no-card free tiers, free endpoints and local/self-hosted options where appropriate.
- Verify endpoint-specific pricing; a free provider plan does not mean every endpoint, actor, model, connector or third-party app call is free.
- Show estimated cost, quota, account owner and last verification date before enabling a live provider.
- Default external live execution and paid execution to OFF.
- No auto-reload, top-up, paid upgrade, paid actor run, paid model call or paid workflow without explicit owner approval.
- Review commercial use, embedded SaaS, white-label and redistribution terms before exposing provider-backed features to customers.
- Customer-owned accounts are BYOC by default. MAELVYN-owned internal provider accounts must be isolated from customer accounts.
- Never sell access to raw third-party credentials or API quota.
- Maintain provider attribution, source links, timestamps, data retention rules and deletion paths.

## 8. Product rollout and acceptance gates

| Stage | Build scope | Minimum acceptance gate |
|---|---|---|
| 1 — SIGNAL | Internal intelligence, research workflow, evidence quality, productized reports | Source provenance; synthetic/live separation; quota and budget enforcement; reproducible tests; human review |
| 2 — FLOW | CRM, email, calendar, Sheets, customer workspace, BYOC | OAuth scope review; tenant isolation; draft-before-send; idempotent writes; audit and revocation |
| 3 — REACH + CONCIERGE | Content calendar, creative QA, publishing, support queue and escalation | Asset rights/provenance; explicit publishing/send approval; consent; rate limits; rollback/disable controls |
| 4 — COMMERCE + DISTRIBUTOR | Catalog, order, inventory, payment reconciliation, supplier/partner and logistics adapters | Signed webhooks; idempotency; reconciliation; inventory consistency; fraud/abuse controls; finance approval |

## 9. Initial implementation backlog

1. Audit existing provider registry, workspace provider settings, adapters, kill switches, usage ledger and provider UI. Extend, do not duplicate.
2. Define a versioned product catalog and package registry; keep product metadata separate from provider credentials and execution settings.
3. Add product-to-capability entitlement mapping and a read-only product catalog view.
4. Add provider lifecycle and commercial-terms evidence to the binding register.
5. Bind SIGNAL to the existing research pipeline first; test provider routing and evidence provenance.
6. Implement FLOW only after connection/OAuth and approval controls are validated.
7. Add REACH/CONCIERGE workflows with draft/review/approval states.
8. Add COMMERCE/DISTRIBUTOR only after payment, order, inventory and fulfillment adapters pass dedicated security tests.

## 10. Definition of done

A capability is not integrated until its adapter contract, policy gate, cost guard, tests, audit event, environment binding and documented provider terms are verified. A product is not ready until its user journey, deliverable, support boundary, unit economics, legal terms, privacy treatment and acceptance criteria are tested.

**Current decision:** this is a proposed canonical catalog and build contract. It does not activate providers, change production infrastructure, enable paid services or authorize customer-facing publication.
