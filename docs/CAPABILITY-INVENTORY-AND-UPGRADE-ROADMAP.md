# MAELVYN — Capability Inventory, Gap Register & Upgrade Roadmap

**Version:** 1.0.0  
**Date:** 2026-11-17  
**Status:** Canonical implementation register; update statuses only from repository and environment evidence.

## Purpose

This document turns the MAELVYN Master System into an actionable product backlog. It distinguishes capabilities already present from partial foundations and missing modules. A UI page, table, adapter interface, or roadmap entry is not proof that a complete business capability works.

## Status vocabulary

- **IMPLEMENTED-VERIFIED** — code exists and relevant tests or live checks prove the behavior.
- **IMPLEMENTED-PARTIAL** — a narrow vertical slice exists; broader workflows are missing.
- **FOUNDATION-ONLY** — schema, interface, design, or placeholder exists; end-user capability is not complete.
- **NOT-IMPLEMENTED** — no usable implementation is verified.
- **BLOCKED** — implementation depends on a prerequisite, approval, credential, or resource.
- **NOT-AUTHORIZED** — intentionally disabled until explicit approval; not a defect.

## Current verified baseline

The development application has React/Vite/Tailwind, Clerk Development integration, Hono API, D1 migrations 0001/0002, workspace and venture pages, provider/kill-switch controls, agent registry, audit/usage views, and a synchronous Research Brief Agent. The research flow uses source provenance, prompt-injection flags, idempotency, credit limits, and human accept/reject. Provider adapters exist for Tavily, Firecrawl, Apify, Scrape.ly, Workers AI, and mocks; live usage is separately gated.

**Clerk Core 3 (2026-11-17):** lockfile regenerated, all checks green, dev deployment verified in a real browser (ClerkJS 6.43.0, ticket sign-in, sign-out, API JWT accept/tamper-reject). See docs/CLERK-CORE-3-UPGRADE.md. Clerk Development only; synthetic data only. Production remains blocked.

**P1–P3 + identity boundary (2026-11-18):**
- Migrations 0004–0008 were applied to remote dev D1.
- 63 tests pass. Typecheck, lint, and build are clean.
- Deployed via CF BYOK (`1da72d91`, alias https://maelvyn-dev.pages.dev).
- Live browser E2E with a synthetic Clerk user showed: `account_status=ACCOUNT_ONLY`, 0 memberships, `POST /workspaces` → 403, `GET /platform/accounts` → 403, owner claim → 403, tampered JWT → 401.

## Capability register

| Domain | Required capability | Current status | Next deliverable |
|---|---|---|---|
| Identity | Clerk Dev sign-in, server JWT validation | IMPLEMENTED-VERIFIED (dev; browser E2E `npm run test:e2e` incl. identity-boundary denials) | Playwright in CI once enabled |
| Identity | Production Clerk, custom domain, OAuth hardening | BLOCKED | Domain ownership and release gate |
| Workspace | Workspace creation and membership | IMPLEMENTED-VERIFIED (owner-only creation; email-bound invitations with reason/review date/owner authorization; explicit acceptance; legacy memberships reconciled by 0004; tests + live) | Owner recovery runbook |
| Venture | Venture registry and detail | IMPLEMENTED-VERIFIED (charter, lifecycle stage gates, stage history, proposed→accepted assignments) | Charter diff view |
| Governance | Decision register and authority source | IMPLEMENTED-VERIFIED (append-only decisions with authority snapshot; conflict declarations; access review) | Delegated authority matrix per workspace |
| Governance | Approval inbox and multi-party approvals | IMPLEMENTED-VERIFIED (7 request types, threshold, SoD, single-reject, expiry, withdraw, supersede-on-change) | Configurable thresholds per type |
| Rights | Contribution classification | IMPLEMENTED-VERIFIED (type + legal character; valuation method required; acceptance by approval; never creates ownership) | Contribution evidence attachments (needs R2) |
| Rights | Agreement, ownership and IP registry | IMPLEMENTED-VERIFIED (self-signature, execution approval, ownership needs executed agreement + ≥2 approvals, 100% cap, IP provenance) | Agreement document storage (needs R2) |
| Finance | Budget proposal and approval | IMPLEMENTED-VERIFIED (versioned, line items, locked once approved, budget control at posting) | Multi-line budget editor UI |
| Finance | Double-entry ledger | IMPLEMENTED-VERIFIED (balanced, single currency, maker-checker, idempotent posting, single reversal, reconciliation) | Period close |
| Finance | Cashflow, liabilities, reserves, distribution readiness | IMPLEMENTED-PARTIAL (report from posted ledger: cash, receivables, liabilities, equity, net result; distribution not automated) | Cashflow statement by period |
| Assets | Asset register and custody | IMPLEMENTED-VERIFIED (ownership basis, custodian, events append-only, disposal via approval) | Transfer workflow |
| Revenue | Offers, pricing, customers, sales pipeline | IMPLEMENTED-PARTIAL (customers, offers, orders, unit economics) | Pipeline stages, invoices |
| Venture ops | Milestones, tasks, projects and work queues | IMPLEMENTED-VERIFIED (milestones, work items, dependencies, blocked reasons, risks, reviews) | Cross-venture task center |
| Research | Research Brief Agent | IMPLEMENTED-PARTIAL | Multi-source evidence review, reusable research projects, exports |
| Research | Validation experiments | IMPLEMENTED-VERIFIED (hypothesis, metric, threshold, timebox, conclude → memory; counts as stage-gate evidence) | Experiment templates |
| Agents | Agent registry and autonomy labels | IMPLEMENTED-PARTIAL | Version lifecycle, owner, capability grants, eval suites, disable path |
| Orchestration | Durable multi-agent execution | FOUNDATION-ONLY / NOT-IMPLEMENTED | Task state machine, queue, workflow, checkpoints, retries, cancellation |
| Providers | Registry, controls, adapters and mocks | IMPLEMENTED-PARTIAL | Provider policy editor, current pricing/quota evidence, health history |
| Providers | Apify Actor / Scrape.ly task allowlists | NOT-AUTHORIZED | Human-approved Actor IDs, data scope, cost caps and test fixtures |
| Inference | Workers AI live binding and model registry | BLOCKED | Binding, approved model catalog, per-model limits, evals |
| Memory | Scoped knowledge and provenance | IMPLEMENTED-VERIFIED (venture-scoped, access log, retract not delete, synthetic briefs rejected, verified_decision only from register) | Retention schedule |
| Documents | Private R2 artifacts and signed access | BLOCKED (no R2 binding provisioned) | Provision bucket, then adapter |
| Automation | Event triggers and integrations | NOT-IMPLEMENTED | Event registry, webhooks, schedules, retries, connector permissions |
| Notifications | In-app/email notification center | IMPLEMENTED-PARTIAL (in-app only; external messages NOT-AUTHORIZED) | Digest preferences |
| Analytics | Portfolio and venture dashboards | IMPLEMENTED-VERIFIED (EBAV per MASTER-SYSTEM §10, by-stage, pending approvals, unit economics) | Trend history |
| Security | Tenant/venture isolation, deny-by-default | IMPLEMENTED-VERIFIED for current tested routes | Expand negative tests to every new route and artifact |
| Security | Rate limits, kill switches, audit | IMPLEMENTED-PARTIAL | Central policy middleware, alerting, tamper evidence, retention |
| Privacy | Data export, deletion, retention, consent | IMPLEMENTED-PARTIAL (self-scoped export; export/deletion/correction requests resolved by Owner) | Automated deletion with ledger/audit carve-outs |
| Operations | Backups, restore, incident response | IMPLEMENTED-PARTIAL (manual D1 export before each migration) | Scheduled backups, restore drill |
| Quality | Unit/integration tests | IMPLEMENTED-VERIFIED (63 tests across identity, members, research, providers, governance, finance, rights, ops, memory, portfolio, me) | Contract tests |
| Quality | Playwright end-to-end suite | IMPLEMENTED-PARTIAL (sign-in + identity-boundary denial against dev) | Approval and finance journeys |
| Delivery | GitHub CI | BLOCKED | Workflow permission; run CI locally until enabled |

## Target product modules

1. **Home & Portfolio Command Center** — EBAV, portfolio status, urgent approvals, spend and risk, operating health.
2. **Workspace & Membership** — workspace settings, invitations, member roles, access reviews and offboarding.
3. **Venture Studio** — opportunity pipeline, venture charter, stage gates, milestones, experiments and reviews.
4. **Governance & Approvals** — decision register, approval inbox, delegated authority, reserved matters and immutable decision history.
5. **Finance Core** — budget versions, approvals, double-entry journals, cashflow, liabilities, reserves, reconciliation and financial reports.
6. **Rights & Agreements** — contributors, contribution types, executed agreement metadata, ownership, licenses, IP and restrictions.
7. **Asset & Resource Registry** — asset ownership, custody, utilization, maintenance, inventory and transfer controls.
8. **Revenue & Commerce** — customer/lead records, offers, pricing, sales/order records, receivables and unit economics.
9. **Research & Intelligence** — research projects, source library, evidence grading, market/customer validation and decision briefs.
10. **Agentic Workbench** — agent catalog, task center, plans, delegated jobs, execution timeline, human checkpoints and evaluations.
11. **Provider Control Plane** — provider registry, capability map, credential references, quotas, verified price cards, allowlists, circuit breakers and kill switches.
12. **Knowledge & Memory** — scoped knowledge base, source provenance, versioning, retention and access log.
13. **Documents & Deliverables** — private artifact storage, versioned deliverables, secure share links and audit.
14. **Automation & Integrations** — event triggers, webhooks, schedules, connectors and durable workflows.
15. **Notifications & Collaboration** — task assignments, mentions, approval reminders, incidents and activity feed.
16. **Analytics & Reporting** — venture performance, EBAV, unit economics, portfolio exposure, provider spend and agent quality.
17. **Security & Administration** — roles, policy simulation, access review, audit export, incident handling and system health.

## Build order — dependency-aware

### P0 — Stabilize the existing development app

- Regenerate package-lock from package.json using Node >=20.9.
- Verify Clerk Core 3 React SDK compatibility and actual deployed ClerkJS version; do not guess based on package name.
- Run typecheck, lint, all tests and production build.
- Verify migration status and /ready.
- Deploy only to the existing development Pages project if build is green.
- Verify sign-in/sign-out, API valid/tampered/expired token behavior, cross-venture denial and no secrets in browser bundle.
- Preserve Clerk protections; never lower the minimum ClerkJS version to conceal an outdated bundle.

### P1 — Complete the operating control plane

- Workspace membership, invites, role grants, access review and offboarding.
- Venture charter and lifecycle stage gates.
- Approval engine with requester/approver separation, authority source, quorum/threshold, expiry, revocation and audit.
- Decision register and conflict-of-interest declarations.
- Policy simulation and explicit deny reasons.

### P2 — Financial and rights foundation

- Versioned venture budgets and approval workflow.
- Double-entry ledger with balanced journals, immutable posting and reversal corrections.
- Reconciliation and evidence attachments.
- Contribution classification, agreement metadata, ownership/IP register.
- Financial read models with no automatic distribution or money movement.

### P3 — Venture operations and assets

- Milestones, tasks, dependencies, owners, due dates and risk/blocker tracking.
- Asset register, custody, utilization, maintenance and transfer approval.
- Revenue/customer/order records and unit economics.
- Venture review, hold, scale, restructure and exit workflows.

### P4 — Agentic runtime and knowledge

- Durable task state machine and delegation policy.
- Cloudflare Queues and Workflows with checkpoint/resume, retries, dead-letter, cancellation and idempotency.
- Scoped memory/knowledge retrieval with pre-retrieval authorization.
- Research projects, validation experiments and evidence grading.
- Workers AI binding and model registry after explicit model/cost approval.

### P5 — Files, automation and reporting

- Private R2 artifact store and secure signed delivery.
- Webhook/event registry, schedules and integration permissions.
- Notification center.
- Portfolio/venture dashboards and exports.
- Backup/restore, incident, retention and data-subject workflows.

### P6 — Production readiness

- Owned domain, Clerk Production, production D1/R2/queues/workflows and isolated secrets.
- Privacy policy/terms reviewed and published.
- Security assessment, abuse/rate-limit tests, restore drill and incident response.
- Observability, alerting, cost budgets and operator runbooks.
- Explicit release approval.

## Architecture rules for every new feature

- Every entity is scoped to workspace and, where applicable, venture.
- Server policy checks precede data retrieval or mutation.
- All state transitions are validated on the server and recorded.
- Money uses integer minor units and explicit ISO currency; posted journals are immutable.
- Ownership/IP requires agreement evidence and effective dates.
- Human approval is a distinct state, not a boolean hidden in UI.
- Every external side effect has idempotency, timeout, bounded retry and verification.
- Every provider has independent enablement, cost/quota caps, data policy and kill switch.
- Agent delegation narrows permissions; never expands them.
- No secret in source, browser bundle, logs, prompts, D1, or exported audit.
- No real participant data in Development.
- No paid provider, resource, Actor or production operation without explicit approval.

## Definition of complete

A feature is complete only when all apply:
1. Product behavior and exclusions are specified.
2. Database migration and data constraints exist where needed.
3. Server API and authorization are implemented.
4. UI supports loading, empty, error, success and forbidden states.
5. Audit/observability and recovery paths exist.
6. Unit, integration and negative authorization tests pass.
7. Browser tests cover the critical user journey where applicable.
8. Documentation, environment variables and runbooks are updated.
9. No unapproved paid or production side effect occurred.

Update this register after each implementation batch with commit, test evidence and remaining blockers. Do not mark planned features as implemented.


## Account and administrator boundary (mandatory policy)

Only `sparkmind.support@gmail.com` is the platform administrator/Platform Owner. `elfares621@gmail.com` and `elmatador0197@gmail.com` are account-only identities, not workspace members, venture members or assigned functional roles by default. No auto-membership on signup/first login. Account identity, platform role, workspace membership and venture assignment must be separate. See [Platform Account & Administrator Boundary Policy](PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md). Add this invariant to P1 acceptance tests and reconcile existing development memberships before modifying records.


## Commerce capability extension

Add the following capabilities to the portfolio roadmap:
- Seller/legal-entity and rights registry.
- Product/offer/catalogue and storefront engine.
- Order, payment event, refund, and dispute lifecycle.
- Digital/service/subscription/physical fulfillment adapters.
- Venture ledger integration and provider reconciliation.
- Central marketplace discovery.
- Partner/affiliate attribution and commission reporting.
- Commerce agent support with approval gates.

Priority rule: one venture and one offer must complete a verified order-to-fulfillment-to-reconciliation cycle before multi-vendor marketplace, public partner onboarding, or autonomous commerce execution is prioritized.


---

## Status reconciliation against Production deployment evidence — 2026-11-24

The dated source of truth is `docs/MAELVYN-PRODUCTION-DEPLOYMENT-VERIFICATION.md` (2026-11-18). It supersedes older statements in this document that Production resources, Pages deployment, D1, or R2 do not exist.

| Capability | Latest recorded evidence | Correct status |
|---|---|---|
| Development app | Implemented and tested | IMPLEMENTED / TESTED |
| Production Pages | Live on `maelvyn-production.pages.dev` | VERIFIED LIVE (public surfaces only, 2026-11-18) |
| Production D1 | Read/write/read-back and migration ledger 0001–0009 checked | VERIFIED LIVE (2026-11-18) |
| Production private R2 | Bucket exists and is bound as `ARTIFACTS` | CONFIGURED; authenticated upload/download UNVERIFIED |
| Production Clerk | Production instance/configured issuer and publishable key; server secret missing in report | PARTIALLY CONFIGURED / BLOCKED |
| Authenticated sign-in and owner bootstrap | Not verified because secret was missing | BLOCKED / UNVERIFIED |
| Production payment execution | No verified payment provider execution | NOT IMPLEMENTED / UNVERIFIED |
| Workers AI inference/model registry | No verified live inference path | NOT IMPLEMENTED / UNVERIFIED |

Do not copy a status label from an older audit without checking the later dated evidence. Re-run live verification before treating any blocker as still open or resolved.
