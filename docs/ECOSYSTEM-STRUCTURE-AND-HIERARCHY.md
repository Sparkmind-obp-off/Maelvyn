# MAELVYN — Ecosystem Structure & System Hierarchy

**Version:** 1.0  
**Status:** Canonical strategic architecture; implementation status is tracked separately  
**Last reviewed:** 2026-11-18

## 1. Purpose and governing definition

MAELVYN is an **Agentic Shared Venture Studio OS**: a governed system for discovering real opportunities, validating customer demand, forming and operating ventures, creating sellable products and productive assets, and converting customer value into measurable economic outcomes.

MAELVYN is not merely a website, catalogue, collection of agents, holding company, pooled wallet, investment fund, or automatic legal partnership. The platform coordinates work and shared capabilities while preserving venture-level accountability, participant consent, asset ownership, financial records, and legal boundaries.

The ecosystem must be capable of growing into new business domains without redesigning its foundation every time a new opportunity appears.

## 2. Architectural laws

1. **Reality before taxonomy.** Market problems, customer behavior, rights, delivery capability, and unit economics determine which ventures and product families exist. A fixed number of categories is prohibited as an architectural constraint.
2. **Stable core, extensible edge.** Identity, governance, audit, finance integrity, and access boundaries remain stable. Ventures, products, channels, providers, and categories are extensible registry records.
3. **Evidence before commitment.** An idea is not a validated opportunity; a listing is not a sale; attention is not willingness to pay; gross merchandise value is not revenue or profit.
4. **Separate venture truth.** Each venture has its own charter, accountable operator, budget, ledger, customers, obligations, rights, risks, and operating metrics.
5. **Consent and rights by default.** Participation, contribution, investment, ownership, licensing, and data access require explicit, scoped authorization.
6. **Human authority over reserved matters.** Agents may research, draft, recommend, and execute bounded low-risk tasks; they cannot independently approve debt, spending beyond delegated limits, ownership, contracts, legal commitments, payouts, or material risk.
7. **Provider neutrality.** Providers are replaceable adapters selected by policy, terms, capability, security, cost, quota, and verified availability.
8. **No false implementation claims.** A documented module is not necessarily implemented; a deployed route is not necessarily production-ready. Status must be evidenced.

## 3. Full ecosystem hierarchy

The following is a logical hierarchy, not a requirement that every node become a separate application or legal entity.

```
MAELVYN — Ecosystem
├── 1. MAELVYN Core (constitutional control plane)
│   ├── Identity & Access
│   ├── Governance & Decision Rights
│   ├── Security, Privacy & Trust
│   ├── Shared Economic Core
│   ├── Registry & System Configuration
│   └── Audit, Evidence & Policy
│
├── 2. MAELVYN OS (operating plane)
│   ├── Intelligence OS
│   ├── Venture Studio OS
│   ├── Product & Service OS
│   ├── Agentic Operations OS
│   ├── Commerce OS
│   ├── Finance & Portfolio OS
│   ├── Knowledge & Asset OS
│   └── Integration & Provider OS
│
├── 3. MAELVYN Intelligence (discovery and learning)
│   ├── Market & Customer Intelligence
│   ├── Problem / Demand / Intent Signals
│   ├── Competitor & Alternative Analysis
│   ├── Product / Pricing / Channel Research
│   ├── Provider & Technology Intelligence
│   └── Portfolio Learning & Forecasts
│
├── 4. MAELVYN Venture Studio (venture formation)
│   ├── Opportunity Pipeline
│   ├── Validation Experiments
│   ├── Venture Design & Charter
│   ├── MVP / Pilot Development
│   ├── Launch & Go-to-Market
│   └── Scale / Hold / Restructure / Exit
│
├── 5. Venture Portfolio (independently accountable businesses)
│   ├── Venture Registry
│   ├── Venture Workspaces
│   ├── Venture Teams & Roles
│   ├── Venture Operations
│   ├── Venture Finance & Rights
│   └── Venture Performance & Risk
│
├── 6. Product & Asset Portfolio (what can be sold or used productively)
│   ├── Product Domains (dynamic)
│   ├── Product Families (dynamic)
│   ├── Product Types (extensible)
│   ├── Products / SKUs / Offers
│   ├── Packages, Plans & Variants
│   └── Productive Assets & IP
│
├── 7. Commerce Network (how value reaches customers)
│   ├── Owned Storefronts
│   ├── Central Discovery / Catalogue
│   ├── Partner & Reseller Channels
│   ├── Affiliate / Referral Channels
│   ├── Orders, Payments & Fulfillment
│   └── Customer Care, Refunds & Disputes
│
├── 8. Shared Services (reusable capabilities)
│   ├── Research & Analytics
│   ├── Creative & Production
│   ├── Engineering & Automation
│   ├── Operations & Customer Support
│   ├── Legal / Finance / Compliance Coordination
│   └── Distribution & Growth
│
└── 9. Finance & Portfolio Control
    ├── Budgets & Allocation
    ├── Venture Ledgers & Reconciliation
    ├── Cost / Margin / Cash / Liability
    ├── Shared-Service Cost Allocation
    ├── Portfolio Reporting
    └── Risk, Reserve & Capital Decisions
```

## 4. MAELVYN Core — constitutional control plane

The Core owns system-wide invariants and policy. It does not automatically own venture assets or money.

### 4.1 Identity & Access
- Account identity and verified identity-provider claims.
- Workspace membership, role grants, scoped permissions, invitation and offboarding.
- Venture-level access and cross-venture isolation.
- Access reviews, session security, service identities, and least privilege.

### 4.2 Governance & Decision Rights
- Policy registry and approval matrix.
- Venture charters, lifecycle gates, decision records, conflicts of interest.
- Reserved matters and separation of duties.
- Participant consent, contribution classification, agreement metadata, and ownership evidence.
- Change control and exception handling.

### 4.3 Security, Privacy & Trust
- Data classification, purpose limitation, retention, deletion, export, and incident handling.
- Threat model, secrets handling, audit integrity, backup and recovery.
- Provider security review and tool permissions.
- Customer data and personal data boundaries.

### 4.4 Shared Economic Core
- Common accounting vocabulary and reporting rules.
- Budget policy, currency rules, cost allocation policy, and reconciliation.
- Shared-service charging and inter-venture transaction records.
- Portfolio-level reporting without merging independent venture ledgers.

### 4.5 Registry & System Configuration
- Workspace, venture, product, category, provider, agent, capability, channel, and policy registries.
- Stable identifiers, lifecycle state, versioning, provenance, and deprecation.
- Dynamic taxonomy configuration; no hard-coded maximum category count.

### 4.6 Audit, Evidence & Policy
- Append-only material decision and execution records.
- Evidence provenance, source URL/reference, capture date, confidence, and reviewer.
- Policy evaluation results, denied actions, approvals, and cost attribution.
- Traceability from recommendation to decision, execution, customer outcome, and ledger result.

## 5. MAELVYN OS — operating plane

The OS turns Core policy into repeatable work.

| OS domain | Primary responsibility | Main outputs |
|---|---|---|
| Intelligence OS | Collect, normalize, assess and monitor market/provider evidence | Evidence records, demand hypotheses, opportunity candidates |
| Venture Studio OS | Move opportunity through validation and venture lifecycle | Experiments, venture charter, launch/stop decisions |
| Product & Service OS | Design, version, package, cost and maintain offers | Product records, SKU, scope, pricing hypotheses, delivery specs |
| Agentic Operations OS | Orchestrate agents, humans, tools, workflows and approvals | Tasks, runs, artifacts, verified outcomes, audit events |
| Commerce OS | Catalogue, sell, order, collect, fulfill and support | Offers, orders, payment state, fulfillment, refunds |
| Finance & Portfolio OS | Budgets, books, unit economics, reconciliation and portfolio views | Ledger records, margin, cash, liabilities, portfolio reports |
| Knowledge & Asset OS | Manage documents, IP, productive assets, scoped memory and provenance | Asset records, rights records, documents, reusable knowledge |
| Integration & Provider OS | Govern external services, adapters, credentials, quotas and fallbacks | Provider registry, health/cost records, adapter execution |

An OS domain can be implemented as a module inside the current application until scale justifies a separate service. Logical separation comes before microservice proliferation.

## 6. Intelligence and venture creation lifecycle

Every opportunity follows a controlled path:

1. **Signal capture** — record a source, date, geography, customer segment, observed behavior, and evidence class.
2. **Problem framing** — describe the customer, job-to-be-done, current alternative, pain, and urgency.
3. **Demand assessment** — separate completed purchases, active buyer intent, supply/price signals, and attention.
4. **Validation design** — define the cheapest credible test, sample limitations, success threshold, and stop condition.
5. **Validation result** — record observed results, not just expected outcomes.
6. **Venture decision** — select, park, reject, or request more evidence.
7. **Charter and approval** — assign accountable operator, scope, rights, budget, risks, unit economics, and reserved matters.
8. **Build and launch** — produce a sellable offer and prove fulfillment end-to-end.
9. **Operate and improve** — monitor paid demand, delivery quality, cash, margin, retention, and risk.
10. **Portfolio decision** — scale, hold, restructure, partner, sell, or close.

No stage transition is inferred merely because an agent generated a document or a task reached “completed”.

## 7. Venture boundary and legal/economic separation

Each venture must maintain:
- Unique venture ID and accountable operator.
- Customer, offer, seller/contracting party, and delivery responsibility.
- Approved charter, scope, budget, and stop conditions.
- Venture-specific ledger, bank/payment records, receivables, payables, taxes, and reserves.
- Team, role grants, contribution classification, agreements, and IP rights.
- Contracts, supplier terms, licenses, risks, incidents, and customer obligations.
- Product, pricing, channel, fulfillment, and unit-economics versions.

MAELVYN-level coordination does not make MAELVYN the legal seller, employer, owner, lender, guarantor, custodian, or contracting party by default. Those roles must be identified and legally reviewed for each actual transaction.

## 8. Product and asset hierarchy

Taxonomy is a registry and discovery system, not a fixed menu.

```
Market / Customer Problem
  → Business Domain
    → Product Family
      → Product Type
        → Product / Service
          → SKU / Offer Version
            → Package / Plan / Variant
              → Order Line / Fulfillment Instance
```

Examples of possible domains (illustrative, not exhaustive or pre-approved):
- Business automation and operations.
- Creative, content, and media production.
- Digital products, knowledge, and templates.
- Software, micro-applications, and subscriptions.
- Commerce, distribution, and physical goods.
- Research, intelligence, and data services.
- Professional, implementation, and managed services.
- Any other domain supported by credible evidence and legal delivery capability.

A new domain is added only when there is a distinct customer/problem cluster, meaningful offer differences, or operating/reporting needs that justify it. Similar offers should share a family; unrelated offers should not be forced into one category for convenience.

## 9. Commerce progression

MAELVYN should expand commerce in stages:

**Stage A — Owned commerce**
- Sell offers where the venture has verified rights, pricing authority, delivery capacity, and customer support.
- Prove order → payment → fulfillment → customer acceptance → reconciliation.

**Stage B — Curated partner commerce**
- Add selected partner products only after seller identity, rights, quality, supply, delivery, refund, commission, and data terms are verified.
- Use explicit partner contracts and settlement rules.

**Stage C — Network / marketplace**
- Add multi-seller discovery, onboarding, partner analytics, commissions, seller settlements, and dispute operations only after operational/legal readiness.
- Never imply marketplace custody or payment splitting unless the payment provider and legal structure actually support it.

## 10. Shared services and cross-venture charging

Shared services may be provided centrally or by a venture under explicit agreements. Record:
- Service provider and recipient venture.
- Service scope, SLA, rate or allocation method.
- Direct costs, shared overhead, and usage.
- Approval and invoice/ledger treatment.
- IP, data access, confidentiality, and termination terms.

Do not silently move cash, costs, customer records, staff, IP, or liabilities between ventures.

## 11. Finance and portfolio truth

Always distinguish:
- Gross order value / GMV.
- Revenue recognized under the applicable accounting policy.
- Cash collected and settlement timing.
- Refunds, chargebacks, fees, taxes, and direct costs.
- Gross profit and contribution margin.
- Operating expenses and net result.
- Debt and other liabilities.
- Restricted cash and reserves.
- Distributable surplus (only after legal, tax, liquidity, and agreement checks).

A portfolio dashboard must drill down to the originating venture and transaction. Consolidation is a reporting view, not an automatic pooling of legal or economic ownership.

## 12. Agentic operating model

Agents are role-scoped workers, not owners or independent legal persons.

Typical agent roles:
- Research analyst.
- Evidence verifier.
- Opportunity analyst.
- Venture planner.
- Product manager.
- Pricing and unit-economics analyst.
- Creative/production specialist.
- Engineering agent.
- Commerce operations agent.
- Customer support assistant.
- Finance analyst.
- Compliance and risk reviewer.
- Portfolio analyst.

Every agent must have a defined purpose, allowed tools, data scope, budget/usage limit, approval requirements, output schema, and escalation path. Agent memory must be scoped by workspace and venture. Cross-venture access is denied unless explicitly authorized.

## 13. System boundaries

| Boundary | Rule |
|---|---|
| Core ↔ Venture | Core sets policy; venture owns its operating records and obligations |
| Venture ↔ Venture | No data, money, assets, or permissions cross by default |
| Agent ↔ Human | Agent recommends or acts within scope; reserved decisions stay human |
| Product ↔ Commerce | Product defines what is offered; commerce records actual customer transactions |
| Research ↔ Decision | Evidence informs decisions; evidence does not itself authorize spending |
| Provider ↔ MAELVYN | Provider is an external dependency with separate terms, credentials, limits, and failure modes |
| Development ↔ Production | Separate credentials, databases, storage, identity instances, and data |
| Public ↔ Private | Public catalogue must not expose private workspace, customer, financial, or IP records |

## 14. Implementation status discipline

Every component must be labelled with one of:
- **Implemented & verified** — code exists and tests or live evidence prove the stated behavior.
- **Implemented, not fully verified** — code exists but end-to-end or production proof is missing.
- **Partially implemented** — some workflows exist; important capabilities remain absent.
- **Designed only** — architecture or requirements exist, no implementation claim.
- **Blocked** — a known dependency or approval prevents use.
- **Deprecated** — retained for migration/reference only.

As of the repository snapshot reviewed 2026-11-18, the application has substantial Core, governance, finance, venture, provider, research, and operations foundations. Production Pages is deployed, but the Production readiness report says Clerk server secret is not configured and sign-in/owner bootstrap/R2 round-trip remain blocked. See `MAELVYN-PRODUCTION-DEPLOYMENT-VERIFICATION.md`; do not describe the platform as fully operational.

## 15. Architectural success criteria

MAELVYN succeeds when it repeatedly:
- Discovers genuine customer problems.
- Validates willingness to pay before major commitment.
- Forms accountable ventures with explicit rights and economics.
- Creates products that customers can buy and receive.
- Delivers reliably and handles customer issues.
- Reconciles orders, payments, costs, and cash.
- Improves contribution margin and repeat customer outcomes.
- Protects people, data, IP, assets, and legal boundaries.
- Uses agents to lower time/cost per verified outcome without weakening control.

The governing idea: **Core preserves integrity; OS coordinates work; Intelligence finds evidence; Studio forms ventures; Ventures operate businesses; Products package value; Commerce converts value into transactions; Finance proves the economics.**
