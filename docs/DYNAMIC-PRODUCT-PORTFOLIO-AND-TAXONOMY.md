# MAELVYN — Dynamic Product Portfolio & Taxonomy Governance

**Version:** 1.0  
**Status:** Product and portfolio governance baseline  
**Principle:** no fixed number of product categories, families, or SKUs

## 1. Purpose

This document defines how MAELVYN discovers, classifies, validates, versions, sells, and retires products and services across multiple ventures.

MAELVYN must not be constrained to a predetermined count such as five or ten categories. A taxonomy should reflect distinct customer problems, buying behavior, delivery models, rights, economics, and operational requirements found in evidence.

The goal is not to maximize catalogue size. The goal is to make every offer discoverable, commercially clear, deliverable, legally supportable, and economically measurable.

## 2. Taxonomy model

Use the following hierarchy, allowing optional levels where appropriate:

1. **Market / Customer Segment** — who buys and in what context.
2. **Problem / Job-to-be-Done** — what outcome or problem the buyer pays to solve.
3. **Business Domain** — broad commercial area.
4. **Product Family** — related offers serving a coherent problem cluster.
5. **Product Type** — delivery/commercial pattern.
6. **Product / Service** — named offer with owner and scope.
7. **SKU / Offer Version** — purchasable configuration, price, currency, and terms.
8. **Package / Plan / Variant** — optional tier, quantity, duration, feature set, or service level.
9. **Order Line / Fulfillment Instance** — actual customer transaction and delivery record.

Not every product requires every level. Physical goods may need variants and inventory; services may need scope, capacity, and SLA; digital downloads may need file/version/license; software may need plans, seats, usage limits, and uptime commitments.

## 3. Taxonomy rules

- A category is created to solve a real navigation, reporting, or product-governance need—not to fill a quota.
- Categories must have a definition, inclusion/exclusion criteria, owner, parent, status, and review date.
- A product can have one primary category and multiple controlled tags. Avoid duplicate near-identical categories.
- Product family should group offers with similar buyers, problem, fulfillment, and economics.
- Product type describes how value is delivered or monetized, not the market sector.
- Use stable IDs; labels may change without breaking orders, reports, or integrations.
- Category changes must not rewrite historical order snapshots or financial records.
- Merging, splitting, renaming, or retiring categories requires a migration map and audit entry.
- New category proposals remain draft until an accountable reviewer approves them.
- Never create category labels based solely on a provider's menu, an AI suggestion, or a competitor's catalogue.

## 4. Candidate domain discovery

The following are current opportunity hypotheses, not fixed or exhaustive categories:

| Candidate domain | Example customer outcomes | Candidate product families |
|---|---|---|
| Business automation & operations | Reduce manual admin, errors, and response time | Workflow automation, lead routing, reporting, CRM setup |
| Creative & content operations | Produce consistent content and campaigns | Short-form video, product visuals, social content operations |
| Digital products & knowledge assets | Reuse proven methods and operating tools | Templates, SOPs, spreadsheets, playbooks |
| Software & micro-applications | Complete repeatable jobs with software | Vertical tools, internal apps, SaaS subscriptions |
| Commerce & distribution | Improve product discovery and sales execution | Store setup, catalogue operations, partner distribution |
| Research & intelligence | Make decisions with better market evidence | Market scans, competitor maps, demand studies |
| Professional / implementation services | Reach a defined operational outcome | Setup, migration, integration, managed support |
| Emerging domains | Solve new validated problems | Created only after evidence and capability review |

Do not assume all domains should launch. A domain becomes an active portfolio area only after the opportunity passes evidence, capability, rights, risk, and economics gates.

## 5. Product type registry

The type registry may include, but is not limited to:

- Productized service.
- Managed service / retainer.
- One-time implementation or integration.
- Consulting, audit, or research engagement.
- Digital download or licensed asset.
- Template, toolkit, workflow, or SOP pack.
- Software license or subscription.
- Usage-based service.
- API or data service, where lawful and rights-cleared.
- Physical product.
- Partner/reseller product.
- Affiliate/referral offer.
- Bundle or cross-venture package.
- Maintenance, support, or training plan.

Types can be added or deprecated through governance. A type must specify its required commercial and fulfillment fields.

## 6. Product record — minimum data contract

Every sellable product must have:

| Field | Requirement |
|---|---|
| Product ID | Stable unique identifier |
| Name and description | Clear buyer-facing promise; no unsupported claims |
| Venture owner | Accountable venture and operator |
| Seller / contracting party | Actual legal party responsible for the sale |
| Customer segment | Intended buyer and use case |
| Problem / outcome | Job-to-be-done and measurable expected outcome |
| Category and family | Approved taxonomy references |
| Product type | Approved delivery/monetization type |
| Scope and exclusions | Exactly what is and is not included |
| Rights basis | Ownership, license, supplier authorization, and third-party terms |
| Delivery model | Digital, physical, service, subscription, or hybrid |
| Capacity / inventory | Availability and fulfillment constraints |
| Price and currency | Approved current price; historical price versions retained |
| Cost model | Direct labor, provider usage, materials, payment fees, refunds, overhead allocation |
| Unit economics | Gross margin/contribution assumptions and actuals |
| SLA / due date | Delivery commitment and support window |
| Refund / warranty | Clear conditions and responsible party |
| Data handling | Customer data collected, purpose, access, retention, deletion |
| Channels | Permitted storefront, partner, affiliate, or marketplace channels |
| Status | Draft, validation, approved, active, paused, retired |
| Evidence | Demand evidence, test results, customer feedback, and review date |

A product cannot be published if seller identity, rights, scope, price, fulfillment owner, customer terms, and support path are missing.

## 7. Offer and SKU versioning

A product may have multiple offers/SKUs. Each version should snapshot:
- Price, currency, tax treatment where applicable.
- Package contents, limits, quantity, duration, and SLA.
- Eligible customer and channel restrictions.
- Supplier/provider dependencies and cost assumptions.
- Refund, cancellation, and renewal terms.
- Effective date and superseded version.
- Approval record and published timestamp.

Orders must preserve the exact offer version purchased. Changing the current product page must not alter a customer's existing order or contractual promise.

## 8. Product lifecycle

```
IDEA
  → RESEARCH
    → VALIDATION
      → PRODUCT DESIGN
        → COST & RIGHTS REVIEW
          → APPROVAL
            → LISTED / AVAILABLE
              → PAID ORDER
                → FULFILLMENT
                  → ACCEPTANCE / SUPPORT
                    → REVIEW / ITERATION
                      → SCALE | PAUSE | RETIRE
```

### Lifecycle definitions

- **Idea:** an unverified concept; not sellable.
- **Research:** problem, customer, alternatives, market, and evidence are being gathered.
- **Validation:** buyer intent or paid test is being measured.
- **Product design:** scope, deliverable, workflow, capacity, and terms are defined.
- **Cost & rights review:** direct costs, provider terms, IP, data, seller, and liability are checked.
- **Approval:** authorized person approves price, scope, seller, and launch conditions.
- **Listed / available:** buyer can see an accurate offer; this is not evidence of a sale.
- **Paid order:** payment/settlement status is recorded; do not equate an initiated checkout with collected cash.
- **Fulfillment:** delivery is evidenced against the promised scope.
- **Acceptance / support:** customer outcome, complaint, refund, and repeat-use data are captured.
- **Review:** actual margin, delivery time, quality, refunds, and demand are compared with assumptions.
- **Scale / pause / retire:** decision is recorded with evidence and impact.

## 9. Evidence model for product decisions

Use explicit evidence classes:

| Class | Meaning | Example | What it can justify |
|---|---|---|---|
| A — Completed transaction | Verifiable paid project/order with completed/accepted status | Completed marketplace project with accepted budget | Strong signal that a buyer paid for a related outcome |
| B — Active buyer intent | Current published request with budget/deadline and buyer need | Open project seeking a specific automation setup | Test design and targeted validation; not proof of payment |
| C — Supply / price signal | Sellers list comparable products or services and prices | Marketplace listings | Competitive and price-range research; not proof of sales |
| D — Attention signal | Views, followers, search interest, channel activity | Popular creator niche or search trend | Audience interest hypothesis; not buyer conversion |
| E — Anecdotal / unverified | Claims without independently checkable evidence | Informal comments or unsupported market claims | Research leads only |

Evidence record fields:
- Evidence ID and class.
- Source platform, exact URL, capture timestamp, and source owner.
- Geography, language, customer segment, and query/collection method.
- Observed fact, extracted fields, and source excerpt/summary.
- Verification status and reviewer.
- Sample size, collection coverage, duplicate rate, and known bias.
- Cost of collection and tool/provider.
- Expiry/recheck date.
- Linked opportunity, venture, product family, or SKU.
- Decision influenced and decision date.

Never promote C or D into A/B. A marketplace listing price is not an observed sale price. A buyer's posted budget is not necessarily the amount paid. A completed transaction must be verified from a source that actually establishes completion and accepted payment/budget.

## 10. Product opportunity scoring

Use a transparent score to prioritize tests, not to auto-approve launch.

Suggested dimensions:
- Customer pain and urgency.
- Evidence of willingness to pay.
- Buyer accessibility and acquisition channel.
- Delivery capability and time-to-first-value.
- Gross margin and contribution margin potential.
- Capital and provider-cost exposure.
- Repeatability and retention potential.
- Legal, privacy, safety, and IP risk.
- Strategic reuse of skills/assets across ventures.

Each score must include evidence or be explicitly marked as an assumption. Critical legal, rights, safety, privacy, or solvency risks can block an offer regardless of score.

## 11. Pricing governance

Prices are hypotheses until supported by actual buyer behavior. For each price:
- State the currency and tax assumptions.
- Separate competitor asking prices from actual transaction prices.
- Calculate direct delivery costs and provider usage.
- Include payment fees, refunds, rework, customer support, and acquisition cost where known.
- Model capacity and delivery time.
- Define minimum acceptable contribution margin or explain why a pilot intentionally tests below it.
- Record who approved the price and when.
- Review after actual orders, lost deals, refunds, or cost changes.

Do not publish previously discussed example prices as validated market prices without new evidence.

## 12. Commerce and fulfillment requirements

Before listing:
- Seller and rights verified.
- Product description and exclusions clear.
- Price, tax treatment, capacity, and availability approved.
- Payment provider and merchant account ready.
- Order confirmation and status transitions tested.
- Fulfillment method and acceptance evidence defined.
- Support, cancellation, refund, dispute, and escalation path ready.
- Customer privacy notice and data retention defined.
- Ledger and settlement reconciliation tested.

For a service, fulfillment may require a brief, acceptance criteria, production milestones, delivery artifact, customer review, and revision/refund policy. For a digital product, include version, access control, license, download security, and support. For physical goods, include inventory, shipping, returns, and supplier quality.

## 13. Portfolio performance

Report at product, family, venture, and channel levels:
- Qualified leads and conversion.
- Paid orders and collected cash.
- Revenue under the applicable recognition policy.
- Direct cost, gross profit, contribution margin.
- Delivery time, on-time rate, acceptance, rework.
- Refunds, disputes, and chargebacks.
- Repeat purchase and retention.
- Acquisition cost and payback where measurable.
- Provider cost per accepted outcome.
- Capacity utilization and stockouts.
- Customer satisfaction and complaints.

Catalogue size, listings, impressions, agent runs, and GMV alone are not success measures.

## 14. Category governance

### Create
Create a category when at least one of these is true:
- Customer problem or buyer intent is materially distinct.
- Product scope or fulfillment model is meaningfully different.
- Rights, regulation, safety, or data obligations require separate controls.
- Reporting or discovery becomes confusing without a new grouping.

### Merge
Merge when categories have the same buyer, problem, delivery pattern, and governance requirements and separation adds no useful signal.

### Split
Split when one category hides materially different customer segments, fulfillment, risk, or economics.

### Retire
Retire when no active products or credible opportunities remain, while preserving historical references and order snapshots.

All changes require stable IDs, audit trail, effective date, owner, and migration mapping.

## 15. Governance and approval matrix

| Action | Agent may prepare | Human approval required |
|---|---|---|
| Suggest new product/category | Yes | Before registry activation |
| Collect public market evidence | Yes, within provider policy | For paid collection or restricted data |
| Draft product copy | Yes | Before publication |
| Estimate costs/margins | Yes, with assumptions | Before budget or price commitment |
| Recommend price | Yes | Before publishing/changing price |
| Publish offer | Only if explicitly delegated low-risk permission exists | Default: yes |
| Accept order | System may record | Contracting/payment rules must be approved |
| Commit supplier spend | No autonomous authority | Yes |
| Issue refund/payout | No autonomous authority by default | Yes, according to policy |
| Transfer IP or ownership | No | Explicit rights-holder/legal process |
| Retire product | Draft recommendation | Human approval for obligations/customer impact |

## 16. Initial product discovery queue — hypotheses, not launches

Based on evidence currently recorded in the MAELVYN research history, initial areas worth further testing include:

1. WhatsApp-to-spreadsheet operational automation and lightweight reporting.
2. Social media/content operations for small businesses.
3. Short-form promotional video editing and product content.
4. Reusable business templates, SOPs, and spreadsheet tools.
5. Customer discovery and lead workflow setup.

The strongest completed-transaction evidence in the current register relates to a WhatsApp-to-Google-Sheets automation project (Rp200,000), social media management (Rp1,500,000), and video editing (Rp100,001). One active request for Claude-based customer discovery automation carried a posted budget of Rp500,000–1,000,000 but was not a completed transaction. Marketplace listings provide supply/asking-price signals only. These records justify further validation, not automatic product launch or guaranteed willingness to pay.

## 17. Implementation alignment

Current application foundations include venture registry/workspaces, research brief/provider adapters, governance, finance, operations, assets/artifacts, audit, and portfolio reporting. The product taxonomy and commerce capabilities should be implemented incrementally using the existing domain model and commerce architecture; do not add a parallel product system without inspecting the existing schema and routes.

Before database changes:
1. Map current schema and API to this document.
2. Identify existing reusable entities and gaps.
3. Propose a migration with backward compatibility and data ownership.
4. Add tests for tenant/venture isolation, version snapshots, audit, and order/ledger invariants.
5. Deploy to Development and verify before Production.
