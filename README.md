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
| [Security, Privacy & Operations](docs/SECURITY-PRIVACY-OPERATIONS.md) | Data classification, access, privacy, audit, incident, and backup controls |\n| [Commerce OS Master Architecture](docs/COMMERCE-OS-MASTER-ARCHITECTURE.md) | Hybrid marketplace, independent storefronts, partner distribution, commerce modules, finance, and agentic controls |\n| [Legal Entity & Operating Model](docs/LEGAL-ENTITY-AND-OPERATING-MODEL.md) | Staged legal structure, operating-company boundaries, entity verification, and restructuring triggers |\n| [Domain & Environment Strategy](docs/DOMAIN-AND-ENVIRONMENT-STRATEGY.md) | Domain map, development/production isolation, DNS, Clerk, and Cloudflare release boundaries |\n| [Clerk Production Runbook](docs/CLERK-PRODUCTION-RUNBOOK.md) | MAELVYN-specific Clerk production prerequisites, provisioning, verification, and rollback |\n| [Production Readiness Checklist](docs/PRODUCTION-READINESS-CHECKLIST.md) | Evidence-based release gates for identity, infrastructure, security, finance, and commerce |\n| [Architecture Decision Register](docs/ARCHITECTURE-DECISIONS.md) | Versioned architecture decisions and unresolved implementation questions |
| [Initial SQL Migration](migrations/0001_initial.sql) | D1/SQLite schema baseline; structure only, no participant or financial data |

## Authentication SDK upgrade

The browser client now targets Clerk Core 3 via `@clerk/react` (Node.js >=20.9.0). The previous `@clerk/clerk-react` Core 2 package was deprecated and used ClerkJS 5, which is blocked by Clerk's minimum-version protection on newer instances. See [Clerk Core 3 upgrade and verification](docs/CLERK-CORE-3-UPGRADE.md). The stale npm lockfile was removed and must be regenerated with `npm install` before the next clean CI/install; do not use `npm ci` until the generated lockfile is committed.

## Current status

**Development foundation: implemented, tested, and deployed to a development environment.** MAELVYN is a working project identity and operating concept. This repository does not establish a legal entity, partnership, investment offer, ownership interest, or binding commitment by any person.

| Item | Status |
|---|---|
| Development URL | https://maelvyn-dev.pages.dev (Cloudflare Pages, user-owned account) |
| Identity | Clerk Development and Production instances exist. Production auth domain is verified; application deployment is still Development-configured and not production-ready |
| Database | D1 `maelvyn-dev-db` (development). Migrations `0001`–`0008` applied (remote, 2026-11-18; pre-migration export kept outside the repo) |
| Production | **Not created and not deployed** |
| Costs incurred | None that were intentionally triggered. Health checks call free read-only endpoints only |

### What works today
Verified by 63 automated tests (real migrations on an in-memory D1 shim), typecheck, lint, build, and a live browser E2E against the dev deployment.

- **Identity boundary (migration 0004).** A singleton `platform_owner` is bound to `sparkmind.support@gmail.com`. The claim re-reads the primary email from Clerk's Backend API, requires it to be verified, and stores the stable Clerk subject.
  - Signup and first login create an account only, with no membership.
  - `elfares621@gmail.com` and `elmatador0197@gmail.com` are `owner_authorization_required` (ACCOUNT_ONLY).
  - Only the Owner can create workspaces and administer members. `workspace_admin` is valid only for the bound Owner, checked again in policy as defence in depth.
  - Legacy memberships were reconciled. Remote: 3 suspended and 2 venture assignments ended, each audited with `request_id = migration-0004`.
- **Members.**
  - Invitations are bound to a verified email and need a reason, an optional review date, and explicit Owner authorization for policy-listed accounts.
  - They are single-use and hashed, and the invitee must accept them.
  - They can never grant `workspace_admin` and carry no venture access.
  - Venture assignments are proposed and then accepted by the assignee. Self-assignment is audited.
- **Governance (0005).**
  - Charters have 15 required fields, are versioned, and are immutable once decided.
  - The approval engine supports seven request types, separation of duties (requester and subject cannot vote), conflict declarations, single-reject, expiry, withdrawal, and supersede-on-change (snapshot hash).
  - Approval records an append-only decision register and `verified_decision` memory.
  - Lifecycle stage gates apply.
  - The Owner can run access reviews.
- **Finance (0006).**
  - Budgets have locked lines once approved.
  - The double-entry ledger enforces balance, one currency per entry, and maker-checker posting with `Idempotency-Key`.
  - Expenses must fall within an approved budget's cap, period, and currency.
  - Corrections use a single reversal only.
  - Includes reconciliation and a report derived from posted entries. Net result ≠ cash ≠ distributable surplus.
- **Rights.**
  - A contribution never creates ownership, and a value requires a valuation method.
  - Agreements are signed by each party themselves.
  - Ownership needs an executed agreement plus ≥2 independent approvals, with a 100% cap.
  - IP register.
- **Operations (0007).** Milestones and work items (dependencies, blocked reasons), assets with events and approval-gated disposal, customers, offers, orders, unit economics, experiments, risks, and reviews that snapshot metrics.
- **Portfolio.** EBAV is computed per docs/MASTER-SYSTEM.md §10.
- **Runtime (0008).** Venture-scoped memory with access log and retraction, where synthetic briefs cannot become knowledge. In-app notifications. Self-scoped data export. Data requests resolved by the Owner.
- **UI.** Pages for Workspaces (account status and Owner claim), Platform (accounts, reconciliation, audit, data requests), Portfolio, Governance, Members, and Saya (notifications, assignments, export). Venture tabs: Research, Charter & Lifecycle, Team, Finance, Contributions & Rights, Operations, Memory.
- Earlier foundation, still in place:
  - Clerk Development sign-in (Core 3) with server JWT verification (RS256/JWKS, issuer, expiry, `azp` allowlist).
  - Deny-by-default database authorization with denials logged.
  - Research Brief Agent (L2), provider adapters (all live execution off by default), kill switches, rate limits, append-only audit.

### API (base `/api/v1`)
- **Public:** `GET /health`, `GET /ready`, `GET /config`
- **Session & platform:** `GET /session` · `POST /platform/owner/claim` · `GET /platform/accounts|audit|data-requests` · `POST /platform/data-requests/:id/resolve` (Owner only)
- **Workspaces & members:** `GET|POST /workspaces` (POST Owner only) · `GET /workspaces/:wid` · `GET /workspaces/:wid/members` · `POST /workspaces/:wid/invitations` · `POST …/invitations/:iid/revoke` · `POST /invitations/accept` · `PUT /workspaces/:wid/members/:pid` · `POST …/members/:pid/offboard`
- **Ventures & assignments:** `GET|POST /workspaces/:wid/ventures` · `GET /ventures/:vid` · `GET|POST /ventures/:vid/assignments` · `POST …/assignments/:aid/end`
- **Governance:** `GET|POST /ventures/:vid/charters` · `PUT /charters/:id` · `POST /charters/:id/submit` · `GET /ventures/:vid/lifecycle` · `POST /ventures/:vid/stage-requests` · `GET /workspaces/:wid/approvals?status=` · `GET /approvals/:id` · `POST /approvals/:id/votes|conflicts|withdraw` · `GET /workspaces/:wid/decisions` · `GET /workspaces/:wid/access-review` · `POST /workspaces/:wid/access-reviews`
- **Finance:** `GET|POST /ventures/:vid/budgets` · `POST /budgets/:id/submit` · `GET|POST /ventures/:vid/finance/accounts` · `POST …/finance/accounts/defaults` · `GET|POST /ventures/:vid/finance/journals` · `POST /finance/journals/:id/post|reverse` (Idempotency-Key) · `GET|POST /ventures/:vid/finance/reconciliations` · `GET /ventures/:vid/finance/report`
- **Rights:** `GET|POST /ventures/:vid/contributions` · `POST /contributions/:id/submit|withdraw` · `GET|POST /ventures/:vid/agreements` · `POST /agreements/:id/sign|submit` · `GET|POST /ventures/:vid/ownership` · `POST /ownership/:id/submit` · `GET|POST /ventures/:vid/ip`
- **Operations:** `GET|POST /ventures/:vid/milestones` · `PATCH /milestones/:id` · `POST /ventures/:vid/work-items` · `PATCH /work-items/:id` · `GET|POST /ventures/:vid/assets` · `POST /assets/:id/events|dispose` · `GET /ventures/:vid/revenue` · `POST /ventures/:vid/customers|offers|orders` · `PATCH /orders/:id` · `GET|POST /ventures/:vid/experiments` · `POST /experiments/:id/start|conclude|abandon` · `GET|POST /ventures/:vid/risks` · `PATCH /risks/:id` · `GET|POST /ventures/:vid/reviews`
- **Memory & portfolio:** `GET|POST /ventures/:vid/memory` · `POST /research/:tid/to-memory` · `POST /memory/:id/retract` · `GET /workspaces/:wid/portfolio`
- **Me:** `GET /me/notifications` · `POST /me/notifications/read` · `GET /me/assignments` · `POST /me/assignments/:id/respond` · `GET /me/export` · `GET|POST /me/data-requests`
- **Research, providers, agents, audit:** `POST /ventures/:vid/research` · `GET /research/:tid` · `POST /research/:tid/review` · `GET|PUT /workspaces/:wid/providers…` · `GET /agents` · `GET|PUT /workspaces/:wid/kill-switches` · `GET /workspaces/:wid/audit|usage`

### Not implemented yet
- **Owner binding on the live dev environment.** The owner account must sign in with `sparkmind.support@gmail.com` (Google) and press "Klaim peran Platform Owner". The Clerk instance cannot create that user via API, so `platform_roles` is still empty remotely.
- **R2 artifacts adapter.** BLOCKED: no R2 binding is provisioned. Queues and Workflows (research runs synchronously). Workers AI binding and model registry.
- Live Apify / Scrape.ly Actor runs (NOT-AUTHORIZED). External email/SMS notifications (in-app only).
- Active GitHub CI: the template is in `ops/github-workflows/` and needs `workflows` permission. The Playwright suite currently covers sign-in and identity-boundary denial only.

### Local development
```bash
cp .dev.vars.example .dev.vars          # fill with DEVELOPMENT credentials only (git-ignored)
npm ci
npm run check                           # typecheck + lint + 63 tests + build
npm run db:migrate:local
npm run build && pm2 start ecosystem.config.cjs   # http://localhost:3000
```
After the regenerated package-lock.json is committed and verified, use npm ci for reproducible installs. Tests run the real migrations against an in-memory SQLite D1 shim (`tests/d1shim.ts`). Deploy to dev: `npm run deploy:dev`. Secrets are set with `wrangler pages secret put` and are never committed.

Provider candidates are not claims of approved spend or production readiness.

No venture, shared account, pooled fund, or joint asset should be represented as active until the relevant participants have freely agreed and the necessary legal and operational steps are complete.

## Change control

Material changes to governance, ownership principles, capital rules, participant rights, agent permissions, provider selection, architecture, or security controls must be documented, versioned, and reviewed before implementation.


### Capability coverage and upgrade roadmap

[Capability Inventory & Upgrade Roadmap](docs/CAPABILITY-INVENTORY-AND-UPGRADE-ROADMAP.md) is the canonical feature-gap register, target module map, P0-P6 implementation sequence and definition of done.

### Final implementation baseline

| Document | Purpose |
|---|---|
| [Final Initial Stack Decision](docs/FINAL-STACK-DECISION.md) | Locked initial stack, Clerk environment policy, mandatory provider adapters, cost and release gates |
| [Genspark Master Implementation Prompt](docs/GENSPARK-MASTER-IMPLEMENTATION-PROMPT.md) | Copy-ready instruction for Genspark to inspect and implement the repository |
| [Implementation Foundation Plan](docs/IMPLEMENTATION-FOUNDATION-PLAN.md) | Staged build sequence and first milestone acceptance criteria |

The initial stack decision supersedes earlier provider-selection language where there is a conflict. Clerk is selected. The MAELVYN Production instance and auth domain are verified; the web application remains on Development bindings until a separate production deployment is prepared.

## Commerce and production architecture upgrade

The current target architecture is documented in:
- [MAELVYN Commerce OS Master Architecture](docs/COMMERCE-OS-MASTER-ARCHITECTURE.md)
- [Legal Entity & Operating Model](docs/LEGAL-ENTITY-AND-OPERATING-MODEL.md)
- [Domain & Environment Strategy](docs/DOMAIN-AND-ENVIRONMENT-STRATEGY.md)
- [Clerk Production Runbook](docs/CLERK-PRODUCTION-RUNBOOK.md)
- [Production Readiness Checklist](docs/PRODUCTION-READINESS-CHECKLIST.md)
- [Architecture Decision Register](docs/ARCHITECTURE-DECISIONS.md)

**Important production warning (2026-11-18):** The MAELVYN Clerk Production instance already exists; its custom auth domain, DNS, SSL, mail, and Google OAuth configuration are verified. However, `maelvyn.biz.id` and `www.maelvyn.biz.id` still point to Pages project `maelvyn-dev`, whose `APP_ENV`, Clerk issuer/JWKS, publishable key, and D1 binding are Development. A separate production Pages/Worker deployment, D1, MAELVYN-specific private R2 (if required), and securely bound Clerk Production secret are still needed. Public production remains blocked until staging tests and safe domain cutover.


## Production execution

The Production environment is isolated from Development. For Genspark execution, follow the canonical [Wrangler-only execution master prompt](docs/GENSPARK-WRANGLER-EXECUTION-MASTER-PROMPT.md). Production deployment, D1 migrations and Pages secret installation must use Cloudflare Wrangler CLI; GitHub Actions CI is validation-only and must never deploy Production.

Current state and blockers: [Full repository and Production gap audit](docs/FULL-REPOSITORY-AND-PRODUCTION-GAP-AUDIT.md).


### Production continuation

| Document | Purpose |
|---|---|
| [Production Continuation Master System & Genspark Prompt](docs/PRODUCTION-CONTINUATION-MASTER-SYSTEM-AND-GENSPARK-PROMPT.md) | Authoritative clarification: reuse existing Production Pages/D1/R2, deploy the app with Wrangler, preserve the eight applied migrations, avoid bulk Development data migration, and follow security/domain release gates |
