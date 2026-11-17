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

## Capability register

| Domain | Required capability | Current status | Next deliverable |
|---|---|---|---|
| Identity | Clerk Dev sign-in, server JWT validation | IMPLEMENTED-VERIFIED (dev; browser E2E `npm run test:e2e`) | Sign-in UI journeys in Playwright CI once CI is enabled |
| Identity | Production Clerk, custom domain, OAuth hardening | BLOCKED | Domain ownership and release gate |
| Workspace | Workspace creation and membership | IMPLEMENTED-VERIFIED (migration 0003: hashed single-use invitations, explicit acceptance, role change, offboarding/leave, last-admin guard; 5 tests + live dev check) | Admin recovery procedure; invitation email (requires approval for external messages) |
| Venture | Venture registry and detail | IMPLEMENTED-PARTIAL | Charter, lifecycle gates, operator assignment, stage history |
| Governance | Decision register and authority source | NOT-IMPLEMENTED | Decision records, approver matrix, conflict declaration |
| Governance | Approval inbox and multi-party approvals | NOT-IMPLEMENTED | Versioned requests, quorum/threshold, expiry, reject/withdraw |
| Rights | Contribution classification | NOT-IMPLEMENTED | Service/loan/license/sale/asset-use/capital-contribution records |
| Rights | Agreement, ownership and IP registry | NOT-IMPLEMENTED | Executed agreement metadata, rights, scope, effective dates, restrictions |
| Finance | Budget proposal and approval | NOT-IMPLEMENTED | Venture budgets, line items, versioning, approval gates |
| Finance | Double-entry ledger | NOT-IMPLEMENTED | Balanced journals, immutable posting, reversal, reconciliation |
| Finance | Cashflow, liabilities, reserves, distribution readiness | NOT-IMPLEMENTED | Reports derived from posted ledger; distribution remains human-approved |
| Assets | Asset register and custody | NOT-IMPLEMENTED | Ownership, custodian, location, condition, maintenance, transfer history |
| Revenue | Offers, pricing, customers, sales pipeline | NOT-IMPLEMENTED | CRM-lite, order and invoice metadata, source-backed revenue |
| Venture ops | Milestones, tasks, projects and work queues | IMPLEMENTED-PARTIAL | General task center, owners, dependencies, due dates, blockers |
| Research | Research Brief Agent | IMPLEMENTED-PARTIAL | Multi-source evidence review, reusable research projects, exports |
| Research | Validation experiments | NOT-IMPLEMENTED | Hypothesis, experiment, sample, result, decision gate |
| Agents | Agent registry and autonomy labels | IMPLEMENTED-PARTIAL | Version lifecycle, owner, capability grants, eval suites, disable path |
| Orchestration | Durable multi-agent execution | FOUNDATION-ONLY / NOT-IMPLEMENTED | Task state machine, queue, workflow, checkpoints, retries, cancellation |
| Providers | Registry, controls, adapters and mocks | IMPLEMENTED-PARTIAL | Provider policy editor, current pricing/quota evidence, health history |
| Providers | Apify Actor / Scrape.ly task allowlists | NOT-AUTHORIZED | Human-approved Actor IDs, data scope, cost caps and test fixtures |
| Inference | Workers AI live binding and model registry | BLOCKED | Binding, approved model catalog, per-model limits, evals |
| Memory | Scoped knowledge and provenance | FOUNDATION-ONLY | Venture-scoped memory, retrieval authorization, retention/deletion |
| Documents | Private R2 artifacts and signed access | NOT-IMPLEMENTED | Private buckets, upload/download authorization, malware/type/size checks |
| Automation | Event triggers and integrations | NOT-IMPLEMENTED | Event registry, webhooks, schedules, retries, connector permissions |
| Notifications | In-app/email notification center | NOT-IMPLEMENTED | Approval/task/incident notifications; no external messages without approval |
| Analytics | Portfolio and venture dashboards | IMPLEMENTED-PARTIAL | EBAV, funnel, unit economics, risk and execution reliability |
| Security | Tenant/venture isolation, deny-by-default | IMPLEMENTED-VERIFIED for current tested routes | Expand negative tests to every new route and artifact |
| Security | Rate limits, kill switches, audit | IMPLEMENTED-PARTIAL | Central policy middleware, alerting, tamper evidence, retention |
| Privacy | Data export, deletion, retention, consent | NOT-IMPLEMENTED | Data inventory, export/delete workflows, retention schedule |
| Operations | Backups, restore, incident response | NOT-IMPLEMENTED | Automated backups, restore drill, incident runbook |
| Quality | Unit/integration tests | IMPLEMENTED-PARTIAL | Expand contract and domain test coverage |
| Quality | Playwright end-to-end suite | NOT-IMPLEMENTED | Auth, workspace, venture, research, approvals, permission denial |
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
