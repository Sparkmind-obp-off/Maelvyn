# MAELVYN External/Internal Boundary Contract

Status: architecture contract for implementation. This document is normative for all new routes, UI surfaces, workers, factories, provider adapters, and distribution connectors.

## 1. Non-negotiable separation

MAELVYN has distinct trust zones. They are not merely navigation sections.

### External zone
1. Customer Experience: public site, customer identity, customer workspace, brief intake, order tracking, approved delivery, support, acceptance, and customer-visible billing.
2. Commerce: catalog, offers, packages, SKUs, prices, checkout/order records, entitlements, subscriptions, refunds/adjustments, and customer-facing commercial terms.
3. Distribution & Market Access: owned-site publishing, marketplace listings, social channels, affiliate/partner referrals, lead capture, campaign publishing, and channel analytics.

These surfaces may communicate only through versioned, authenticated application contracts. They must not query internal factory tables, agent state, provider credentials, internal finance ledgers, or another customer's workspace.

### Internal zone
4. Agentic OS / Control Plane: identity authorization, orchestration, task contracts, agents, workflows, memory, evaluation, policy, approval, audit, cost reservation, and status projection.
5. Product & Factory Runtime: research, software, automation, creative, digital-product, service, and commerce-operations factories. Factories execute work under OS-issued task contracts; they do not expose internal execution endpoints to customers or distribution channels.
6. Provider & Integration Fabric: MCP/API/model/SaaS adapters, credentials, health, capability registry, quotas, pricing, rights, and execution logs. Provider credentials and raw provider responses remain internal.

## 2. Direction of communication

The permitted path is:

`External Experience / Commerce / Distribution`
→ `Public Application API`
→ `OS command/event boundary`
→ `Policy + approval + budget gate`
→ `Factory task contract`
→ `Provider Fabric`
→ `Factory output + QA`
→ `OS acceptance / approval`
→ `Commerce entitlement or Distribution publication`
→ `Customer-safe projection`

A factory may call the OS through an internal service contract. A factory must not call a provider directly outside the Provider Fabric. External services must never call a factory worker or provider adapter directly.

## 3. Contracts at the boundaries

### Customer-facing contracts
- Submit a brief / request.
- Create or view an order.
- View customer-safe progress states.
- Accept or request revision of an approved deliverable.
- Retrieve an authorized, time-limited delivery link.
- Open a support request.

Customer-visible statuses are projections, not raw task/provider statuses. Never expose provider IDs, agent prompts, internal notes, raw logs, private object keys, other customers, internal cost/margin, or unapproved artifacts.

### Commerce contracts
- Publish only approved product versions and offers.
- Resolve price, currency, terms, rights, eligibility, and availability from approved commercial records.
- Create an order/entitlement through the OS-controlled order boundary.
- Trigger fulfillment by emitting an order event; never execute a factory directly.
- Keep payment provider webhooks idempotent and signature-verified.

### Distribution contracts
- Receive approved listing/campaign payloads from the commercial catalog.
- Store channel-specific listing IDs, status, metrics, and sync errors.
- Require channel authorization, rights validation, and publication approval.
- Treat unsupported seller APIs as manual/assisted channels; do not claim automated publishing.
- A channel connector cannot read factory source files or internal customer data. It receives only the approved export package.

### Factory task contract
Every task must include:
- task ID, workspace ID, venture ID, factory ID, task type and schema version;
- initiating order/brief reference, if any;
- permitted capabilities and provider policy;
- budget and time limits;
- input artifact references scoped to that venture;
- required output schema and QA criteria;
- approval requirements and cancellation/expiry behavior.

Factory output must be stored as private artifacts with immutable scope metadata. Output is not customer-visible until QA and approval pass.

### Provider contract
- Factories request capabilities from the OS; OS routes through Provider Fabric.
- Provider adapters are server-side only and use server-side credentials.
- Every live or paid call must pass workspace activation, capability allowlist, per-task cap, daily cap, rights policy, and approval checks.
- No automatic provider fallback that can create unapproved cost or change data handling.
- Unknown pricing, unclear commercial rights, or missing limits means disabled by default.
- Provider raw output is internal until normalized, validated, and approved.

## 4. Identity and data isolation

- Separate public customer authorization from internal operator/admin authorization.
- Internal admin routes require an internal role and must not be reachable through customer-only sessions.
- Workspace and venture scope must be enforced server-side on every read and write; never trust IDs supplied by the browser.
- Distribution credentials are channel-scoped and stored as secrets, never in D1 plaintext or client bundles.
- Customer responses use explicit allowlisted DTOs. Do not serialize database rows directly.
- Artifact downloads require ownership/entitlement checks and short-lived, single-use delivery tokens.
- Audit all privileged actions, approvals, provider executions, listing publication, and financial posting.

## 5. Data ownership

| Domain | System of record | External exposure |
|---|---|---|
| Customer identity and workspace | Identity + workspace services | Own profile and authorized workspace only |
| Briefs and orders | Customer/Commerce domain | Customer-safe fields only |
| Task orchestration | Agentic OS | Projected progress only |
| Factory execution | Factory runtime | No direct access |
| Provider registry and usage | Provider Fabric | No provider secrets; selected capability descriptions only |
| Product/offer/SKU | Product & Commerce domain | Approved active versions only |
| Distribution listings | Distribution domain | Public listing and customer-safe status only |
| Finance, cost, margin, journals | Internal finance domain | Explicit customer invoice/payment summary only |
| Artifacts | Private artifact service | Authorized delivery only |

## 6. Prohibited shortcuts

- No direct Customer → Factory call.
- No direct Commerce → Factory call.
- No direct Distribution → Factory call.
- No Factory → Provider direct call.
- No browser → Provider direct call.
- No public route that returns internal ORM/D1 rows wholesale.
- No shared customer/admin dashboard or role inferred from a hidden UI flag.
- No publishing an artifact before QA, rights, and approval.
- No marketplace or social publishing merely because a connector exists.
- No production deployment as a side effect of architecture work.

## 7. Build sequence

1. Enforce route groups and authorization boundaries.
2. Establish versioned OS command/event contracts and customer-safe status projections.
3. Make factory task execution consume OS-issued task contracts only.
4. Make provider calls OS-mediated and budget/rights gated.
5. Connect approved output to product version → offer/SKU → order/entitlement.
6. Connect Distribution to approved export packages and publication approvals.
7. Add channel-specific adapters only after official API capability, account eligibility, pricing, rights, and write scopes are verified.

## 8. Acceptance tests

- Customer token cannot read admin, provider, factory, internal finance, or another workspace data.
- Admin-only token is required for provider settings, factory controls, approvals, and internal finance.
- Customer order creates an OS event; it cannot invoke a factory endpoint directly.
- Factory cannot execute a provider adapter without an OS-issued capability grant and budget reservation.
- Distribution cannot publish a non-approved SKU or artifact.
- Customer API never returns provider credentials, internal cost/margin, prompts, raw logs, object keys, or unapproved artifacts.
- Cross-workspace and cross-venture artifact/order/task access is denied.
- All denied privileged actions and all approvals are auditable.

## 9. Current implementation note

The existing repository already has parts of the internal foundation (workspace/venture scoping, provider registry/router, usage caps, approvals, private artifact metadata). This contract does not imply that every boundary above is already enforced. Each acceptance test must be demonstrated against the running code before the platform is called production-ready.
