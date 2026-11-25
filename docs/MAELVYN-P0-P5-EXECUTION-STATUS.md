# MAELVYN — P0–P5 execution status

Snapshot: 2026-11-25. Baseline `452be02d8980d4c01b57cae2e7e2abf72101587e` on `Sparkmind-obp-off/Maelvyn/main` (22 commits ahead of production before this patch). This is an execution evidence supplement to the canonical backlog, not an amendment to the master system. `PARTIAL` never implies operational status. Tests under `tests/` use synthetic data/JWTs or contract fakes; none establish a production provider binding.

| ID | Status | Implementation and evidence | Remaining acceptance dependency |
|---|---|---|---|
| P0-01 | DONE-VERIFIED | Fetched and fast-forwarded `main`; Cloudflare deployment list confirmed active ID `356aa389-dfe3-4438-a6ed-8f5a7c0f668f`, source `71c07ea` (`71c07eac092e52274ace4d97dbb593f8c552792b` in existing release evidence); reviewed diff | Recheck immediately before release; parity not achieved |
| P0-02 | BLOCKED | `server/identity/clerk.ts`, `tests/production-gates.test.ts`; previous production evidence in verification report §10 | Rotate exposed key; confirm intended `azp` origins and audience policy; real Google sign-in/profile/session evidence |
| P0-03 | BLOCKED | `tests/identity.test.ts` and `server/platform/routes.ts`; no production claim performed | Owner personally completes or verifies binding and rehearses recovery |
| P0-04 | PARTIAL | `tests/auth.test.ts`, `tests/members.test.ts`, new negative API tests in `tests/research.test.ts` and `tests/modules.test.ts` | Authorized production test accounts and fixtures |
| P0-05 | PARTIAL | `tests/artifacts.test.ts`: private artifact route and delivery token behavior locally | Authorized synthetic R2 production round-trip |
| P0-06 | PARTIAL | Isolated SQLite fixture restored from migrations 0001–0010; applied 0011–0012 on restored copy and checked integrity, foreign keys and unchanged seed counts | Production D1 backup/isolated restore approval and measured cloud RPO/RTO; local result is not D1 production evidence |
| P0-07 | PARTIAL | Public `/api/v1/health` returned production OK; earlier anonymous smoke in verification report §10 | Authenticated smoke and controlled production error/rate-limit cases |
| P0-08 | PARTIAL | Honest gap/status documentation; no dedicated approved legal pages verified | Owner/legal review and published policies/consent evidence |
| P0-09 | DONE-VERIFIED | This report and [production verification](MAELVYN-PRODUCTION-DEPLOYMENT-VERIFICATION.md) record unresolved gates | No release authorization inferred |
| P1-01 | PARTIAL | `server/providers/types.ts`, `server/research/agent.ts`: typed research/search/extract and report profiles | Versioned generic capability/effect/timeout contracts |
| P1-02 | BLOCKED | Existing adapters in `server/providers/`; no provider promoted | Evidence of account ownership, environments, terms, quotas and approved bindings |
| P1-03 | PARTIAL | `server/providers/router.ts`, `server/research/agent.ts`: scoped research routing and atomic admission | Gateway must own adapter dispatch and other calls including health, and integrate account routing |
| P1-04 | PARTIAL | `migrations/0011_provider_call_reservations.sql`, `tests/research.test.ts`: concurrent daily research call admits once; unknown/nonpositive cost estimate refused, reported actual stays unknown for external provider | Unified provider/account/platform budgets and billing reconciliation |
| P1-05 | PARTIAL | `server/governance/engine.ts`, `tests/modules.test.ts`: core human governance remains | Exact payload/account-bound, expiring, single-use external-effect grants |
| P1-06 | PARTIAL | `server/research/agent.ts`, `tests/research.test.ts`: research replay, audit, budget and reservation correlation | Cross-capability idempotency and audit for external writes |
| P1-07 | PARTIAL | Existing persisted `tasks` and `task_executions` in migration 0002 | Durable queued runner, checkpointed recovery, retry and cancellation |
| P1-08 | PARTIAL | Existing `server/authorization/killswitch.ts`; research rechecks agent/provider gating before reservations | Provider health admission, in-flight cancellation and usage operations |
| P1-09 | PARTIAL | `connect/`, `server/connect/routes.ts`, `tests/connect.test.ts`: local, read-only-by-default bridge and scoped proposals | No external MCP session verified or activated |
| P2-01 | PARTIAL | `server/providers/types.ts` and contract-fake provider tests | Capability-neutral fetch/extract enforcement for all providers |
| P2-02 | PARTIAL | `migrations/0012_work_context_and_evidence.sql`, `tests/research.test.ts`: normalized URL, provider, retrieval time and SHA-256 of sanitized title/text for new evidence | Freshness/revalidation policy; legacy digests remain null |
| P2-03 | PARTIAL | `server/research/agent.ts`: source URL dedup (fragments ignored, query preserved) | Company identity/aliases, registry match and conflicts |
| P2-04 | PARTIAL | SIGNAL draft profile through existing venture UI and research API; synthetic-only fixture and explicit unknowns | Verified market data and pilot output |
| P2-05 | PARTIAL | LEADINTEL company-only synthetic profile, no outbound actions; explicit refusal of live profile | Verified company sources/dataset and organization-level qualification |
| P2-06 | PARTIAL | Research usage persists estimated credits with provider/task/workspace and date; actual external cost not inferred | Monetary costs, provider-side reconciliation and alerts |
| P2-07 | BLOCKED | Local regression/contract fakes in `tests/research.test.ts`; no pilot run | Consented pilot and verified binding/evidence evaluation |
| P3-01 | BLOCKED | No customer connection provisioned; no provider calls | Customer-owned OAuth grant, revocation and scopes |
| P3-02 | PARTIAL | Existing canonical customers; scoped work links in `server/operations/routes.ts` | Lead/company pipeline, ownership and history model |
| P3-03 | PARTIAL | UTC dated internal customer follow-up work items, persisted and scoped; `tests/modules.test.ts` | Timed dispatch/retry and deduplication; current queue is manual/internal only |
| P3-04 | NOT-STARTED | Internal follow-up title is not a message draft | Recipient, channel, purpose, consent and provenance workflow |
| P3-05 | BLOCKED | No external send path | Approved BYOC and exact-field, single-use approval gate |
| P3-06 | PARTIAL | `web/src/pages/VentureOps.tsx`: contextual work queue and existing customer records | Full pipeline, aging and outcomes dashboard |
| P4-R1 | PARTIAL | Internal content review links same-venture research artifact and due date | Channel/objective calendar and verified topics |
| P4-R2 | PARTIAL | Existing research artifacts and separate rights/asset records; work-item references tested | Content-specific brief/asset versions and rights validation |
| P4-R3 | PARTIAL | Internal review only; no publisher, provider call or publish event | Approval-bound publish queue and approved account |
| P4-R4 | NOT-STARTED | No ingestion or metrics displayed | Approved metrics source and attribution |
| P4-C1 | BLOCKED | Existing internal offers are not a connected catalog | Approved customer-owned read-only store and revocation |
| P4-C2 | PARTIAL | Existing scoped orders and catalog records; no store/inventory sync | Incremental idempotent sync and conflict handling |
| P4-C3 | PARTIAL | `server/finance/routes.ts` and `tests/modules.test.ts`: scoped caller-observation comparison by exact amount, currency and status; verification flag remains false | Verified source/reference binding and persisted exceptions |
| P4-C4 | PARTIAL | Internal fulfillment review and existing gross margin; tests show closing review does not alter order/payment | Fulfillment state and net fees/refunds reporting |
| P4-C5 | BLOCKED | No external payment/refund/cancel operation added | Verified binding plus explicit approval and provider confirmation |
| P5-A1 | PARTIAL | `server/app.ts` and migration 0002: existing agent registry/version visibility | Scoped agent ownership/lifecycle management |
| P5-A2 | PARTIAL | Research task contract and credit constraints only | Dependency graph and bounded delegation |
| P5-A3 | PARTIAL | Persisted existing lifecycle plus durable call reservation; ambiguous calls are not auto-retried | Durable resume/cancel/checkpoints and dead-letter handling |
| P5-A4 | PARTIAL | `GET /api/v1/ventures/:vid/execution-summary`: 30-day mode/status counts; `tests/research.test.ts` verifies local cross-tenant denial | Golden-task scoring and end-to-end tracing |
| P5-A5 | PARTIAL | Existing kill switches; checked on each research call | Runtime-wide cancellation, escalation and safe recovery |
| P5-M1 | PARTIAL | Existing `web/src/pages/Products.tsx` and internal offers in operations | Versioned entitlement packages with terms/dependencies |
| P5-M2 | NOT-STARTED | No grant/provisioning claimed | Canonical entitlement model, capacity authorization and package dependency |
| P5-M3 | PARTIAL | Internal offer pricing and research credit ledger are separate | Marketplace quota/usage billing and approved verified payment adapter |
| P5-M4 | PARTIAL | Internal order-linked fulfillment review, tested without changing order/payment | Delivery acceptance, support, refund and incident handling |
| P5-M5 | BLOCKED | No customer transaction, no checkout, no monitoring E2E | First complete P5-M1–M4; verify with approved customer/payment sandbox |

## Validation and release decision

- Baseline: `npm run check` passed 105 tests / 11 files. After changes: 111 tests / 11 files passed, plus typecheck, lint and web/Worker build. The Vite bundle-size warning is non-fatal. `npm audit --audit-level=moderate` reported 0 vulnerabilities; `git diff --check` passed. Both new migrations are required by `/api/v1/ready` after an approved rollout.
- Local restore fixture: 24 ms from snapshot restore through the two additive migrations, integrity check and foreign-key check; 6 seeded provider rows unchanged. This duration is not a Production RTO. No production database snapshot was read or restored.
- Rollback: leave the additive schema intact when rolling back the application; do not drop tables containing evidence. The previous Worker does not enforce the new pre-dispatch reservation; pause live research routing before that rollback. The preview comparison never issues a payment or posts a journal. Internal work completion only updates the work item and its audit trail.

Release decision: no deploy, DNS change, secret changes, production migration, new paid resource, outbound message, publication or external payment call. No candidate provider account ownership, cost limit, quota, retention or commercial terms was newly verified. [Provider register](EXTERNAL-PROVIDER-BINDING-REGISTER.md) is unchanged in binding state. Highest verified milestone: integrated local slices, not a completed P1–P5 phase or production release.
