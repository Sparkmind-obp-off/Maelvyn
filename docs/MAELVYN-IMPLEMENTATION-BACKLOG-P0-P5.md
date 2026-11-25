# MAELVYN — Full-Stack Implementation Backlog P0–P5

**Version:** 1.0.0  
**Status:** Mandatory end-to-end execution contract; not a completion claim  
**Parent:** [Agentic Platform Master System](MAELVYN-AGENTIC-PLATFORM-MASTER-SYSTEM.md)

## One-shot execution contract — mandatory

This backlog must be executed as one continuous end-to-end assignment from P0 through P5. It is not satisfied by a plan, audit, scaffold, P0-only fix, P1-only foundation or demo.

- Track every task ID individually with status, owner/commit and evidence.
- Complete phases in dependency order, but treat P0 as a production release gate rather than a blanket stop on development. If a production-only P0 check is blocked, continue independent P1–P5 work safely in local/test/preview environments.
- For unavailable accounts, credentials, approvals or paid infrastructure, implement the safe internal contract/workflow and automated tests with clearly labelled fakes; keep provider state UNBOUND and live functionality unavailable until real verification.
- Do not bypass approvals, provider terms, security, tenant isolation, or the no-spend rule to force completion.
- A blocked task does not excuse skipping unrelated tasks. Continue every independent task, then revisit blocked dependencies when possible.
- The final report must list every task ID from P0–P5, acceptance evidence, commit(s), test results and blockers. No phase may be called complete based on UI, mocks, stubs or documentation alone.
- The final milestone is the highest phase whose exit gate is fully evidenced. Report implementation completion and production-release readiness separately.
- “One-shot” means one uninterrupted autonomous engineering run and consolidated handoff; it is not blanket authorization for paid services, production side effects, public publishing, external messaging or live customer data changes.

## Status vocabulary

- DONE-VERIFIED — acceptance criteria pass with evidence.
- IN-PROGRESS — active work with owner and commit/branch.
- PARTIAL — some criteria pass; remainder listed.
- BLOCKED — external decision/access/permission/dependency required.
- NOT-STARTED — no implementation evidence.
- NOT-VERIFIED — implementation may exist but evidence is missing.

## P0 — Production verification and release safety

**Goal:** Establish whether production is authenticated, tenant-isolated, recoverable and in parity with the intended release.

| ID | Task | Acceptance criteria / evidence | Priority |
|---|---|---|---|
| P0-01 | Reconcile repository and production source | Current main SHA and deployed SHA captured; diff reviewed | Critical |
| P0-02 | Clerk sign-in and JWT | Real sign-in tested; server validates issuer, audience, expiry and signature; invalid/expired token denied | Critical |
| P0-03 | Owner bootstrap/claim | One-time claim, correct owner binding, replay denial, safe recovery and audit | Critical |
| P0-04 | RBAC and tenant/venture E2E | Authenticated allow/deny tests; IDOR and cross-tenant/cross-venture access denied | Critical |
| P0-05 | Private R2 round-trip | Authorized upload/download/delete succeeds; unauthorized access denied; scoped expiring URLs | Critical |
| P0-06 | D1 backup/restore | Backup verified; isolated restore succeeds; recovery procedure and RPO/RTO assumptions recorded | High |
| P0-07 | Production E2E/security smoke | Authenticated journey, protected endpoints, rate limits and error paths pass | High |
| P0-08 | Docs/legal reconciliation | Stale capability matrix reconciled; privacy/terms state accurately recorded | High |
| P0-09 | Release gate report | Evidence linked; blockers explicit; release state truthful | Critical |

**Exit gate:** No general public launch or Production Verified claim until critical P0 items pass. Successful deploy command or public HTTP 200 is insufficient.

## P1 — Execution foundation

**Goal:** Make MAELVYN the enforceable control plane for agents, tools and providers.

| ID | Task | Acceptance criteria / evidence | Priority |
|---|---|---|---|
| P1-01 | Capability contracts | Typed ID/version, schemas, effects, data class, scopes, budget, timeout, retry and evidence fields | Critical |
| P1-02 | Provider/account binding | Owner, environment, account reference, adapter, terms, quota, secret binding name and state | Critical |
| P1-03 | Gateway authorization | Server-side principal/scope resolution, allowlists, deny-by-default, no direct provider calls | Critical |
| P1-04 | Budget/quota guard | Per-run, tenant, provider and platform limits; fail closed when required cost is unknown | High |
| P1-05 | Human approval engine | Approval binds exact action, target, content/amount, account, approver and expiry; replay denied | Critical |
| P1-06 | Idempotency and audit | Duplicate writes prevented; correlation IDs; append-only side-effect audit with redaction | High |
| P1-07 | Durable task lifecycle | queued/running/waiting-approval/succeeded/failed/cancelled; checkpoints, retries, timeout and cancel | Critical |
| P1-08 | Health and kill switch | Provider health, disable switch, failure isolation and operational evidence | High |
| P1-09 | MCP boundary | Typed tool schemas, env-only credentials, explicit write opt-in/confirmation; no false connection claims | High |

**Exit gate:** A test provider executes a read-only operation through the gateway with correct scope, budget, provenance and audit. Writes remain denied without policy and approval.

## P2 — Intelligence products: SIGNAL + LEADINTEL

| ID | Task | Acceptance criteria / evidence | Priority |
|---|---|---|---|
| P2-01 | Search/fetch/extract contracts | Normalized provider-neutral APIs, schema validation, bounded payloads | High |
| P2-02 | Source/evidence registry | Source URL, retrieval time, freshness, hash, provenance and data classification | Critical |
| P2-03 | Entity normalization | Company/domain identity, aliases, conflict resolution and deduplication | High |
| P2-04 | SIGNAL workflow | Market/category/competitor/pricing/trend/opportunity report with sources and unknowns | High |
| P2-05 | LEADINTEL workflow | Sourced company/prospect/partner research and qualification; no private inference or outreach | High |
| P2-06 | Usage/cost accounting | Per-report/tenant usage, quota warnings, budget enforcement and provider attribution | High |
| P2-07 | Product QA/pilot | Golden datasets, factuality/provenance review, error handling and pilot acceptance | High |

**Exit gate:** Pilot uses a verified binding, returns evidence, records usage/cost, enforces tenant boundaries and passes quality evaluation.

## P3 — Workflow product: FLOW

| ID | Task | Acceptance criteria / evidence | Priority |
|---|---|---|---|
| P3-01 | Customer BYOC | OAuth/account ownership and scopes explicit; revoke/disconnect works | High |
| P3-02 | CRM canonical model | Customer, lead, company, pipeline stage, activity, owner and history are tenant-scoped | High |
| P3-03 | Follow-up/scheduling | Durable queue, due dates, retries, timezone handling and idempotency | High |
| P3-04 | Message drafting | Draft includes recipient, channel, purpose, consent and provenance | High |
| P3-05 | Human send approval | Exact recipient/content/account preview; consent; audit and duplicate-send protection | Critical |
| P3-06 | FLOW dashboard | Pipeline, aging, follow-up queue and outcomes with tenant isolation | Medium |

**Exit gate:** CRM and follow-up work end-to-end in test; external send remains approval-gated and uses verified customer-owned connection.

## P4 — Content and commerce: REACH + COMMERCE

### REACH

| ID | Task | Acceptance criteria | Priority |
|---|---|---|---|
| P4-R1 | Content research/calendar | Evidence-backed topics, channel, objective, schedule and status | High |
| P4-R2 | Brief/asset pipeline | Versioned briefs/assets, rights and usage metadata, QA | High |
| P4-R3 | Review/publish queue | Human approval, account scope, retry and audit | Critical |
| P4-R4 | Performance ingestion | Source-backed metrics and attribution; no fabricated results | Medium |

### COMMERCE

| ID | Task | Acceptance criteria | Priority |
|---|---|---|---|
| P4-C1 | Store/catalog connection | BYOC, scoped read-only sync and revocation | High |
| P4-C2 | Orders/inventory | Idempotent sync, reconciliation and conflict handling | High |
| P4-C3 | Payment reconciliation | Provider reference, amount/currency/status matching and exception queue | Critical |
| P4-C4 | Fulfillment/margin | Status lifecycle, costs, fees, refunds and gross/net margin | High |
| P4-C5 | Sensitive commerce actions | Payment/refund/cancellation require explicit approval and provider confirmation | Critical |

**Exit gate:** Read-only commerce and draft publishing pass before live writes. All live writes remain human-approved.

## P5 — Agentic Workforce and Product Marketplace

### Agentic Workforce

| ID | Task | Acceptance criteria | Priority |
|---|---|---|---|
| P5-A1 | Agent registry | Versioned identity, owner, scopes, autonomy ceiling and lifecycle | High |
| P5-A2 | Orchestrator/delegation | Task contracts, dependency graph, bounded delegation and run budget | High |
| P5-A3 | Durable runtime | Checkpoints, retries, pause/resume/cancel, idempotency and dead-letter handling | Critical |
| P5-A4 | Evaluation/observability | Golden tasks, metrics, traces and audit evidence | High |
| P5-A5 | Kill switch/escalation | Owner can stop agent/provider/workspace execution and recover safely | Critical |

### Product Marketplace

| ID | Task | Acceptance criteria | Priority |
|---|---|---|---|
| P5-M1 | Product/package registry | Versioned offers, eligibility, terms, limits and dependencies | High |
| P5-M2 | Entitlement/provisioning | Customer entitlement maps to authorized workflow capacity and scope | Critical |
| P5-M3 | Billing/usage | Transparent pricing, quota, usage ledger and payment after approval | Critical |
| P5-M4 | Fulfillment lifecycle | Order, provision, delivery, acceptance, support, refund/incident handling | High |
| P5-M5 | Marketplace operations | Customer transaction and service monitoring proven end-to-end | High |

**Exit gate:** Marketplace is operational only when customers can activate/purchase an authorized offer, receive fulfillment, view usage/status and access support/refund paths. A static catalog is not enough.

## Cross-cutting acceptance gates

Every behavior change requires:
- Failing test before implementation.
- Targeted and full test results.
- Typecheck, lint, production build and diff check.
- Dependency/security audit.
- Tenant/venture negative tests.
- Migration and rollback evidence where relevant.
- Redacted logs and audit correlation.
- Cost/quota and commercial-terms review.
- Documentation and TODO update.

## Release runbook

1. Freeze scope and identify exact commit.
2. Verify branch head and working tree; inspect diffs.
3. Run install/lockfile validation, targeted/full tests, typecheck, lint, build and security audit.
4. Review migrations, backup and rollback.
5. Confirm production bindings by name and test without revealing values.
6. Confirm authorization for deployment and external side effects.
7. Deploy only to existing approved Cloudflare Pages project.
8. Record deployment ID, source SHA, timestamp, environment and smoke tests.
9. Verify auth, authorization, tenant isolation, R2 and critical journeys.
10. If a critical check fails, stop rollout and follow rollback/incident procedure.
11. Update production report and TODO only with observed evidence.

## Progress report template

~~~text
Date/time:
Repository / branch:
Base SHA -> current SHA:
Working tree:
Phase / task IDs:
Files changed:
Behavior changed or docs-only:
Acceptance criteria:
Tests and results:
Typecheck / lint / build:
Security/dependency audit:
Tenant isolation tests:
Provider/account binding evidence:
Cost/quota and terms:
Migration / rollback:
Deployment project / ID / source SHA:
Production smoke tests:
Blockers / approvals required:
Next action:
~~~
