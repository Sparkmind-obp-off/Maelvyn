# MAELVYN — Final Initial Stack Decision

**Version:** 1.0.0  
**Decision status:** Approved architectural baseline; provider activation remains gated  
**Date:** 2026-11-17  
**Scope:** Development foundation and future production path

## 1. Decision summary

MAELVYN adopts a Cloudflare-first, provider-neutral architecture. The stack below is the canonical initial implementation target. "Required" means the system must provide a supported adapter, configuration surface, and policy controls for the capability. It does not mean every external API must be called on every task or that a paid plan is approved.

| Layer | Selected technology | Decision |
|---|---|---|
| Web UI | React + TypeScript + Vite | Required |
| UI styling | Tailwind CSS + accessible component primitives | Required |
| API/runtime | Cloudflare Workers + Hono | Required |
| Validation/contracts | Zod + shared TypeScript contracts | Required |
| Primary database | Cloudflare D1 (SQLite) | Required |
| Private object storage | Cloudflare R2 | Required adapter; enable when account/resource is ready |
| Background jobs | Cloudflare Queues | Required capability; introduce for asynchronous tasks |
| Durable workflows | Cloudflare Workflows | Required capability; introduce for resumable multi-step tasks and human checkpoints |
| AI inference | Cloudflare Workers AI adapter | Required first-party inference route; model availability/limits must be checked at runtime |
| Identity | Clerk | Selected identity provider |
| Research/search | Tavily adapter | Required provider adapter |
| Web crawling/extraction | Firecrawl adapter | Required provider adapter |
| Web data extraction/automation | Apify adapter | Required provider adapter |
| Alternative actor/extraction provider | Scrape.ly adapter | Required provider adapter |
| Tests | Vitest; integration tests; Playwright for browser journeys | Required |
| Source control/CI | GitHub | Required |
| Deployment | Cloudflare Pages/Workers | Required, environment-separated |
| Observability | Cloudflare Workers Logs/metrics; structured application audit | Required |

No other agent framework (LangGraph, CrewAI, Mastra, OpenAI Agents SDK, Google ADK) is adopted in the first implementation. MAELVYN owns its canonical task, policy, permission, provider, and audit contracts. Framework adoption requires a separate ADR and proof-of-fit.

## 2. Clerk environment decision

Clerk is the selected identity provider. Use two distinct operational phases:

### Development now
- Use Clerk Development instance only for local/development testing.
- Use synthetic test identities and synthetic data.
- Keep Clerk development publishable/secret keys in local .dev.vars or Cloudflare development secrets; never commit them.
- Restrict development to non-production resources and non-real participant/financial data.
- The development instance is not a temporary production substitute.

### Production later
Production activation is blocked until MAELVYN owns and controls its intended domain and completes the production readiness checklist. Then:
1. Create/activate Clerk Production instance.
2. Configure the owned domain and Clerk-required DNS records.
3. Supply dedicated OAuth credentials (including Google, if enabled).
4. Configure production webhook endpoint and signing secret.
5. Use production keys only in Cloudflare production secrets.
6. Configure authorized parties, redirect URLs, session settings, MFA/passkeys policy, and account recovery.
7. Run end-to-end auth, authorization, session revocation, and tenant-isolation tests.
8. Deploy only after a human release approval.

Do not use Clerk Development for real users, public launch, production financial records, or sensitive production documents. Clerk currently provides Development and Production instances; if a separate long-lived staging environment is needed, use a separate Clerk application rather than treating Development as staging.

## 3. Environment matrix

| Environment | Identity | Cloudflare resources | Data |
|---|---|---|---|
| Local | Clerk Development | Wrangler local/dev bindings | Synthetic fixtures only |
| Development | Clerk Development | Dedicated dev Worker + D1 + optional dev R2 | Synthetic test data |
| Staging (later, if needed) | Separate Clerk application configured for staging | Separate staging Worker/D1/R2/secrets | Synthetic or explicitly approved scrubbed data |
| Production (blocked until domain) | Clerk Production | Separate production Worker/D1/R2/secrets/queues/workflows | Real data only after privacy/security/release gates |

Never reuse D1 databases, R2 buckets, queue names, secrets, or Clerk keys across environments.

## 4. Provider responsibilities and routing

### Tavily
Primary structured web search/research provider. Use for fresh search discovery, query expansion, and evidence collection. Persist source URL, title, retrieval timestamp, provider, query, and evidence classification. Do not treat search snippets as verified facts.

### Firecrawl
Primary web page retrieval, crawl, and structured extraction adapter. Use after discovery when full page content or site-level extraction is needed. Respect robots, site terms, rate limits, and provider/site restrictions. Avoid crawling the same URLs repeatedly; cache permissible results and record provenance.

### Apify
Actor-based extraction and automation adapter. Use only when a specific Actor solves a demonstrated task and its pricing model, data access, terms, and input/output schema are reviewed. Each Actor is a separate execution profile with explicit limits. Paid Actors and high-volume runs remain disabled unless an authorized human approves a specific budget.

### Scrape.ly
Alternative actor/scraping adapter and fallback candidate. It must not be called automatically merely because Apify or Firecrawl fails. Fallback is permitted only if the task, source, data class, terms, and budget have been approved for Scrape.ly. Avoid duplicate runs across providers.

### Cloudflare Workers AI
First-party inference adapter for supported tasks/models. Maintain a model capability registry and check model availability, limits, input constraints, data handling, and actual account billing before each execution. Workers AI is not assumed to be a universal substitute for every frontier model or media-generation service. If a model is unavailable or quality is insufficient, stop or request an approved fallback; do not silently route to paid inference.

### Clerk
Authentication and identity lifecycle only. MAELVYN's own database remains authoritative for workspace membership, venture roles, grants, and authorization. A valid Clerk session does not by itself grant access to a venture.

## 5. Canonical provider adapter contract

Every adapter must implement a common interface conceptually equivalent to:

- providerId
- capabilities[]
- healthCheck()
- estimate(input, policyContext)
- execute(input, policyContext, idempotencyKey)
- normalizeResult(rawResult)
- usage(result)
- classifyError(error)
- cancel?(executionId)
- closeOrDisable()

Every execution records:
- provider and capability;
- model/Actor/version where applicable;
- task and venture scope;
- data classification and allowed purpose;
- input/output schema version;
- request and idempotency IDs;
- quota snapshot and estimated/actual cost where available;
- timestamps, duration, status, retry count;
- source provenance and artifact references;
- policy decision and approval reference.

Never put raw API keys in D1, logs, prompt context, GitHub, browser bundles, or audit payloads. Store secrets in Cloudflare secrets and only store a secret reference/identifier in provider configuration.

## 6. Routing order

The orchestrator must:
1. Determine task capability and data classification.
2. Check registered provider state, account connection, and credentials.
3. Check current quota, estimated cost, budget ceiling, and rate limits.
4. Check terms, allowed purpose, retention, and source restrictions.
5. Select the least costly approved provider that meets quality/freshness requirements.
6. Execute once with idempotency and bounded timeout.
7. Verify output schema and provenance.
8. Record usage and outcome.
9. Use fallback only when explicitly configured for the same capability and data class.
10. Stop and request approval if the only viable path is unapproved or paid.

Provider states: UNVERIFIED, AVAILABLE, LIMITED, EXHAUSTED, DISABLED, REVIEW_REQUIRED, FALLBACK_ACTIVE, ERROR.

## 7. Spend and quota controls

- Default paid execution policy: disabled.
- Every task, agent, and provider has per-run and daily/monthly caps.
- Free quota is still a scarce resource and must be metered.
- A provider with unknown price, unknown billing behavior, or unknown quota is UNVERIFIED and cannot execute.
- Never automatically upgrade plans, add credits, enable billing, or incur charges.
- Stop on quota exhaustion; do not bypass it through another provider unless fallback is explicitly approved.
- Use circuit breakers and concurrency caps to avoid runaway loops.
- Scraping must have deduplication, page/run limits, timeouts, and an explicit source allowlist/denylist.

## 8. Required implementation modules

1. identity/ — Clerk verification adapter and MAELVYN identity mapping.
2. authorization/ — workspace/venture-scoped policy engine; deny by default.
3. agents/ — agent registry, versions, roles, autonomy, kill switches.
4. tasks/ — task contracts, states, dependencies, checkpoints, idempotency.
5. providers/ — provider registry and adapters for Workers AI, Tavily, Firecrawl, Apify, Scrape.ly.
6. approvals/ — reserved-action approval lifecycle.
7. memory/ — scoped evidence/memory retrieval; enforce permissions before retrieval.
8. audit/ — append-only event trail and correlation IDs.
9. budgets/ — provider and agent usage ceilings.
10. artifacts/ — R2 private artifacts and metadata.
11. workflows/ — durable orchestration and human wait states.
12. observability/ — structured logs, traces, metrics, redaction, alerting.

## 9. Adoption and release gates

The adapters and contracts are part of the target stack. Real provider calls are enabled one at a time only after:
- provider account and credentials are confirmed;
- current official pricing/limits/terms are recorded;
- data class and allowed use are approved;
- budget and rate limits are configured;
- integration tests pass with synthetic data;
- failure/fallback behavior is tested;
- disable and credential-rotation procedure exists.

Production release additionally requires domain ownership, Clerk Production, production Cloudflare resources, privacy/terms review, backup/restore test, incident response, access review, and explicit release approval.

## 10. Official references

- Clerk environments: https://clerk.com/docs/guides/development/managing-environments
- Clerk production deployment: https://clerk.com/docs/guides/development/deployment/production
- Cloudflare Workers AI limits: https://developers.cloudflare.com/workers-ai/platform/limits/
- Apify Actors and compute: https://docs.apify.com/actors/running/usage-and-resources/compute-units
- Apify pricing: https://apify.com/pricing
- Tavily pricing: https://www.tavily.com/pricing
- Scrape.ly pricing: https://scrape.ly/pricing

Pricing and quotas change. Re-check official sources on the date an integration is enabled.
