# MAELVYN — Technology & Provider Stack Strategy

**Version:** 1.0  
**Status:** Proposed baseline; proof-of-fit required

## Stack principles
Small coherent stack, portable domain rules, managed bindings where practical, no paid provider without a concrete need and cost owner, isolated environments, minimal data sharing, and documented exit paths.

## Proposed reference stack
| Layer | Candidate | Purpose | Status |
|---|---|---|---|
| Frontend | React + TypeScript + Vite | Responsive workspace | Proposed |
| Routing/data | React Router or TanStack Router; choose one | Navigation and data fetching | Evaluate |
| Styling | Tailwind + accessible primitives | Design system | Proposed |
| API | Cloudflare Workers + Hono | Server-side domain/API | Proposed |
| Validation | Zod | Runtime schemas | Proposed |
| Database | Cloudflare D1 / SQLite | Structured source of truth | Proposed; test constraints |
| SQL access | Typed SQL; Drizzle optional | Queries/migrations | Keep finance SQL explicit |
| Private files | Cloudflare R2 | Agreements, receipts, evidence | Later gate |
| Async jobs | Cloudflare Queues | Retryable processing | P1 |
| Durable orchestration | Cloudflare Workflows | Long-running flows | P2 |
| Cache/rate limit | KV or platform controls | Non-authoritative data | Optional |
| Realtime coordination | Durable Objects | Shared state/coordination | Not MVP |
| Observability | Workers observability + structured logs | Errors, traces, metrics | Required |
| CI/CD | GitHub + Cloudflare | Review, test, deploy | Proposed |
| Tests | Vitest + integration + Playwright | Quality gates | Proposed |
| Identity | Replaceable provider adapter | Authentication and mapping | Not selected |

Cloudflare documentation:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/workers/observability/

## Identity provider decision
Run a proof-of-fit for invitation-only onboarding, Google sign-in/recovery, session revocation, MFA/passkeys, workspace mapping, export/deletion, low-user pricing, Workers compatibility, and support. Evaluate Clerk, Better Auth, or another provider with verified compatibility. MAELVYN keeps Person, IdentityLink, Membership, and RoleGrant records; identity provider is not authorization source of truth. Do not copy another project's auth configuration without review.

## Cloudflare resource boundaries
- Workers: runtime and API; all domain decisions server-side.
- D1: structured source of truth; never browser-accessible.
- R2: private object storage; metadata, hash, scope, retention in D1; short-lived authorized access.
- Queues: idempotent asynchronous notifications and processing.
- Workflows: later durable multi-step tasks with retries and human checkpoints.
- KV: cache/flags/rate-limit support only; never ownership, approval, or ledger truth.
- Durable Objects: defer until a real coordination/realtime requirement exists.

## External provider policy
Every integration needs business purpose, owner, minimum scopes, billing owner, encrypted credentials, limits/retries/idempotency, audit for writes/exports, terms/retention review, manual fallback, and disconnect procedure. Payment, accounting, e-signature, email marketing, analytics, and AI integrations remain optional until core workflows are stable and explicitly approved.

## Data architecture
Domain services own business rules. Repositories own SQL. Migrations are versioned. Use integer IDR amounts and explicit currency codes, UTC timestamps, immutable journal posting and reversal, append-only audit events, idempotency, and optimistic concurrency. Public content is separate from private workspace data.

## Environment strategy
Local uses synthetic data and local emulation. Development uses isolated resources and test identities. Staging is production-like but avoids real participant data unless approved. Production has separate DB, buckets, secrets, access, backups, alerts, and release approval. Preview deployments never write to production.

## Cost and vendor control
Maintain a provider registry with purpose, owner, verified plan limits, paid triggers, expected usage, budget cap, data classes, credentials/scopes, fallback, exit plan, and review date. Never claim a stack is free or unlimited; verify current pricing and limits before enabling production resources.

## Architecture decision records
Store material choices in docs/decisions with context, options, decision, consequences, cost, and review trigger.

## Agentic provider and runtime strategy

### Preferred platform composition
| Concern | Preferred option | Status / decision rule |
|---|---|---|
| API and policy gateway | Cloudflare Workers + Hono | Preferred foundation |
| Canonical business data | Cloudflare D1 | Preferred; versioned migrations |
| Private files/artifacts | Cloudflare R2 | Use when private artifact delivery is required and enabled |
| Independent background jobs | Cloudflare Queues | Use for decoupled jobs; assume at-least-once delivery and enforce idempotency |
| Durable multi-step orchestration | Cloudflare Workflows | Preferred for checkpoints, retries, schedules, and human approval waits |
| Stateful agent/session runtime | Cloudflare Agents SDK + Durable Objects | Candidate only; validate with a small proof of concept before adoption |
| Model inference | Provider-neutral model adapter | Choose by quality, data terms, latency, cost, and fallback; no model vendor lock-in |
| Research/search | Existing approved Tavily / Firecrawl / Apify / Scrape.ly connectors | Route by task and actual access/quota; do not add overlapping tools without measured benefit |
| Identity | Provider-neutral adapter; Clerk or Better Auth candidates | No final choice until auth requirements and test results |
| Email/payment | Add adapters only when a real workflow and compliance need exist | Not required for the first agent runtime proof of concept |

### Provider registry requirements
Track provider, capability, purpose, enabled status, quota/limits, cost model, commercial/data terms, credential reference, last health check, fallback policy, and allowed ventures/tasks. Suggested states: Available, Limited, Exhausted, Disabled, Review Required, Fallback Active. Store no raw secrets in registry records.

### Routing policy
1. Prefer a currently approved and available provider already connected.
2. Select the least costly provider that meets the task's quality, freshness, and data requirements.
3. Check quota and cost ceiling before every call.
4. Use a fallback only if it is explicitly approved for that capability and data class.
5. Record provider, model, usage, estimated/actual cost, source URLs, and outcome.
6. If quota, terms, or cost is unknown, stop before paid execution and request review.

### Explicit exclusions from the initial build
No provider proliferation, no paid scraping actors by default, no automatic model marketplace routing, no multi-cloud runtime, no external vector database until retrieval volume proves D1/R2 insufficient, and no payment/custody integration in the agent runtime MVP.

The Cloudflare Agents SDK documentation describes stateful Agents on Durable Objects and integration with Workflows for durable execution and human-in-the-loop approvals. These capabilities justify a proof of concept, not an unconditional production commitment. References: [Cloudflare Agents](https://developers.cloudflare.com/agents/), [Agents + Workflows](https://developers.cloudflare.com/agents/concepts/workflows), [Human-in-the-loop](https://developers.cloudflare.com/agents/concepts/agentic-patterns/human-in-the-loop), [Durable Agents with Workflows](https://developers.cloudflare.com/workflows/get-started/durable-agents).
