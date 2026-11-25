# MAELVYN — Agentic Platform Master System

**Version:** 1.0.0  
**Status:** Canonical technical specification; implementation status tracked separately  
**Product:** MAELVYN — Venture Studio & Commerce Ecosystem  
**Category:** Agentic Shared Venture Studio OS / Agentic Revenue Ecosystem  
**Domain:** https://maelvyn.biz.id  
**Repository:** https://github.com/Sparkmind-obp-off/Maelvyn

> Build the control. Buy the capabilities. Connect the ecosystem. Monetize the outcomes.

This technical specification complements, and does not replace, [MASTER-SYSTEM.md](MASTER-SYSTEM.md), which governs venture constitution, participation, rights, ownership, finance and governance.

## 1. Mission

MAELVYN is a governed platform to research opportunities, design and build products, operate ventures, coordinate human and AI work, connect external capabilities, and deliver customer-facing intelligence, workflow, content and commerce outcomes.

MAELVYN owns its control plane and canonical business records. External providers supply replaceable capabilities; they do not own MAELVYN identity, authorization, tenant isolation, approval policy, canonical business data, finance, ownership or audit.

The platform has two connected purposes:
- **Internal operating system:** owner control, portfolio/venture workspaces, agentic workflows, evidence, finance, governance and operations.
- **Customer product platform:** outcome-based intelligence, workflow, content, commerce and eventually marketplace products.

Build shared capabilities once; productize them without duplicating systems.

## 2. Non-negotiable principles

1. MAELVYN owns control; providers supply capabilities.
2. One canonical source of truth for identity, tenant, venture, task, finance, rights, approvals and audit.
3. Provider-neutral contracts: internal workflows call stable capability IDs, not vendor-specific APIs.
4. Gateway-only execution: agents never call providers directly.
5. Deny by default for access, tools, scopes, writes and autonomy.
6. Human approval is mandatory for money movement, contracts, ownership, legal commitments, publishing, outbound messaging, deletion and high-risk/irreversible actions.
7. Free-first and cost-transparent; prefer no-cost tiers and BYOK, but never assume free quota or commercial rights.
8. No paid plan, top-up, purchase, subscription, paid resource or new charge without explicit user approval.
9. Evidence before claims; distinguish mock, development, preview, staging and production.
10. Reuse existing modules, schemas, providers and workflows where they meet the contract.
11. Minimize data sent to providers; redact secrets and sensitive fields.
12. Monetize MAELVYN workflows and outcomes, not raw third-party API access.

## 3. System planes and identities

### 3.1 Control plane

MAELVYN Core owns identity mapping, tenant/workspace/venture membership, RBAC/ABAC, policy, approvals, canonical business entities, finance ledger, budgets, usage, ownership/IP/rights, audit/evidence, product definitions and entitlements.

### 3.2 Execution plane

Agentic OS, task runs, workflows, queues, provider adapters, MCP boundaries and external providers perform bounded work under Core policy. Execution cannot grant itself permissions or mutate reserved control-plane records without authorization and required approval.

### 3.3 Distinct identities

Keep these separate:
- Person/User — authenticated human.
- Customer — commercial relationship and billing/contract context.
- Workspace — collaboration/access boundary.
- Venture — independently scoped business and data boundary.
- Agent — software identity with owner, purpose, version, scopes and autonomy ceiling.
- Provider — external service vendor.
- Integration Account — authenticated account owned by MAELVYN or a customer.
- Execution Principal — effective identity and authority for one execution.

Resolve authorization server-side. Never trust model-supplied tenant, venture, role or account identifiers as proof of authority.

### 3.4 Isolation

- Enforce tenant/workspace isolation on every route, query, file, job, webhook and provider call.
- Scope venture data independently inside the authorized workspace.
- Deny cross-tenant and cross-venture access by default.
- Bind customer BYOC accounts only to their owning customer/workspace.
- Keep MAELVYN-owned accounts separate from customer accounts.
- Background jobs and webhooks must re-resolve authorization server-side.
- Add negative tests for unauthorized reads, writes, exports, object references and artifacts.

## 4. Target technical architecture

~~~mermaid
flowchart TB
  UX[Public Site / Customer Workspace / Owner Control]
  AUTH[Identity, Tenant, Workspace, Venture]
  CORE[MAELVYN Core: RBAC, Policy, Approvals, Canonical Data]
  FIN[Finance, Rights, Usage, Audit and Evidence]
  OS[Agentic OS: Agents, Plans, Tasks, Memory, Evaluations]
  GW[Execution Gateway: Scope, Allowlist, Budget, Approval, Idempotency]
  REG[Provider Registry and Account Binding]
  AD[Provider-Neutral Adapters / MCP Boundary]
  EXT[External APIs, MCP Servers and SaaS]
  STORE[D1 / Private R2 / Queues / Workflows]
  UX --> AUTH --> CORE
  CORE --> FIN
  CORE --> OS
  OS --> GW
  GW --> REG --> AD --> EXT
  GW --> STORE
  FIN --> STORE
  OS --> STORE
~~~

### 4.1 Core

Core is the source of truth for authentication subject mapping, membership, permissions, policy, approvals, canonical business records, finance, usage/cost ledger, ownership/IP/rights, audit events and evidence provenance.

### 4.2 Agentic OS

Agentic OS owns agent registry, plans, task contracts, execution runs, checkpoints, retries, cancellation, scoped memory, evaluations and orchestration. It is not the canonical business database and cannot bypass Core policy.

### 4.3 Execution Gateway

Every tool/provider call must:
1. Authenticate the execution principal.
2. Resolve tenant, workspace, venture, user, agent and account scopes server-side.
3. Validate capability ID/version, input schema and data classification.
4. Check role, policy, allowlist, account ownership and autonomy ceiling.
5. Check provider terms, data handling, budget, quota and rate limits.
6. Obtain human approval when required.
7. Minimize/redact input and assign correlation/idempotency IDs.
8. Execute the selected adapter.
9. Validate output, side effects, evidence and provenance.
10. Persist usage, cost, result references and append-only audit evidence.
11. Handle timeout, retry, cancellation, compensation and escalation safely.

Agents must never receive raw provider credentials.

### 4.4 Provider adapters

Adapters map stable MAELVYN capability contracts to external APIs/MCP. They expose typed inputs/outputs, normalized errors, usage/cost metadata, timeout/retry behavior, health status and provenance. Authorization remains in the gateway.

### 4.5 Infrastructure

Cloudflare-first, not Cloudflare-only. Prefer the existing stack and bindings:
- Workers + Hono for API/runtime.
- D1 for relational control-plane and operational records.
- Private R2 for artifacts and scoped delivery.
- Queues and Workflows for durable asynchronous execution.
- Durable Objects only where coordination semantics justify them.
- Clerk with server-side JWT/session verification.
- Provider-neutral adapters; secrets only in approved environment/secret bindings.

Do not introduce new infrastructure or paid services without demonstrated need and explicit approval.

## 5. Five capability layers

| Layer | Responsibility | Internal examples |
|---|---|---|
| L1 — Intelligence & Evidence | Discover, collect, normalize, score and preserve evidence | Search orchestration, extraction, entity resolution, source ledger, market/competitor analysis |
| L2 — Execution & Control | Identity, policy, approvals, budget, execution and audit | Core, RBAC, gateway, usage ledger, task state, audit/evidence |
| L3 — Design & Product Factory | Convert evidence into validated, buildable offers | Product registry, product strategy, UX/design workflow, website/prototype factory |
| L4 — Creative & Content Factory | Produce, review, version and deliver content | Briefs, storyboards, asset pipeline, editing/QA, content calendar |
| L5 — Integration & Automation | Connect accounts and run authorized workflows | Provider registry, BYOC, adapters, MCP, automation, communications |

Core and Owner Control are foundational governance layers, not providers or an extra capability layer. Agentic OS orchestrates across all five.

## 6. Customer products and roadmap

| Stage | Product | Outcome | Release dependency |
|---|---|---|---|
| 1 | SIGNAL | Market/category/competitor/pricing/trend/opportunity intelligence with source evidence | Verified research bindings, provenance and usage limits |
| 1 | LEADINTEL | Evidence-backed company/prospect/partner research and qualification; no outreach | Public/authorized data, privacy and commercial-use review |
| 2 | FLOW | CRM, customer history, pipeline, reminders, follow-up, scheduling and communications | BYOC, consent, message approval, durable events |
| 3 | REACH | Content research, strategy, briefs, approvals, publishing queue and performance | Creative pipeline, platform permissions, human publish approval |
| 3 | COMMERCE | Catalog, orders, inventory, payment reconciliation, fulfillment and margin | Store/payment binding, reconciliation and security |
| 4 | Agentic Workforce | Supervised durable multi-agent execution with scoped autonomy and evaluation | Durable runtime, gateway, checkpoints, retries, kill switch |
| 5 | Product Marketplace | Operational selection and delivery of MAELVYN solutions/packages/workflows | Entitlements, billing, provisioning, fulfillment and support |

DISTRIBUTOR is a future COMMERCE extension. CONCIERGE is an optional add-on. The existing /products pages are a catalog, not proof of transactional marketplace, checkout, provisioning or fulfillment.

## 7. Provider binding policy

### 7.1 Status vocabulary

- DISCOVERED — candidate identified.
- ACCOUNT_CONNECTED — authenticated account exists in the relevant environment.
- ADAPTER_IMPLEMENTED — adapter exists and passes contract tests.
- BOUND_DEV — account mapping and gateway policy work in development.
- BOUND_STAGING — staging config and tests verified.
- BOUND_PRODUCTION — production secrets, scopes, quota, tests and audit verified.
- SUSPENDED — disabled due to cost, security, terms, health or owner decision.
- UNBOUND — default until evidence exists.

A ChatGPT connector being available does not prove MAELVYN runtime access. A discovery document is not an adapter. A connected account is not a production binding.

### 7.2 Required binding record

Provider/capability IDs and versions; account owner and non-secret account reference; environment and state; adapter path and contract tests; gateway policy/scopes/operations/data classes; cost/free quota/rate limits/budget; commercial-use, embedded/white-label, redistribution and retention terms; secret binding name (never secret value); health/test timestamps; owner/review date; fallback, disable and deletion procedure.

### 7.3 Free-first and BYOC

Candidates may include Tavily, Firecrawl, Apify, Scrape.ly, Cloudflare Workers AI, AgentData, DataForSEO and reviewed connectors. All remain UNBOUND until proven. Do not assume free quota or commercial permission. Customer BYOC is default for customer-owned accounts. Keep MAELVYN-owned accounts isolated.

Composio is an integration-fabric candidate; custom MCP is for MAELVYN internal tools; Make/Pipedream may fill specific gaps. Review embedded SaaS, resale, white-label, data-processing and redistribution terms before commercial use.

## 8. Autonomy and approval matrix

| Action | Default | Control |
|---|---|---|
| Public research/read-only analysis | Allowed within scope/budget | Provenance, rate and cost limits |
| Draft report/content/code/workflow | Prepare only | Human review before external use |
| Internal low-risk record update | Only if allowlisted | Role, idempotency, audit |
| External email/WhatsApp/SMS/social message | Draft only | Exact recipient, consent, preview and approval |
| Publish/deploy public change | Prepare only | Authorized human approval and release gate |
| Payment/transfer/refund/credit/debt | Never autonomous | Explicit authorized human approval |
| Contract/legal/ownership/IP change | Never autonomous | Rights-holder/legal approval and executed evidence |
| Delete data/destructive migration | Never autonomous | Explicit approval, backup and recovery plan |
| Role/secret/security-policy change | Never autonomous | Owner/admin approval, audit and rollback |

Approval must bind the exact action, target, amount/content, account and time window. General instructions are not blanket approval.

## 9. Security, privacy and reliability

- Least privilege and server-side authorization on every route and background task.
- Typed validation; reject unknown/oversized payloads.
- Protect against IDOR, SSRF, injection, replay, duplicate execution and cross-tenant leakage.
- Never commit secrets or expose them to agents; redact credentials and personal data from logs.
- Keep R2 private; issue scoped, expiring access only after authorization.
- Log security-relevant reads and all writes/side effects with correlation IDs.
- Define retention, export, correction and deletion workflows; do not claim automated deletion until tested.
- Treat provider/web content as untrusted data, never as instructions that override system policy.
- Maintain incident response, backup and restore evidence.

## 10. Engineering and Definition of Done

For every behavior change: add a failing test first; implement the smallest safe change; run targeted and full tests, typecheck, lint, build, diff check and security/dependency audit; add tenant/venture negative tests; review migration/rollback, permissions, failure modes, costs and logs.

Definition of Done requires implementation, tests, security review, migration/rollback evidence, documentation, observability, cost/terms review and explicit environment verification. A green local build is not production verification.

## 11. Last known audit baseline (2026-11-25; re-check before acting)

- Repository: Sparkmind-obp-off/Maelvyn, branch main.
- Last audited main SHA: d23ee559cb7d10fa571385ebda753eafb39ad024.
- Production source SHA recorded: 71c07eac092e52274ace4d97dbb593f8c552792b.
- At that audit main was 14 commits ahead; latest main changes were not proven deployed.
- Latest main checks reported 105 tests across 11 files; typecheck, lint and build passed.
- Production status: DEPLOYED / PARTIALLY VERIFIED, not Production Verified.
- Existing Cloudflare Pages project: maelvyn-production.
- Deployment report recorded public readiness 200 and unauthenticated protected routes 401.
- Remaining verification included real sign-in/JWT, owner bootstrap/claim, authenticated role/tenant E2E, R2 authenticated upload/download/delete and backup/restore.
- MAELVYN Connect is read-only-by-default for registry reads and pending status proposals; no external ChatGPT/MCP connection was configured or verified.
- Local MCP bridge exists, but that does not establish external ChatGPT connectivity.
- Product catalog exists; marketplace transactions/fulfillment are not proven.
- Provider binding register is discovery-only; listed providers are unbound unless runtime evidence proves otherwise.
- Capability inventory has stale status relative to newer production notes and must be reconciled.

These are historical reference values, not current assertions. Query GitHub and the live environment before acting.

## 12. Document authority

- This document defines technical platform intent.
- MASTER-SYSTEM.md remains authoritative for venture rights, participation, ownership and governance.
- Supporting architecture, provider, product and backlog documents may elaborate but may not weaken these safeguards.
- Changes to identity, tenancy, security, financial authority, ownership or approvals require owner review.
- Material updates require version, date, rationale, evidence and affected components.


## 13. End-to-end implementation mandate

The implementation roadmap is one continuous P0–P5 delivery objective, not a sequence that may be abandoned after an early phase. Execute all safe, dependency-ready work through Product Marketplace and Agentic Workforce. P0 remains the production release gate; a blocked production-only verification item must not halt independent development and testing in P1–P5. Where live provider accounts, credentials, approvals or paid infrastructure are unavailable, build and test the internal capability using clearly labelled fakes or test adapters, keep the real provider UNBOUND, and report the exact limitation. Never weaken security, commercial terms, tenant isolation, approval policy or cost restrictions to claim completion. Implementation status and production-release status must always be reported separately.
