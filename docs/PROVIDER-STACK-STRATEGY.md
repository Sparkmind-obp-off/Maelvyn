# MAELVYN — Agentic OS Technology & Provider Stack Strategy

**Version:** 2.0  
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


---

## Agentic provider and stack strategy

### Core rule
MAELVYN owns domain logic, canonical contracts, permissions, task records, audit, and portability. Providers are replaceable infrastructure capabilities. Do not let a framework or model provider become the source of truth for governance, venture records, ownership, finance, or permissions.

### Capability-based provider catalog
| Capability | Existing/proposed candidate | Additional candidates | Selection test |
|---|---|---|---|
| Agent runtime | Cloudflare Agents SDK + Durable Objects (evaluate) | LangGraph, Mastra, OpenAI Agents SDK, Google ADK, CrewAI | Durable state, handoffs, tool controls, testability, portability |
| Durable workflow | Cloudflare Workflows | Temporal, DBOS, Inngest | Resume, human wait, retries, replay, operating cost |
| Async queue | Cloudflare Queues | Managed queue service | Delivery guarantees, retries, dead-letter, concurrency |
| Model inference | Direct provider adapters | OpenRouter, LiteLLM, gateway alternatives | Quality, cost, latency, retention, availability, commercial terms |
| Search/research | Tavily, Firecrawl | Native search APIs, other research providers | Source quality, citation/provenance, quota, terms |
| Extraction/automation | Apify, Scrape.ly, Firecrawl | First-party APIs and manual review | Site terms, actor cost, data quality, reliability |
| Database | D1 | PostgreSQL/Neon | Query/transaction needs, scale, portability, cost |
| Object storage | R2 | S3-compatible storage | Private access, lifecycle, egress, portability |
| Identity | Provider-neutral adapter | Clerk, Better Auth | Session controls, recovery, MFA, Workers fit, pricing |
| Telemetry | Cloudflare observability | Sentry, OpenTelemetry-compatible stack | Correlation, retention, redaction, export |

### Provider registry and failover
Every provider capability must include a verified plan/price/quota source, last-checked date, owner, data policy, credential reference, limits, usage counters, budget cap, fallback, and disable path. The registry state must distinguish Available, Limited, Exhausted, Disabled, Review Required, Fallback Active, and Unverified.

Failover is capability-aware and policy-aware. A fallback must be approved for the same data classification and task purpose. Never silently route restricted data to another provider. Never turn a quota failure into unapproved paid usage.

### Cost-control rules
- Set per-task and per-agent caps before dispatch.
- Enforce daily/monthly provider budgets and concurrency limits.
- Estimate cost before execution; reconcile actual usage afterward.
- Stop, queue for later, or ask for approval when a cap is reached.
- Keep paid actors, scraping, model routes, storage, and messaging disabled until purpose and spend are approved.
- Do not describe free tiers as permanent or unlimited; re-check current provider terms before launch.

### Selection policy
Use the smallest stack that meets a demonstrated requirement. Prefer current Cloudflare-first infrastructure for the first prototype, but keep business logic and provider interfaces portable. Do not add every listed candidate. Each adoption requires a proof-of-concept, decision record, security/terms review, cost estimate, failure test, and exit plan.


---

## Final stack decision — canonical precedence

As of 2026-11-17, docs/FINAL-STACK-DECISION.md is the authoritative decision and supersedes any earlier candidate-only or "identity not selected" wording in this document.

- Identity provider: Clerk selected. Development instance now for synthetic local/development use only. Production instance later after domain ownership and full production setup.
- First-party inference: Cloudflare Workers AI adapter required for supported model tasks.
- Research/search: Tavily adapter required.
- Web retrieval/crawl: Firecrawl adapter required.
- Actor extraction: Apify adapter required.
- Alternative extraction: Scrape.ly adapter required.
- Runtime: Cloudflare Workers + Hono; D1; private R2; Queues; Workflows.
- Frontend: React + TypeScript + Vite.
- Validation: Zod.
- Tests: Vitest + integration tests + Playwright.
- Source/deployment: GitHub + Cloudflare.

All providers must have typed contracts, disabled/unconfigured states, mocks, cost/quota enforcement, provenance, and kill switches. Real provider calls are enabled selectively. No paid actor, API plan, billing, production deployment, or production identity activation is implied by this architecture decision.


## Commerce provider strategy

Register payment gateways, shipping providers, email/SMS services, analytics, AI providers, and marketplace connectors in the Provider Registry. Record capability, legal entity/account requirement, pricing, quotas, commercial-use terms, data handling, webhook support, SLA, fallback, and venture authorization.

Payment providers are adapters, not the source of legal authority or accounting truth. Verify webhook signatures, use idempotency keys, retain provider event IDs, and reconcile settlements. Never store raw card data. Do not enable live payment mode or payout/split-settlement functionality before merchant eligibility, contracts, fees, legal roles, and test evidence are verified.

Clerk Development and Production are separate identity environments. Use `docs/CLERK-PRODUCTION-RUNBOOK.md` for the production process.
