# MAELVYN Internal System & External Product Catalog

**Status:** Architecture and product baseline — proposed, not production-enabled  
**Principle:** Build the control. Buy the capabilities. Connect the ecosystem. Monetize the outcomes.

This is the canonical bridge between MAELVYN's internal operating system, external provider capabilities, and customer-facing products. A listing does not prove that an account is connected, an API is enabled, a quota is available, or commercial use is licensed.

## 1. Three dimensions that must stay separate

MAELVYN has **five internal capability layers**, **seven roadmap products**, and **five customer productization stages**. They are related but not interchangeable. The five-stage roadmap in this section supersedes the earlier four-stage draft.

### Five internal capability layers

| Layer | Internal responsibility | Internal modules | External capability families |
|---|---|---|---|
| L1 — Intelligence & Evidence | Find, collect, normalize, assess and preserve market evidence | Signal Engine; Research Orchestrator; Search/Fetch adapters; Extraction Pipeline; Source & Evidence Registry; Entity Resolver; Market, Competitor and Trend Analyzer | Search/research, crawling, extraction, SEO/SERP, company data, social intelligence |
| L2 — Execution & Control | Own identity, policy, permissions, approval, budget, execution and audit | MAELVYN Core; Identity/Tenant Registry; RBAC/ABAC; Policy & Approval Engine; Execution Gateway; Budget Guard; Usage Ledger; Task State; Audit & Evidence Ledger | Cloud runtime, identity, observability, queue/workflow primitives |
| L3 — Design & Product Factory | Turn evidence into validated, defined and buildable products | Opportunity-to-Offer; Product Definition Registry; Product Strategy; Brand Registry; Design Workflow; Website/Prototype Factory; Product Knowledge Base | Product strategy, UX/design, brand systems, website builders, code/prototype tools |
| L4 — Creative & Content Factory | Produce, review, version and deliver creative assets and campaigns | Creative Brief Engine; Storyboard/Prompt Pipeline; Image/Video/Audio Workflows; Editing & QA; Asset Registry; Content Calendar; Publishing Approval | Image/video/audio generation, editing, design, social publishing |
| L5 — Integration & Automation | Connect external accounts and automate bounded business workflows | Provider Registry; Connection Manager; OAuth/BYOC; Provider Adapters; MAELVYN MCP Gateway; Workflow Orchestrator; Browser/Communication/Commerce Adapters | App connectors, OAuth, workflow automation, browser automation, CRM, communications, commerce APIs |

**Foundational boundary:** MAELVYN Core and Owner Control are internal ownership/governance foundations, not external providers and not a sixth layer. Agentic OS orchestrates work across layers but is not the source-of-truth database. All external calls pass through the MAELVYN Execution Gateway; agents never call provider APIs directly.

### Five-stage customer productization roadmap

1. **Stage 1 — Intelligence Products (SIGNAL + LEADINTEL):** market, competitor, category, trend, pricing and opportunity intelligence; sourced company/prospect/partner research and evidence-backed qualification. LEADINTEL does not infer private personal data or conduct outreach.
2. **Stage 2 — Workflow Products (FLOW):** customer account connections, CRM, email/messaging workflows, pipeline, follow-ups, reminders, scheduling, customer history and reporting. Explicit authorization and customer-owned BYOC are required.
3. **Stage 3 — Content & Commerce (REACH + COMMERCE):** content research, strategy, briefs, approval, publishing queue and performance; catalog, orders, inventory, payment reconciliation and fulfillment. Media, store, payment and publishing permissions must be verified first.
4. **Stage 4 — Agentic Workforce:** agent runtime, orchestration, scoped tool execution, compute, evaluation and human oversight. Agent Relay, Agent Swarm, Manus or other runtimes remain candidates until permissions and compute are verified.
5. **Stage 5 — Product Marketplace:** customers select MAELVYN outcomes, packages, capacity and workflows. Sell MAELVYN outcomes, never raw third-party API access.

L2 is shared by every stage. L1 supports Intelligence Products; L3 turns evidence into product definitions; L4 supports approved content workflows; L5 powers authorized integrations and automation. MAELVYN Core and Owner Control remain foundational, not additional roadmap stages.

## 2. Customer-facing product catalog

Products are outcome-oriented packages built on shared MAELVYN capabilities, not separate duplicated platforms.

| Product | Primary users | Customer outcome | Core features | Primary output | Stage |
|---|---|---|---|---|---|
| **MAELVYN SIGNAL** | Business owners, brands, sellers, product managers, venture builders | Evidence-backed market and competitor decisions | Market/category opportunity; competitor and pricing research; trend and demand signals; source ledger | Market brief, competitor map, sourced evidence | 1 |
| **MAELVYN LEADINTEL** | Business development, venture and partnership teams | Sourced, evidence-backed company/partner qualification and segmentation | Public/authorized business research; qualification rubric; provenance; explicit unknowns | Company research cards, qualification matrix, sourced business shortlist | 1 |
| **MAELVYN FLOW** | MSMEs, service businesses, sales teams | Organized customer and sales operations | CRM; customer history; pipeline; reminders; email/messaging drafts; scheduling and reporting | Lead pipeline, follow-up queue, customer history, report | 2 |
| **MAELVYN REACH** | Creators, affiliates, brands, marketing teams | Evidence-led content planning and controlled distribution | Content research; strategy; briefs; review; publishing queue; performance reporting | Content plan, creative brief, approved publishing queue, analytics | 3 |
| **MAELVYN COMMERCE** | Online sellers, brands, commerce operators | Controlled commerce operations and margin visibility | Catalog; orders; inventory; payment reconciliation; fulfillment | Order dashboard, inventory alerts, reconciliation report, fulfillment view | 3 |
| **Agentic Workforce** | Venture operators and MAELVYN workspaces | Supervised agent runs with bounded permissions and evaluated outcomes | Agent registry; scoped memory; task contracts; gateway allowlists; evaluations; kill switch | Plan/run record, evaluation summary, audit evidence | 4 |
| **Product Marketplace** | Customers selecting a defined business outcome | Choose MAELVYN solutions, packages, capacity and workflows | Outcome catalog; transparent scope and entitlements; milestone-based delivery | Package scope, capacity, milestones and acceptance record | 5 |

CONCIERGE and DISTRIBUTOR remain supplementary product concepts from earlier discovery; they are not additional stages or replacements for this seven-product roadmap.

### Product boundaries

- SIGNAL sells research, evidence synthesis and decision support; it does not guarantee market success.
- LEADINTEL is limited to sourced public/authorized business research; no private-data inference, sensitive personal profiling, or outreach.
- FLOW manages customer operations; it does not send messages or make commitments without authorized approval.
- REACH manages content workflows; publishing and outbound communications require explicit approval and platform-compliant account authorization.
- COMMERCE is not available until store/payment permissions and transaction controls are verified; this catalog does not process payments or move money.
- Agentic Workforce does not make the Agentic OS the source-of-truth database or allow agents to call providers directly.
- Product Marketplace sells MAELVYN outcomes, not raw third-party API access, credentials, or quota.
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
| 1 — Intelligence Products (SIGNAL + LEADINTEL) | Read-only research, evidence quality, sourced business qualification and productized briefs | Source provenance; public/authorized data; no private-data inference or outreach; synthetic/live separation; quota/budget enforcement; human review |
| 2 — Workflow Products (FLOW) | CRM, customer history, follow-up, scheduling, messaging drafts and BYOC | OAuth/account owner and scope review; tenant isolation; draft-before-send; idempotent writes; audit and revocation |
| 3 — Content & Commerce (REACH + COMMERCE) | Content calendar and approved publishing; catalog, orders, inventory, reconciliation and fulfillment | Asset rights/provenance; explicit publish/send/finance approval; consent; verified store/payment scopes; idempotency and reconciliation |
| 4 — Agentic Workforce | Scoped agents, orchestration, compute, memory, task contracts and evaluation | Runtime and compute eligibility; gateway allowlist; least privilege; human oversight; audit and kill switch |
| 5 — Product Marketplace | Outcome packages, capacity, workflow selection and delivery acceptance | Product verification, support boundary, economics/terms review; no raw third-party API resale; no checkout until separately approved |

## 9. Initial implementation backlog

1. Audit existing provider registry, workspace provider settings, adapters, kill switches, usage ledger and provider UI. Extend, do not duplicate.
2. Define a versioned product catalog and package registry; keep product metadata separate from provider credentials and execution settings.
3. Add product-to-capability entitlement mapping and a read-only product catalog view.
4. Add provider lifecycle and commercial-terms evidence to the binding register.
5. Bind SIGNAL to the existing research pipeline and scope LEADINTEL to public/authorized sourced business data; test provenance and limits.
6. Implement FLOW only after connection/OAuth and approval controls are validated.
7. Add REACH only after media rights, account permissions, and publishing approval controls pass.
8. Add COMMERCE only after payment, order, inventory, reconciliation, and fulfillment adapters pass dedicated security tests.
9. Build Agentic Workforce only after runtime, permissions, compute, evaluation, and human-oversight gates pass.
10. Open Product Marketplace only for verified and supportable MAELVYN outcomes; never bundle raw provider access.

## 10. Definition of done

A capability is not integrated until its adapter contract, policy gate, cost guard, tests, audit event, environment binding and documented provider terms are verified. A product is not ready until its user journey, deliverable, support boundary, unit economics, legal terms, privacy treatment and acceptance criteria are tested.

**Current decision:** this is a proposed canonical catalog and build contract. It does not activate providers, change production infrastructure, enable paid services or authorize customer-facing publication.
