# MAELVYN Commerce OS — Master Architecture

**Version:** 1.0.0  
**Status:** Approved target architecture; implementation staged  
**Parent authority:** `docs/MASTER-SYSTEM.md`  
**Model:** Hybrid Commerce Ecosystem  
**Scope:** All Commerce

## 1. Purpose

MAELVYN Commerce OS provides shared commerce infrastructure for independently scoped ventures. It supports product discovery, catalogues, storefronts, orders, payment orchestration, fulfillment, customer operations, partner distribution, financial reporting, and bounded agentic assistance.

It is not a pooled wallet, legal marketplace operator, payment institution, or automatic owner of every listed product. Legal seller, merchant of record, product owner, IP owner, data controller/processor roles, and fulfillment responsibility must be identified for each offer and transaction.

## 2. Locked operating model

MAELVYN uses a hybrid model with three channel surfaces:

1. **Central Marketplace** — cross-venture discovery, taxonomy, search, editorial collections, and referrals to the responsible seller/checkout.
2. **Independent Venture Storefronts** — venture-controlled brand, offer, pricing, terms, customer journey, and service operations.
3. **Partner & Distribution Network** — affiliates, referrals, resellers, distributors, B2B channels, and approved external marketplaces.

The central marketplace is a distribution surface. Listing a product does not transfer ownership, customer data rights, revenue, liability, or fulfillment responsibility to MAELVYN.

## 3. Commerce scope

- Digital downloads, templates, media, and other digital assets.
- Software, SaaS, websites, apps, and platforms.
- AI-enabled products and automation solutions.
- Professional, creative, technical, and operational services.
- Physical products, own brands, inventory, and supply.
- Subscriptions, memberships, and recurring services.
- IP licensing, white-label, and commercial usage rights.
- B2B packages, enterprise solutions, and institutional contracts.
- Affiliate, reseller, referral, and distribution commerce.

Regulated or restricted products and services require separate legal, provider, and policy review before listing.

## 4. System hierarchy

```text
MAELVYN — Shared Economic Core
├── Commerce Control Plane
│   ├── Venture, seller, ownership and rights registry
│   ├── Product, offer, store and channel registry
│   ├── Policy, approval and audit
│   └── Provider and integration registry
├── Commerce Factories
│   ├── Digital Asset Factory
│   ├── Software & SaaS Factory
│   ├── AI Product Factory
│   ├── Service Factory
│   ├── Physical Product Factory
│   ├── Licensing & IP Factory
│   └── Distribution Factory
├── Commerce Channels
│   ├── Central Marketplace
│   ├── Independent Storefronts
│   └── Partner & External Channels
├── Transaction & Fulfillment
│   ├── Cart, checkout and orders
│   ├── Payment provider adapters
│   ├── Settlement and reconciliation
│   └── Digital, service, subscription and physical fulfillment
└── Revenue & Intelligence
    ├── CRM and customer operations
    ├── Growth and partner attribution
    ├── Venture-level finance
    └── Bounded agentic operations
```

## 5. Module registry

| ID | Module | Responsibility |
|---|---|---|
| GOV-COM-01 | Commerce Governance | Policies, seller eligibility, approval gates |
| REG-01 | Venture Registry | Venture identity, stage, accountable operator |
| REG-02 | Seller & Legal Entity Registry | Legal seller and contracting party |
| REG-03 | Rights Registry | Product/IP ownership and licenses |
| CAT-01 | Product Registry | Canonical product identity and versions |
| CAT-02 | Offer & Pricing | Price, currency, discount and validity |
| CAT-03 | Catalog & Taxonomy | Categories, attributes and discovery |
| STO-01 | Store Registry | Storefront identity and configuration |
| CHN-01 | Channel Registry | Marketplace and external channels |
| SAL-01 | Marketplace Discovery | Search, collection and listing |
| SAL-02 | Storefront Engine | Venture-specific storefronts |
| SAL-03 | Checkout & Order | Cart, checkout, order lifecycle |
| PAY-01 | Payment Adapter | Provider-specific payment initiation/status |
| PAY-02 | Settlement & Reconciliation | Provider reconciliation and payout records |
| FIN-01 | Revenue & Expense Ledger | Venture-level accounting records |
| FIN-02 | Commission Engine | Contracted partner/affiliate calculations |
| FLF-01 | Digital Delivery | Secure asset delivery |
| FLF-02 | Service Workflow | Service intake, scheduling, completion |
| FLF-03 | Subscription Provisioning | Subscription lifecycle |
| FLF-04 | Inventory & Shipping | Stock, shipment, delivery evidence |
| CRM-01 | Customer Operations | Customer profile, consent, support |
| GRW-01 | Growth & Attribution | Campaign, referral and conversion |
| AGT-01 | Commerce Orchestrator | Agent task routing under policy |
| AUD-01 | Commerce Audit | Append-only audit of sensitive actions |

## 6. Core data contracts

Every commerce record must carry the applicable identifiers:

- `workspace_id`
- `venture_id`
- `seller_legal_entity_id`
- `product_id`
- `offer_id`
- `store_id`
- `channel_id`
- `customer_id` (pseudonymous where possible)
- `order_id`
- `payment_id`
- `fulfillment_id`
- `rights_record_id`

Orders must snapshot the seller, product/offer version, price, currency, terms version, tax treatment where applicable, and fulfillment promise at the time of purchase. Historical orders must not silently change when a catalogue record is edited.

## 7. Tenant and data boundaries

- Cross-venture access is denied by default.
- A shared marketplace may read only the approved public listing projection.
- Customer data is accessible only for a documented purpose and authorized seller/channel relationship.
- Financial records remain venture-scoped; consolidated reporting is a controlled read model.
- Partner access is restricted to their own attribution, orders, and payable commission records.
- Provider credentials are stored server-side and are never exposed to browsers or agents.
- Data export, deletion, and retention follow documented legal and contractual duties.

## 8. Financial integration

MAELVYN uses shared financial controls, not mixed venture accounting.

For each transaction identify:
- Legal seller and merchant account.
- Gross transaction amount and currency.
- Discounts, refunds, taxes, payment fees, and direct costs.
- Contracted marketplace or channel fee, if any.
- Affiliate/reseller commission, if any.
- Settlement destination and reconciliation evidence.
- Venture revenue recognition and outstanding liabilities.

The commerce layer records provider events and allocation instructions. It must not hold, split, or transfer third-party funds unless the chosen provider, contracts, legal structure, and applicable rules expressly support that flow.

Use immutable posted journals and reversal/adjustment entries. Do not equate GMV, cash received, accounting revenue, profit, and distributable surplus.

## 9. Agentic commerce

Agents may:
- Research products and demand.
- Draft listings, offers, FAQs, and campaigns.
- Analyze conversion, pricing, margins, and customer feedback.
- Prepare support responses and fulfillment tasks.
- Reconcile data and flag exceptions.

Agents may not autonomously:
- Change legal seller or settlement bank details.
- Approve ownership/IP transfers.
- Commit to contracts or regulated offers.
- Move money, issue material refunds, or change payout destinations.
- Publish material pricing or policy changes outside an approved scope.

Every agent has an identity, owner, venture scope, tool allowlist, autonomy level, budget, audit trail, and kill switch. See `docs/AGENT-OPERATING-CONSTITUTION.md`.

## 10. Recommended implementation sequence

1. Commerce registry and seller/rights metadata.
2. Product catalogue and one independent storefront.
3. Order lifecycle and payment status adapter in test mode.
4. Secure fulfillment and customer support workflow.
5. Venture-level finance and reconciliation.
6. Central marketplace discovery.
7. Partner/affiliate distribution.
8. Agentic analysis and draft workflows.
9. Limited pre-authorized execution after evaluations and approval gates.

Do not build a full multi-vendor marketplace or automated split settlement before one venture completes a verified end-to-end sale and fulfillment cycle.

## 11. Acceptance criteria

- Every listing has an accountable venture and identified legal seller.
- Product ownership or commercial license is recorded.
- Public listing data is separated from private operational/customer data.
- Order snapshots are immutable.
- Payment webhooks are signature-verified and idempotent.
- Fulfillment has verifiable completion state.
- Venture-level gross/net reporting reconciles to provider evidence.
- Refund, dispute, cancellation, and failure paths are tested.
- Cross-venture access tests deny unauthorized reads and writes.
- Agent actions are policy-checked and audited.

## 12. Architecture lock

**LOCKED:** Hybrid channels; all-commerce scope; shared infrastructure; independent venture storefronts; venture-level rights, liabilities, customer access, and financial records; centralized governance and controlled portfolio reporting.

Implementation details may evolve through versioned architecture decisions without weakening these boundaries.
