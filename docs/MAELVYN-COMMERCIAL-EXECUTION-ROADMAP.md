# MAELVYN — Commercial Execution Roadmap

**Status:** Build sequence and acceptance criteria  
**Principle:** Do not confuse an architecture milestone with a business milestone.

## 1. Current baseline found in the repository

The branch `architecture/layered-platform` already contains meaningful foundations:
- workspace and venture separation, identity, memberships, permissions, and audit;
- governance approvals, budgets, finance journals, contributions, ownership and rights records;
- agent/provider registries, L1–L4 autonomy metadata, kill switches, task executions, usage accounting, evidence, and research artifacts;
- venture milestones, work items, assets, experiments, reviews, risks;
- internal customers, offers, orders, and recorded unit-economics calculations;
- private R2 artifact metadata and single-use delivery tokens.

Important limitations:
- the current `tasks.task_type` schema only allows `research_brief`; do not widen or repurpose it casually;
- customers/offers/orders are currently internal venture operations records, not a full external customer portal or public storefront;
- no generic factory registry/execution lifecycle has been confirmed in the current migrations;
- no verified customer-facing checkout, payment settlement, refund, marketplace seller-write, or distribution listing workflow has been confirmed;
- current landing page describes a development foundation and internal workspace; it is not a finished public commercial storefront.

These are code-audit observations, not production verification. The branch has not been merged or deployed as part of this roadmap.

## 2. Commercial vertical slice — order to accepted delivery

Build one complete path before building a large collection of modules:

1. **Public offer:** a human-approved, versioned offer with scope, exclusions, price, currency, turnaround, revision limit, rights, and refund terms.
2. **Customer intake:** external customer identity/contact and structured brief; isolated from internal workspace membership.
3. **Order record:** immutable offer/version and price snapshot, legal seller, payment reference/status, consent and terms version.
4. **OS command:** order acceptance emits an idempotent command/event. It never invokes a Factory or provider directly.
5. **Policy gate:** validate customer scope, order state, venture, budget, rights, provider allowlist, data class, and required approvals.
6. **Factory task contract:** assign a registered Factory capability, inputs, output specification, QA rubric, budget, deadline, and accountable human owner.
7. **Provider execution:** only via approved provider adapters; no browser-to-provider or Factory-to-provider bypass.
8. **QA and approval:** check output completeness, quality, rights, safety, and delivery requirements. Rejected outputs return to a bounded revision loop.
9. **Private delivery:** approved artifact is stored privately and delivered only to the authorized customer through a short-lived, scoped token.
10. **Acceptance and close:** record customer acceptance, delivery time, revision count, refunds/disputes, direct cost, provider cost, and final contribution margin.
11. **Learning:** update offer scope, production templates, and pricing only from recorded evidence.

## 3. Implementation order

### Phase A — Foundation hardening
- Verify branch head, migration inventory, environment bindings, auth configuration, and existing tests.
- Keep development and production data isolated.
- Preserve existing Research Brief Agent behavior.
- Add schema and route tests before enabling any new runtime.

**Acceptance:** existing test suite and typecheck pass; production is unchanged.

### Phase B — Generic Factory registry and run contracts
- Add Factory capability registry and versioned definitions.
- Add run records, input/output contracts, QA results, approvals, and append-only run events.
- A run must reference workspace, venture, owner, policy decision, and optionally a source order.
- A Factory run is created by an authenticated OS service path, never by a public customer request.
- Preserve existing `tasks` constraint; generic Factory work must not masquerade as `research_brief`.

**Acceptance:** a test can create a draft Factory capability, issue an authorized run contract, reject a wrong-venture reference, enforce idempotency, and record a QA decision without calling a paid provider.

### Phase C — Customer Experience and offer publication
- Create a separate customer identity/account boundary.
- Publish only approved offer versions.
- Add customer-safe order status projections and support intake.
- Never expose internal task/provider state or internal margin.

**Acceptance:** two customer identities cannot read each other's orders or files; an internal workspace member is not implicitly a customer.

### Phase D — Commerce and finance
- Extend the existing internal offer/order records only where needed.
- Add explicit legal seller, SKU/offer version, payment reference, settlement, refund, and reconciliation states.
- Separate gross order value, cash collected, tax, fees, refunds, direct costs, and contribution margin.
- Keep payment execution disabled until a payment provider and seller identity are verified.

**Acceptance:** duplicate payment webhooks are idempotent; refunds and reversals reconcile; order totals are not treated as cash revenue before settlement.

### Phase E — Distribution
- Register channels and capabilities with evidence-backed state: `research_only`, `assisted_manual`, `draft_integration`, `write_enabled`, `live`.
- Keep listing creation and social publishing in draft/manual mode until official write access, rights, and human approval are confirmed.
- Record listing URL, offer version, seller identity, channel fee, attribution, and order source.

**Acceptance:** no public post/listing occurs from a research-only or draft-only integration.

### Phase F — Control Plane and portfolio operations
- Portfolio health and stage-gate decisions.
- Customer support and complaint handling.
- Provider price/rights/health/usage and agent performance.
- Venture P&L, cash position, cost allocation, and consolidated Studio view.
- Incident management, audit export, and recovery.

**Acceptance:** Studio view can distinguish each venture's legal seller, cash, revenue, cost, and liabilities without cross-venture leakage.

## 4. First commercial offer selection

Do not pre-select a product just because a tool is available. Score candidate offers against:
- buyer urgency and budget;
- access to 15–30 real interviewees;
- measurable before/after outcome;
- ability to deliver within a short pilot;
- gross margin after human labor and provider costs;
- low regulatory and IP risk;
- repeatability and distribution access;
- no dependency on an unverified seller-side API.

Choose one offer with a named customer segment and a real pilot request. Keep the other candidates in discovery.

## 5. Weekly operating cadence

- **Daily:** orders, customer blockers, delivery queue, cash exceptions, provider/agent failures.
- **Weekly:** pipeline, paid conversion, fulfillment quality, margin, experiment outcomes, budget usage, incident review.
- **Monthly:** venture stage gate, P&L, cash runway, rights and contract review, agent autonomy review, provider terms/pricing review.
- **Quarterly:** portfolio allocation, spinout/hold/exit decisions, legal entity and tax review.

## 6. Definition of done for the first business

The first commercial venture is not done when its website or dashboard is deployed. It is done when:
- a real buyer accepts a clearly scoped offer;
- payment is received by the correct legal seller;
- the order triggers a controlled OS workflow;
- the Factory delivers a QA-approved artifact/service;
- the customer receives and accepts it;
- costs and margin reconcile to source records;
- support/refund/complaint handling is operational;
- the result is repeatable or there is a documented reason to stop.
