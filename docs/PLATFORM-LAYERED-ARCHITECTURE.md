# MAELVYN — Platform Layered Architecture

**Version:** 1.0.0  
**Status:** Architecture baseline for implementation  
**Date:** 2026-11-20  
**Parent:** `docs/MASTER-SYSTEM.md`, `docs/ECOSYSTEM-STRUCTURE-AND-HIERARCHY.md`, `docs/COMMERCE-OS-MASTER-ARCHITECTURE.md`

## 1. Purpose

MAELVYN is a shared venture studio and agentic business platform. It must turn external capabilities, internal workflows, and validated customer problems into products and services that can be delivered, distributed, and measured commercially.

MAELVYN is not only:
- a customer-facing website;
- an admin dashboard;
- an agent orchestrator;
- an MCP directory;
- a content-production workflow;
- a marketplace listing tool.

It is the governed system connecting all of those capabilities into one operating ecosystem.

This document defines the platform's product-facing layers. The constitutional Core, identity, security, governance, finance integrity, audit, and policy remain cross-cutting foundations as defined in the parent architecture.

## 2. Architectural model

The platform has five connected product layers and one cross-cutting management/control plane.

```
CUSTOMERS / USERS / PARTNERS
          |
          v
LAYER 1 — CUSTOMER & USER EXPERIENCE
Public site, customer portal, workspace, catalog, orders, delivery, support
          |
          v
LAYER 2 — AGENTIC MACHINE / MAELVYN OS
Orchestration, agents, tasks, workflows, memory, evaluation, approvals
          |
          v
LAYER 3 — PROVIDER & INTEGRATION FABRIC
MCP, APIs, SaaS connectors, models, research, creative, automation, commerce
          |
          v
LAYER 4 — PRODUCT & COMMERCIAL FACTORIES
Research, software, automation, creative, digital products, services, systems
          |
          v
LAYER 5 — DISTRIBUTION & MARKET ACCESS
Owned channels, Indonesian marketplaces, global marketplaces, freelance,
affiliate, partner, social and direct-sales channels

CROSS-CUTTING CONTROL PLANE
Platform admin, venture management, provider governance, identity, policy,
budget, approvals, rights, finance, audit, analytics and operations
```

The diagram is a responsibility map, not a mandatory synchronous request chain. Agents may call approved providers, factories may be invoked by internal operators, and distribution adapters may send work to external channels. Every flow must still pass authorization, scope, budget, rights, and audit policy.

## 3. Layer 1 — Customer & User Experience

This is the public and customer-facing product surface. It is separate from internal administration.

### Surfaces
- Public MAELVYN website: positioning, capabilities, trust, case studies, contact and entry points.
- Product and service catalogue: discoverable offers, scope, packages, prices or quotation rules, delivery terms, rights, limitations and FAQs.
- Customer account: identity, profile, consent, communication preferences and data requests.
- Customer workspace: briefs, files, project status, approvals, conversations and deliverables.
- Commerce experience: cart or request flow, checkout/payment handoff, order status, invoices/receipts where supported, refunds and cancellations.
- Delivery and support: private deliverables, revision requests, acceptance, support tickets and service history.
- Partner/participant experience: separately permissioned onboarding, assigned work, venture participation and relevant documents.

### Rules
- Customers see only their own account, orders, briefs, deliverables and permitted workspace records.
- A customer is not automatically a venture member, platform administrator, seller, partner or owner.
- Public pages must never expose internal provider credentials, private operating notes, other customers' data, venture finance, or internal audit events.
- Do not display an offer as available until scope, rights, price/quote method, fulfillment capacity and seller responsibility are approved.
- Customer UX and internal operator UX use separate route groups, navigation, permissions and data projections even when hosted by one application.

### Acceptance criteria
A customer can discover an approved offer, understand exactly what is included, submit a brief or order, provide required inputs, track progress, review/accept delivery, request support, and access only their own records.

## 4. Layer 2 — Agentic Machine / MAELVYN OS

This is the execution and coordination engine. It converts authorized requests into bounded, observable work.

### Core capabilities
- Orchestrator and task planner.
- Agent registry, role, version, instructions, tool allowlist and data classification.
- Task contracts: objective, owner, deliverable, acceptance criteria, read/write scopes, budget ceiling, deadline, retry policy and approval gates.
- Workflow graph, dependency tracking, state transitions, durable dispatch and resumable execution.
- Tool routing and capability resolution.
- Scoped memory and knowledge retrieval.
- Artifact generation, provenance and versioning.
- Evaluation, quality assurance, verification and human review.
- Notifications, escalations, cancellation, timeout, retry and recovery.
- Usage metering, budget reservation, cost attribution and kill switches.

### Agent teams
Examples include research, market intelligence, product management, software engineering, automation, creative direction, commerce operations, growth/distribution, customer support, finance, rights/compliance and portfolio analysis.

Agents are not independent businesses or legal decision-makers. They may act only within explicit policy and delegated authority. Human approval remains mandatory for reserved matters such as material spending, contracts, legal commitments, ownership, payouts, public launch, customer-facing promises and irreversible actions.

### Execution states
`DRAFT → AUTHORIZED → QUEUED → RUNNING → REVIEW_REQUIRED → ACCEPTED / REJECTED → DELIVERED`

Failure, cancellation, timeout and blocked states must be explicit. A task marked complete is not proof that its deliverable passed QA or that a customer accepted it.

## 5. Layer 3 — Provider & Integration Fabric

This is MAELVYN's external capability layer. It connects MAELVYN to providers without making any provider the owner of MAELVYN's workflow, customer relationship, product definition or business data.

### Integration types
1. **MCP tools and servers** — discover and execute tool capabilities through documented MCP contracts.
2. **Direct APIs** — use official provider APIs when the required endpoint and terms are documented.
3. **OAuth/SaaS connectors** — connect a user's or venture's own account with explicit scopes and revocation.
4. **Browser automation** — use only for permitted workflows where no reliable API exists; record that it is browser automation, not an official API.
5. **Manual/assisted channel adapters** — prepare exportable assets, listing payloads or operator checklists where automation is unavailable or disallowed.

### Provider registry contract
Each provider and integration must have:
- provider ID, display name, category, owner and environment;
- supported capabilities and exact operation IDs;
- integration type, connection state and health;
- authentication method, required scopes and secret reference (never secret values);
- official documentation and terms URL;
- free-tier/trial allowance, paid pricing model, billing unit, quota and rate limits;
- per-call and per-task estimated cost, daily/monthly caps and approval threshold;
- commercial-use and output-rights status;
- supported countries, regions and data classes;
- latency, reliability, error classification and last verification;
- enabled/disabled/review-required state, kill switch and fallback policy;
- provider usage records linked to task, venture, customer/order when applicable.

### Capability-based routing
Agents request a capability, not a hard-coded vendor. Examples:
- `research.web_search`
- `research.page_extract`
- `research.structured_extract`
- `marketplace.product_search`
- `marketplace.listing_read`
- `model.text_generation`
- `model.image_generation`
- `model.video_generation`
- `model.audio_generation`
- `creative.design`
- `automation.workflow`
- `commerce.payment_status`
- `commerce.order_sync`
- `distribution.publish`

The router selects only providers that are configured, authorized, healthy, within quota, allowed for the task's data class, commercially permitted, and within budget.

### Provider selection policy
- Prefer a genuinely usable free tier or included allowance where quality and terms fit.
- Show the real allowance, limits, reset period, output restrictions and commercial-use conditions; never label a capped trial as unlimited free.
- Paid execution is disabled by default until a venture owner approves the cost ceiling.
- Do not silently switch to a paid provider or a provider with different data/rights terms.
- No credential is copied from a ChatGPT/Composio connection into MAELVYN automatically. The deployed MAELVYN Worker requires its own securely configured connection or secret.
- Provider connectors discovered in Composio are not considered integrated into the MAELVYN application until the server-side adapter, credentials, authorization, metering, tests and recovery path are implemented.
- Aggregator catalogs (including API marketplaces) must be labeled as aggregators. A data source named after a platform is not necessarily that platform's official API.
- Record provider terms and rights per output. A technically successful generation is not automatically commercially licensable.

## 6. Layer 4 — Product & Commercial Factories

Factories turn capabilities into repeatable, quality-controlled products and services. A factory is a reusable operating workflow, not a one-off prompt or an ungoverned agent.

### Factory families
- **Research & Intelligence Factory:** market research, competitor analysis, demand validation, data briefs, monitoring and decision reports.
- **Software & Systems Factory:** websites, landing pages, portals, dashboards, micro-apps, internal systems and subscriptions.
- **Automation Factory:** workflow automation, integrations, agent assistants, reporting and managed operations.
- **Creative Production Factory:** brand assets, design, images, video, audio, campaign packages and content systems.
- **Digital Product Factory:** templates, toolkits, SOPs, documents, datasets, learning assets and licensed resources.
- **Commerce & Service Factory:** implementation services, productized services, managed services, physical/digital bundles and fulfillment operations.

### Productization pipeline
`CAPABILITY → WORKFLOW → DELIVERABLE SPEC → QA STANDARD → OFFER → PACKAGE/TIER → SKU/VERSION → RIGHTS & TERMS → PRICE/MARGIN → APPROVAL → LISTING`

Every offer must define:
- target customer and paid problem;
- outcome, scope and exclusions;
- inputs required from the customer;
- deliverable format and acceptance criteria;
- production steps, provider dependencies and fallback;
- service level, lead time, revision and support policy;
- cost model, price, margin floor and refund/complaint policy;
- seller/operator, rights, licenses, permitted use and restrictions;
- version, status, approval and evidence of delivery capacity.

### Reuse and modularity
A provider capability can serve multiple factories. A factory can create multiple offers. An offer can have multiple packages and versions. An approved offer can be distributed through multiple channels without duplicating its product definition or losing its source-of-truth record.

## 7. Layer 5 — Distribution & Market Access

Distribution is a commercial operating layer, not just content marketing. It covers discovery, traffic, listing, conversion, transaction handoff, fulfillment coordination and performance.

### Channel families
- **Owned:** MAELVYN website, venture storefronts, landing pages, customer portal, email and approved direct sales.
- **Indonesia:** relevant official marketplace and commerce channels such as Shopee, Tokopedia, TikTok Shop and Lynk.id, subject to seller eligibility, category rules and current platform capabilities.
- **Global digital commerce:** channels such as Gumroad and Etsy when product type, seller eligibility, fees, rights and account ownership fit.
- **Freelance/project marketplaces:** channels such as Fiverr, Upwork, Sribu and Projects.co.id where the actual seller onboarding and listing workflow is supported.
- **Social discovery:** Instagram, TikTok, YouTube, Facebook, Threads and LinkedIn, with channel-specific content and attribution.
- **Partner network:** affiliates, referrals, resellers, distributors and B2B partnerships under explicit agreements.

### Channel adapter states
`DISCOVERED → ELIGIBILITY_CHECKED → CONNECTED → DRAFT_READY → APPROVED → PUBLISHED/LISTED → ACTIVE → PAUSED/RETIRED`

A discovered connector is not proof of seller-side publishing support. For each channel, MAELVYN must distinguish official API support, read-only access, buyer-side search, browser-assisted operation, manual listing and unsupported actions.

### Distribution workflow
1. Match approved offer to channel rules and audience.
2. Prepare channel-specific copy, creative, metadata, price and destination.
3. Check account ownership, eligibility, prohibited categories, rights and fees.
4. Save as draft and request approval.
5. Publish/list only after approval.
6. Capture listing URL/ID and status.
7. Attribute traffic, leads, orders, fees, refunds and conversion where data is available.
8. Reconcile external orders and fulfillment to the correct venture.
9. Pause or remove listings when offer, rights, stock, account or policy status changes.

No agent may independently publish public content, create marketplace listings, message customers, change prices or accept platform terms without the required authorization.

## 8. Cross-cutting management and control plane

The management plane is internal. It is not another customer layer and must not be exposed to customers as an admin dashboard.

### Management domains
- **Platform admin:** system configuration, platform owner controls, global policy, security, incidents and audit.
- **Customer management:** accounts, consent, support, order/customer relationship and data requests.
- **Venture management:** venture charter, operators, members, budget, risks, assets and performance.
- **Provider management:** integrations, credentials metadata, health, quotas, pricing, terms, cost caps and kill switches.
- **Agent management:** agent registry, versions, capabilities, permissions, evaluations and execution history.
- **Factory management:** workflow versions, QA standards, reusable templates, provider dependencies and production capacity.
- **Product management:** categories, families, offers, SKUs, prices, rights, packages, versions and approvals.
- **Distribution management:** channel accounts, eligibility, drafts, listings, attribution and channel performance.
- **Commerce management:** quotes, orders, payments, fulfillment, acceptance, refunds, support and reconciliation.
- **Finance and portfolio:** budgets, journals, costs, margin, settlements, liabilities and venture-level reporting.

### Role separation
Platform owner, platform operator, venture operator, factory operator, customer support, finance reviewer, provider steward, customer, partner and contributor are distinct permission roles. Access is least-privilege and scoped to the relevant platform, workspace, venture, customer or order.

The management plane must provide an audit trail for configuration changes and material actions. Secrets are never displayed after storage; credential setup uses secure provider flows or Cloudflare secret bindings.

## 9. Canonical data flow

```
Customer need / market signal
  → evidence and opportunity
  → validation decision
  → factory selection
  → task contract and budget authorization
  → capability/provider routing
  → production workflow
  → QA and rights review
  → offer/package/SKU
  → commercial approval
  → channel draft and approval
  → listing / lead / order
  → payment confirmation
  → fulfillment and customer acceptance
  → support, reconciliation and analytics
  → improve / scale / pause / retire
```

Each stage must retain links to its source evidence, accountable owner, venture, task, provider usage, artifacts, approvals, offer version and customer/order record as applicable.

## 10. Implementation order and release gates

The five layers describe the finished platform. Implementation order follows dependencies and risk rather than forcing the team to build every customer screen before the engine exists.

### Phase 0 — Reconcile and secure the existing foundation
- Reconcile migrations, current code, production bindings and the deployment runbook.
- Keep Development and Production isolated.
- Securely configure Production Clerk secret through Cloudflare; never request it in chat.
- Verify authentication, owner bootstrap, authorization, R2 private access, backup and rollback.
- Do not claim Production Ready until end-to-end gates pass.

### Phase 1 — Complete the provider fabric and control plane
- Expand the provider registry from a small hard-coded adapter list into capability, pricing, rights, quota, connection and health records.
- Define a server-side integration gateway for MCP/API/OAuth/browser/manual adapters.
- Implement approval, idempotency, budget reservation, provider health, audit and safe failure behavior.
- Inventory provider plans and free allowances before enabling execution.

### Phase 2 — Complete the agentic machine
- Add durable task dispatch, workflow dependencies, cancellation, approval waits, evaluation and artifact lineage.
- Keep the existing Research Brief Agent as the first verified vertical slice; do not rebuild it.
- Add one reusable Research Factory workflow and prove it from request to accepted deliverable.

### Phase 3 — Product and commercial factory
- Implement factory templates, offer/SKU registry, package versions, rights, QA, pricing and margin rules.
- Turn one validated factory output into one approved sellable offer.

### Phase 4 — Customer experience
- Separate public marketing, customer portal, venture participant workspace and internal management routes.
- Implement catalogue, brief/order intake, status, private delivery, acceptance and support for the first offer.

### Phase 5 — Distribution and marketplace adapters
- Implement owned-channel listing and attribution first.
- Add each external channel only after account ownership, seller eligibility, terms, API support, fees, rights and fulfillment are verified.
- Use draft-first, approval-gated publishing and listing.

### Phase 6 — Expand factories and portfolio
- Add additional factory families and offers based on paid demand and delivery evidence.
- Expand channels and ventures only when unit economics and operating capacity justify it.

## 11. First end-to-end commercial vertical slice

The first implementation target is one complete, measurable service flow rather than a large set of empty modules:

1. Customer discovers an approved research or implementation offer.
2. Customer submits a scoped brief.
3. MAELVYN creates a customer/order record and task contract.
4. Orchestrator assigns a bounded Research or Software Factory workflow.
5. Provider router selects an eligible free/included provider or an explicitly approved paid provider.
6. Factory creates an evidence-backed deliverable.
7. QA and rights checks run; a human accepts the output.
8. Customer receives a private delivery link and accepts or requests revision.
9. Commerce records payment/fulfillment state and venture-level costs.
10. Distribution and portfolio analytics record source, conversion, delivery quality, margin and support outcome.

The initial offer is a validation candidate, not a public listing, until its scope, seller, rights, price, costs and fulfillment are approved.

## 12. Non-negotiable completion rules

- A UI page is not a completed business capability.
- A provider listed in a catalog is not a connected provider.
- A connected provider is not automatically authorized for every task.
- An MCP tool available in ChatGPT is not automatically available to the deployed MAELVYN Worker.
- A generated asset is not automatically commercially licensed.
- A prepared listing is not a published listing; a listing is not an order; an order is not collected cash.
- No paid provider call, public publish, customer message, listing, payment, payout or production deployment without the appropriate approval.
- Every execution must have a task owner, venture/customer scope, capability allowlist, budget ceiling, idempotency key, audit record and recovery behavior.
- Cross-venture and cross-customer data access is denied by default.
- Status must use the repository's implementation vocabulary: implemented-verified, implemented-partial, foundation-only, designed-only, blocked or not-authorized.
