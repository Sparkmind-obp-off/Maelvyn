# MAELVYN

**Agentic Shared Venture Studio OS**  
*Building Businesses. Creating Assets. Growing Together.*

MAELVYN is a governed, multi-agent operating system for discovering opportunities, validating demand, creating ventures, operating productive assets, and growing a portfolio through coordinated human and AI-agent work.

> **Participation by Choice. Ownership by Agreement.**

## What MAELVYN is

MAELVYN coordinates venture creation and shared economic operations. It is not, by default, a pooled wallet, investment fund, holding company, legal partnership, or automatic merger of existing businesses and assets.

Its operating model combines:

- **Shared Economic Core** — governance, permissions, strategy, financial controls, evidence, and portfolio coordination.
- **Active Venture Studio** — opportunity discovery, research, validation, chartering, building, launch, operations, and portfolio decisions.
- **Venture Portfolio** — independently scoped ventures and productive assets with their own operators, budgets, records, rights, liabilities, and risks.
- **Agentic OS** — specialist agents, orchestration, scoped memory, provider adapters, durable workflows, and auditable bounded execution.

Agents may research, plan, coordinate, prepare, and execute only within explicit technical permissions. Humans retain authority over ownership, rights, capital, money movement, legal commitments, and material risk. Cross-venture data access is denied by default.

## Foundational principles

1. Participation is voluntary, informed, and specific.
2. No contribution, investment, borrowing, or transfer without informed consent.
3. Personal assets and pre-existing ventures remain separate unless expressly agreed in writing.
4. Contribution is not automatically ownership; ownership follows executed agreements and required legal steps.
5. Every venture has its own scope, budget, records, risks, and approval rules.
6. Financial reporting distinguishes revenue, costs, liabilities, reserves, and distributable surplus.
7. AI autonomy is bounded; reserved legal, ownership, and financial decisions require authorized human approval.
8. Provider selection is modular, cost-aware, and subject to verified terms, quotas, and security review.

## Documentation

### Master control documents

| Document | Purpose |
|---|---|
| [Master System](docs/MASTER-SYSTEM.md) | Canonical operating constitution, rights, finance, lifecycle gates, North Star, and change control |
| [Master System Prompt](docs/MASTER-PROMPT.md) | Governing instructions for AI assistants, coding agents, researchers, and automation |
| [Agentic OS Architecture](docs/AGENTIC-OS-ARCHITECTURE.md) | Seven-layer multi-agent architecture, venture teams, orchestration, memory, autonomy, and rollout gates |
| [Agent Operating Constitution](docs/AGENT-OPERATING-CONSTITUTION.md) | Agent identity, permissions, reserved decisions, approvals, tool protocol, memory, and audit policy |

### Strategy and product

| Document | Purpose |
|---|---|
| [Master Blueprint & Operating Constitution](docs/MASTER-BLUEPRINT.md) | Vision, governance, rights, and safeguards |
| [North Star & Product Principles](docs/NORTH-STAR.md) | Product mission, North Star Metric, agentic outcome measures, users, and non-goals |
| [Product Requirements & MVP Scope](docs/PRODUCT-REQUIREMENTS.md) | Information architecture, features, states, acceptance criteria |
| [User Journeys & Service Blueprint](docs/CUSTOMER-JOURNEYS.md) | Participant, venture, finance, approval, and offboarding journeys |
| [UI/UX & Design System](docs/UX-UI-SYSTEM.md) | App shell, dashboard, module patterns, accessibility, content style |
| [Venture Operating Framework](docs/VENTURE-OPERATING-FRAMEWORK.md) | Venture lifecycle, portfolio model, and operating procedures |
| [90-Day Foundation Roadmap](docs/90-DAY-ROADMAP.md) | Staged, evidence-based foundation and agentic OS implementation plan |

### Engineering and operations

| Document | Purpose |
|---|---|
| [System Architecture](docs/SYSTEM-ARCHITECTURE.md) | Application boundaries, agent runtime, trust model, and security invariants |
| [Provider Stack Strategy](docs/PROVIDER-STACK-STRATEGY.md) | Provider-neutral stack, candidate runtimes, registry, quotas, cost controls, and fallback |
| [Full-Stack Implementation Blueprint](docs/FULL-STACK-IMPLEMENTATION.md) | Runtime, repository layout, agentic backend modules, tests, and build sequence |
| [Database Schema](docs/DATABASE-SCHEMA.md) | Initial relational domain model and data integrity rules |
| [API Contract](docs/API-CONTRACT.md) | MVP endpoints, approval states, permissions, and finance posting rules |
| [Security, Privacy & Operations](docs/SECURITY-PRIVACY-OPERATIONS.md) | Data classification, access, privacy, audit, incident, and backup controls |
| [Initial SQL Migration](migrations/0001_initial.sql) | D1/SQLite schema baseline; structure only, no participant or financial data |

## Authentication SDK upgrade\n\nThe browser client now targets Clerk Core 3 via `@clerk/react` (Node.js >=20.9.0). The previous `@clerk/clerk-react` Core 2 package was deprecated and used ClerkJS 5, which is blocked by Clerk's minimum-version protection on newer instances. See [Clerk Core 3 upgrade and verification](docs/CLERK-CORE-3-UPGRADE.md). The stale npm lockfile was removed and must be regenerated with `npm install` before the next clean CI/install; do not use `npm ci` until the generated lockfile is committed.\n\n## Current status

**Development foundation: implemented, tested, and deployed to a development environment.** MAELVYN is a working project identity and operating concept. This repository does not establish a legal entity, partnership, investment offer, ownership interest, or binding commitment by any person.

| Item | Status |
|---|---|
| Development URL | https://maelvyn-dev.pages.dev (Cloudflare Pages, user-owned account) |
| Identity | Clerk **Development** instance only. Synthetic data only. Clerk Production is **blocked** until domain ownership and release gates are met |
| Database | D1 `maelvyn-dev-db` (development). Migrations `0001`–`0003` applied |
| Production | **Not created and not deployed** |
| Costs incurred | None that were intentionally triggered. Health checks call free read-only endpoints only |

### What works today
- React + Vite + Tailwind web app with Clerk Development sign-in (Clerk Core 3, `@clerk/react`; browser-verified — see docs/CLERK-CORE-3-UPGRADE.md).
- Workspace membership lifecycle: single-use hashed invitation links, explicit acceptance by the invitee, role changes with reason, offboarding and voluntary leave (ends venture access), last-admin protection, full audit. Pages: workspaces, venture, research brief, providers & kill switches, agent registry, audit & usage.
- Hono API on a Cloudflare Pages Worker at `/api/v1`. Every response has a standard error shape, a `request_id`, and security headers. CSP follows Clerk's documented directives.
- Clerk session JWTs are verified on the server (RS256 via JWKS, issuer, expiry, `azp` allowlist). A valid session alone grants **no** access.
- Deny-by-default authorization, resolved from the database. Cross-venture access is denied and logged in `permission_decisions`.
- **Research Brief Agent (L2 Prepare):**
  1. Creates a task contract, enforcing idempotency and a credit budget.
  2. Routes to a provider, either synthetic mock or live Tavily. Live Tavily runs only when an admin enables it with credit caps.
  3. Optionally extracts the top source with Firecrawl.
  4. Stores evidence with provenance and flags prompt-injection attempts.
  5. Produces an extractive draft brief that separates source statements, agent inferences, and gaps. No LLM is used.
  6. Requires human accept/reject.
- Provider adapters for **Tavily, Firecrawl, Apify, Scrape.ly, Workers AI**, plus a mock. All live execution is off by default, with no automatic fallback between providers. Apify, Scrape.ly and Workers AI cannot be enabled until an Actor/model allowlist and budget are approved.
- Kill switches at system, workspace, agent and provider level. Database rate limits.
- Append-only audit, usage, executions and evidence. Reviewed briefs are immutable. All enforced by DB triggers.

### API (base `/api/v1`)
- **Public:** `GET /health`, `GET /ready`, `GET /config`
- **Session & workspaces:** `GET /session` · `GET|POST /workspaces` (self-service, dev only) · `GET /workspaces/:wid`
- **Members:** `GET /workspaces/:wid/members` · `POST /workspaces/:wid/invitations` · `POST /workspaces/:wid/invitations/:iid/revoke` · `POST /invitations/accept` · `PUT /workspaces/:wid/members/:pid` · `POST /workspaces/:wid/members/:pid/offboard`
- **Ventures:** `GET|POST /workspaces/:wid/ventures` · `GET /ventures/:vid`
- **Research:** `POST /ventures/:vid/research` (needs `Idempotency-Key` header) · `GET /research/:tid` · `POST /research/:tid/review`
- **Providers:** `GET /workspaces/:wid/providers` · `POST /workspaces/:wid/providers/:pid/health` · `PUT /workspaces/:wid/providers/:pid`
- **Agents & controls:** `GET /agents` · `GET|PUT /workspaces/:wid/kill-switches`
- **Audit & usage:** `GET /workspaces/:wid/audit` · `GET /workspaces/:wid/usage`

### Not implemented yet
- Approval engine for reserved matters (charter/budget votes), finance journals, agreements/contributions/ownership registries.
- R2 artifacts, Queues and Workflows. Research currently runs synchronously within one request.
- Workers AI binding and model registry.
- Live Apify / Scrape.ly Actor runs. These need an approved Actor allowlist and budget.
- Playwright browser suite beyond the sign-in E2E (`npm run test:e2e`, runs against the dev deployment).
- Active GitHub CI: the workflow template is in `ops/github-workflows/`. Activating it requires `workflows` permission.

### Local development
```bash
cp .dev.vars.example .dev.vars          # fill with DEVELOPMENT credentials only (git-ignored)
npm ci
npm run check                           # typecheck + lint + 43 tests + build
npm run db:migrate:local
npm run build && pm2 start ecosystem.config.cjs   # http://localhost:3000
```
After the regenerated package-lock.json is committed and verified, use npm ci for reproducible installs. Tests run the real migrations against an in-memory SQLite D1 shim (`tests/d1shim.ts`). Deploy to dev: `npm run deploy:dev`. Secrets are set with `wrangler pages secret put` and are never committed.

Provider candidates are not claims of approved spend or production readiness.

No venture, shared account, pooled fund, or joint asset should be represented as active until the relevant participants have freely agreed and the necessary legal and operational steps are complete.

## Change control

Material changes to governance, ownership principles, capital rules, participant rights, agent permissions, provider selection, architecture, or security controls must be documented, versioned, and reviewed before implementation.


### Capability coverage and upgrade roadmap\n\n[Capability Inventory & Upgrade Roadmap](docs/CAPABILITY-INVENTORY-AND-UPGRADE-ROADMAP.md) is the canonical feature-gap register, target module map, P0-P6 implementation sequence and definition of done.\n\n### Final implementation baseline

| Document | Purpose |
|---|---|
| [Final Initial Stack Decision](docs/FINAL-STACK-DECISION.md) | Locked initial stack, Clerk environment policy, mandatory provider adapters, cost and release gates |
| [Genspark Master Implementation Prompt](docs/GENSPARK-MASTER-IMPLEMENTATION-PROMPT.md) | Copy-ready instruction for Genspark to inspect and implement the repository |
| [Implementation Foundation Plan](docs/IMPLEMENTATION-FOUNDATION-PLAN.md) | Staged build sequence and first milestone acceptance criteria |

The initial stack decision supersedes earlier provider-selection language where there is a conflict. Clerk is selected; Development is for synthetic development only, and Production remains blocked until the domain and release gates are ready.