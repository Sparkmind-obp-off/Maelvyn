# MAELVYN — Ecosystem Execution & Productization Blueprint

Version: 1.0.0  
Status: Implementation authority; provider/account status is an audit snapshot, not a permanent guarantee.  
Audit date: 2026-11-20

## 1. Mission

MAELVYN is an Agentic Shared Venture Studio OS that discovers opportunities, validates demand, builds productive assets and ventures, productizes capabilities, sells and fulfills offers, and manages the resulting portfolio.

It is not only a social-media scheduler, creative studio, generic agent swarm, or marketplace that automatically owns every listing. It is a governed system for turning validated customer problems into independently accountable products, services, systems, and ventures.

North Star: turn validated opportunities into responsibly operated ventures and productive assets.

## 2. End-to-end lifecycle

Signal → Evidence → Opportunity → Validation → Solution Design → Build → QA → Productization → Approval → Listing → Order → Fulfillment → Support → Measurement → Improve / Scale / Hold / Retire.

Research is not validation; a generated asset is not a finished product; a listing is not a sale; gross sales are not profit. No agent or provider can skip a required gate.

## 3. Layered architecture

### Layer 0 — Infrastructure & Environment
- Cloudflare Pages/Workers + Hono for application and API runtime.
- D1 as canonical structured source of truth.
- Private R2 for controlled artifacts and customer deliverables.
- Queues for independent async jobs; Workflows for durable checkpointed processes and human waits where justified.
- GitHub as source control and release evidence.
- Separate Development and Production resources, secrets, identities, data and release checks.

Invariant: browsers never access D1 or private R2 directly. Provider credentials stay server-side. Production release requires identity, migration, storage, backup/restore, authorization and E2E checks.

### Layer 1 — Core, Governance & Identity
People, identities, workspaces, venture membership, role grants, participation, rights, agreements, ownership, contributions, approvals, reserved matters, audit, privacy, security and kill switches. Venture isolation and explicit consent are mandatory.

Agents cannot approve ownership, debt, guarantees, payment transfers, legal commitments, IP transfers, profit distributions or other reserved matters.

### Layer 2 — Intelligence & Evidence
Web, market, customer, demand, competitor, alternative, pricing, channel and provider research; source capture; provenance; timestamps; trust classification; confidence; evidence gaps; opportunity scoring; validation experiments; portfolio learning.

Research outputs preserve source URLs and distinguish facts, interpretations, hypotheses and unknowns.

### Layer 3 — Agentic OS & Orchestration
Chief Orchestrator; task decomposition; specialist agents; versioned definitions; tool allowlists; data scopes; autonomy levels; task contracts; dependency graphs; budgets; deadlines; idempotency; checkpoints; retries; cancellation; escalation; scoped memory; evaluations; output verification and audit correlation.

Autonomy levels remain L1 Assist, L2 Prepare, L3 Bounded Execute and L4 Governed Autonomy. L4 is workflow-specific and revocable, never blanket permission.

### Layer 4 — Capability & Integration Fabric
Register capabilities independently of providers. Initial capability families:
- research.search, research.extract, research.crawl, research.actor
- reasoning.plan, reasoning.classify, reasoning.review
- software.specify, software.build, software.test, software.deploy
- creative.image, creative.video, creative.audio, creative.design, creative.edit
- automation.trigger, automation.orchestrate, automation.monitor
- commerce.catalog, commerce.order, commerce.fulfill, commerce.support
- growth.publish, growth.schedule, growth.analytics
- marketplace.list, marketplace.distribute, marketplace.hire

Existing provider adapters (Tavily, Firecrawl, Apify, Scrape.ly, Workers AI and mock search) are an initial research/runtime base, not the entire capability fabric. New adapters must implement policy, cost, health, audit, retry and data-handling contracts.

### Layer 5 — Product & Venture Factories
Factories turn validated problems into repeatable deliverables.

| Factory | Potential outputs |
|---|---|
| Research & Intelligence | Market reports, competitor maps, demand studies, prospect research, monitoring briefs |
| Software & Systems | Websites, landing pages, internal systems, web apps, micro-SaaS, APIs, integrations |
| Automation | Make scenarios, Cloudflare Workflows, CRM automations, data pipelines, notifications, monitoring |
| Digital Assets | Templates, SOPs, playbooks, spreadsheets, design packs, datasets, licensed assets |
| Creative Production | Brand assets, product visuals, social content, ads, motion graphics, video packages |
| Commerce & Service | Store setup, catalog operations, service delivery, onboarding, support, managed operations |

Factories are extensible, not a fixed catalogue. Add a factory or product family only when evidence, rights, delivery capacity and unit economics support it.

### Layer 6 — Productization & Offer Registry
Every validated output becomes a sellable offer with customer segment, job-to-be-done, outcome, product family/type, stable product ID, versioned SKU/offer, exact scope, exclusions, inputs, deliverables, acceptance criteria, seller/contracting party, operator, IP ownership/license, third-party rights, price, currency, direct costs, provider usage, margin assumptions, capacity, delivery method, SLA, support, refund/cancellation terms, data terms, allowed channels, listing status and approval record.

Product types may include productized services, implementation projects, managed services, audits/research, digital downloads, templates, software subscriptions, usage-based services, licensing, physical products, affiliate offers and bundles.

Publish gate: seller identity, rights, scope, price, cost model, fulfillment owner, customer terms, support path and approval must be present. No fabricated claims or implied provider ownership.

### Layer 7 — Commerce, Orders & Fulfillment
Product catalogue, offer versions, storefronts, checkout, immutable order snapshots, payment status adapters, reconciliation evidence, authorized digital delivery, service intake, task assignment, milestones, delivery review, acceptance, support, refunds, disputes and venture-level revenue/cost/margin reporting.

MAELVYN records commerce events; it does not become a pooled wallet or move third-party money without explicit legal, provider and governance approval.

### Layer 8 — Growth, Distribution & Marketplaces
Owned venture storefronts, central MAELVYN discovery marketplace, social content, publishing, campaigns, SEO, email, partner distribution, external marketplaces and freelance/project platforms. Verify seller-side capability; search/display access does not imply listing/publishing access.

### Layer 9 — Operations, Finance & Portfolio Intelligence
Venture workspaces, tasks, SLAs, service quality, incidents, provider health, usage, spend caps, per-venture finance, immutable journals, reconciliation, unit economics, offer performance, customer outcomes, retention, support and portfolio roll-up with venture-level access controls.

## 4. Productization procedure

1. Discover signals from public sources and authorized data.
2. Qualify the buyer, pain, alternative, urgency and evidence quality.
3. Validate demand and willingness to pay with low-cost experiments.
4. Specify the solution, acceptance criteria, rights and cost envelope.
5. Build through the appropriate factory under a scoped task contract.
6. Verify technical, factual, creative, security, rights and customer-experience quality.
7. Package SKU, scope, versions, price, delivery, support and terms.
8. Obtain human approval for publication and reserved decisions.
9. Distribute through an authorized owned or external channel.
10. Fulfill the order and record completion evidence.
11. Measure conversion, quality, actual cost, margin, refunds and feedback.
12. Improve, expand, pause or retire based on evidence.

## 5. Agent teams

| Agent role | Responsibility | Default autonomy |
|---|---|---|
| Chief Orchestrator | Decompose, delegate, track dependencies, consolidate | L2 |
| Opportunity Researcher | Search, source and organize evidence | L2 |
| Market Analyst | Compare segments, competitors, pricing and alternatives | L2 |
| Validation Planner | Design customer tests and summarize results | L2 |
| Venture Architect | Draft charter, model, risks and operating plan | L2 |
| Product Manager | Convert validated needs into requirements and offers | L2 |
| Software Builder | Build/test code within repository permissions | L2; deploy gated |
| Automation Engineer | Design, test and monitor automations | L2; activation gated |
| Creative Director / Producer | Brief, generate, edit and QA assets | L2 |
| Commerce Operator | Prepare catalog, order and fulfillment records | L2 |
| Growth Operator | Prepare campaigns and schedule approved content | L2; public publish gated |
| Finance Analyst | Classify/reconcile records and prepare reports | L2 |
| Governance Reviewer | Check authority, rights, policy and approvals | L1/L2 |
| Provider Steward | Health, quota, cost, terms and routing | L2 |

Agent roles are software responsibilities, not assumed employees, partners or legal representatives.

## 6. Provider and connector routing — audit snapshot 2026-11-20

| Work | Capability/provider | Verified limitation / rule |
|---|---|---|
| Web research | Tavily | MCP supports search, extract, crawl, map and research. MAELVYN Worker adapter currently implements basic search; expand only through tested adapters. |
| Page extraction | Firecrawl | Connected team reported 918/1,000 credits remaining. This does not prove a Worker secret is installed. |
| Social/e-commerce extraction | Apify | Store discovery works; actors are pay-per-event. Inspect first; no paid actor run without approved per-task cap. |
| Alternative extraction | Scrape.ly | Store discovery works; paid per-result actors. Inspect success rate, plan price and rights before use. |
| Native research | Wireflow/Freflow | Research workflows and social tools exist; account credits were previously reported as zero. Drafting does not imply execution capacity. |
| External app integration | Composio / Composio.devb | Discover and execute authorized app-specific tools. Integration layer, not canonical database or policy engine. |
| General automation | Make | Connected organization and teams exist. One MAELVYN Lynk.id payment webhook scenario exists but is inactive and contains only a webhook trigger. Do not activate before payload, signature verification, idempotency, mapping, downstream actions and tests are complete. |
| Creative images | Magnific / Orshot / Runway | Magnific previously showed 20 free image uses. Orshot workspace was Gubah, not verified as a MAELVYN-owned workspace. Runway was pinned to Gubah, had image models but no available video models. Keep account and brand data isolated. |
| Video editing | CapCut via Cotlet | Browser-driven workflow is available; do not represent it as a full official API. Human review before final export/publish. |
| Social distribution | Buffer | Instagram and Threads channels for @maelvynhq were connected; connected organization had 3-channel and 10-scheduled-post limits. Verify workspace/account ownership before expanding or publishing. |
| Digital product checkout | Gumroad | Connected seller identity was sparkgen8 with no products. Not yet a verified MAELVYN seller account; do not create/publish MAELVYN offers until seller and account are confirmed. |
| Etsy | Etsy connector | Current connector supports buyer-side listing search and comparison, not seller-side publishing/management. |
| Fiverr | Fiverr connector | Current connector supports freelancer discovery, reviews and hiring, not seller gig creation/management. |
| Indonesian freelance channels | Sribu, Projects.co.id | Relevant channels for services/products; no direct seller-management connector was verified. Use manual channel operations or a verified official integration; do not invent APIs. |
| Cloudflare | Cloudflare MCP / Wrangler / GitHub | Available Cloudflare MCP is an OpenAPI-spec search surface, not a verified authenticated resource-management connection. MAELVYN resources are represented in repo config; deploy through the established release runbook. |
| Genspark AI Slides | Presentation generation | Use for pitch decks, proposals and training assets; not a website/app deployment engine. |

Provider state is workspace-specific. A connected ChatGPT MCP does not prove the same credential is configured as a server-side MAELVYN Worker secret. Track connector access, provider credentials, workspace ownership, quota and production authorization separately.

## 7. Implementation sequence and exit gates

### Phase A — Reconcile the foundation
- Preserve existing governance, finance, rights, audit and venture boundaries.
- Reconcile code, migrations, production resources and release runbooks.
- Resolve the Production Clerk secret only through the secure Cloudflare secret flow; never paste it into chat or commit it.
- Verify backups, restore, R2 upload/download, owner bootstrap, E2E and /ready.
- Keep public signup, payment execution, marketplace vendor onboarding and autonomous publishing disabled.

Exit: Production identity/security gates pass; Development and Production remain isolated.

### Phase B — Complete the agentic control plane
- Audit existing agent/provider registries, workspace settings and research task implementation.
- Add versioned capability contracts without duplicating existing tables.
- Implement task history, cancellation, durable dispatch, idempotency, cost reservation, approval waits and evaluation records.
- Expand from the existing Research Brief Agent only after tests pass.
- Add read-only adapters first; paid actor execution stays disabled by default.

Exit: one authenticated research task runs end-to-end in Development with evidence, citations, usage, audit and human review.

### Phase C — Build the productization engine
- Add opportunity → validation → product brief → product/offer/SKU lifecycle.
- Add reusable factory templates for research, software, automation, digital assets and creative production.
- Add rights, cost, pricing, capacity, fulfillment and support gates.
- Link every output to its task, venture, product version and rights record.

Exit: one validated offer can be prepared, reviewed, priced and approved without bypassing governance.

### Phase D — Build commerce and fulfillment
- Build one owned storefront and one low-risk digital/service order path.
- Implement immutable order snapshots, test-mode payment status, private digital delivery and manual service fulfillment.
- Add customer support, refunds, reconciliation and venture-level unit economics.
- Do not build a full public multi-vendor marketplace yet.

Exit: a controlled test order is fulfilled, reconciled and audited from order to acceptance.

### Phase E — Build distribution and marketplace adapters
- Add Buffer scheduling and analytics with draft-first approval.
- Add channel adapters only after account ownership, API scope, terms and rate limits are verified.
- Treat Gumroad as a candidate only after seller identity confirmation; Etsy and Fiverr connectors are currently buyer-side only.
- Add Sribu and Projects.co.id operating procedures and verified integrations if available.
- Track channel fees, commissions, customer ownership and delivery obligations.

Exit: one approved offer is listed on an authorized channel and its order/lead is traceable in MAELVYN.

### Phase F — Scale factories and portfolio
- Add specialist agents, product families, ventures and channels based on demand evidence.
- Introduce scheduled L4 workflows only for individually approved, reversible tasks with caps, logs, monitoring and kill switches.
- Compare actual outcomes, costs, margins and delivery quality before scaling.

Exit: each active venture has independent rights, budget, operator, offer catalog, fulfillment and performance reporting.

## 8. First commercial validation portfolio

Do not launch every category simultaneously. Start with no more than 1–2 revenue experiments after evidence and capacity review. Candidate offers to test—not approved listings:
1. Research and competitor intelligence brief.
2. Website / landing page implementation.
3. Business workflow automation setup.
4. Productized creative asset or short-form video package.
5. Digital template / SOP / workflow kit.

Choose by verified demand, low delivery risk, available capability, rights clarity, time-to-cash and contribution margin—not by provider demo quality.

## 9. Non-negotiable release rules

- No paid scraping, model generation, marketplace listing, public post, production deployment, customer communication or payment-side effect without the applicable explicit approval.
- No raw provider secrets in GitHub, D1, logs, prompts or browser code.
- No cross-venture data access by default.
- No external asset is resold without rights and commercial-use verification.
- No public listing before seller, scope, price, terms, fulfillment and support are confirmed.
- No “production ready” claim without end-to-end evidence and a current release record.
- Every write action has an owner, authorization, idempotency, audit trail and recovery path.
