# MAELVYN

**Venture Studio & Commerce Ecosystem**  
*Agentic Shared Venture Studio OS*  
*Building Ventures. Creating Value. Growing Together.*

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
| [Ecosystem Structure & Hierarchy](docs/ECOSYSTEM-STRUCTURE-AND-HIERARCHY.md) | Canonical hierarchy across Core, OS, Intelligence, Studio, Ventures, Products, Commerce, Shared Services, and Finance |
| [Dynamic Product Portfolio & Taxonomy](docs/DYNAMIC-PRODUCT-PORTFOLIO-AND-TAXONOMY.md) | Evidence-led product taxonomy, lifecycle, SKU versioning, pricing, fulfillment, and category governance |
| [Market Evidence & Opportunity Register](docs/MARKET-EVIDENCE-AND-OPPORTUNITY-REGISTER.md) | Traceable A–E market evidence and initial opportunity hypotheses |
| [90-Day Foundation Roadmap](docs/90-DAY-ROADMAP.md) | Staged, evidence-based foundation and agentic OS implementation plan |

### Engineering and operations

| Document | Purpose |
|---|---|
| [System Architecture](docs/SYSTEM-ARCHITECTURE.md) | Application boundaries, agent runtime, trust model, and security invariants |
| [Provider Stack Strategy](docs/PROVIDER-STACK-STRATEGY.md) | Provider-neutral stack, candidate runtimes, registry, quotas, cost controls, and fallback |
| [External Capability Integration Architecture](docs/EXTERNAL-CAPABILITY-INTEGRATION-ARCHITECTURE.md) | MAELVYN-owned gateway, MCP/provider boundaries, account identity, policy, execution protocol and rollout gates |
| [External Provider Binding Register](docs/EXTERNAL-PROVIDER-BINDING-REGISTER.md) | Provider-to-capability mapping, observed ChatGPT availability, MAELVYN binding status, priorities and blockers |
| [Free-First Provider Discovery & Productization Intelligence](docs/FREE-FIRST-PROVIDER-DISCOVERY-INTELLIGENCE.md) | ChatGPT connector inventory, external free tiers, live account checks, provider scorecard, productized packages, and free-first integration backlog |
| [Internal System & External Product Catalog](docs/MAELVYN-INTERNAL-SYSTEM-AND-EXTERNAL-PRODUCT-CATALOG.md) | Canonical five-layer internal system, six customer products, external provider capability map, execution flow, lifecycle and rollout gates |
| [Full-Stack Implementation Blueprint](docs/FULL-STACK-IMPLEMENTATION.md) | Runtime, repository layout, agentic backend modules, tests, and build sequence |
| [Database Schema](docs/DATABASE-SCHEMA.md) | Initial relational domain model and data integrity rules |
| [API Contract](docs/API-CONTRACT.md) | MVP endpoints, approval states, permissions, and finance posting rules |
| [Security, Privacy & Operations](docs/SECURITY-PRIVACY-OPERATIONS.md) | Data classification, access, privacy, audit, incident, and backup controls |
| [Commerce OS Master Architecture](docs/COMMERCE-OS-MASTER-ARCHITECTURE.md) | Hybrid marketplace, independent storefronts, partner distribution, commerce modules, finance, and agentic controls |
| [Legal Entity & Operating Model](docs/LEGAL-ENTITY-AND-OPERATING-MODEL.md) | Staged legal structure, operating-company boundaries, entity verification, and restructuring triggers |
| [Domain & Environment Strategy](docs/DOMAIN-AND-ENVIRONMENT-STRATEGY.md) | Domain map, development/production isolation, DNS, Clerk, and Cloudflare release boundaries |
| [Clerk Production Runbook](docs/CLERK-PRODUCTION-RUNBOOK.md) | MAELVYN-specific Clerk production prerequisites, provisioning, verification, and rollback |
| [Production Readiness Checklist](docs/PRODUCTION-READINESS-CHECKLIST.md) | Evidence-based release gates for identity, infrastructure, security, finance, and commerce |
| [Architecture Decision Register](docs/ARCHITECTURE-DECISIONS.md) | Versioned architecture decisions and unresolved implementation questions |
| [Production Deployment Verification](docs/MAELVYN-PRODUCTION-DEPLOYMENT-VERIFICATION.md) | Live deployment evidence, verified surfaces, and remaining authentication blocker |
| [Initial SQL Migration](migrations/0001_initial.sql) | D1/SQLite schema baseline; structure only, no participant or financial data |

## Authentication SDK upgrade

The browser client now targets Clerk Core 3 via `@clerk/react` (Node.js >=20.9.0). The previous `@clerk/clerk-react` Core 2 package was deprecated and used ClerkJS 5, which is blocked by Clerk's minimum-version protection on newer instances. See [Clerk Core 3 upgrade and verification](docs/CLERK-CORE-3-UPGRADE.md). A `package-lock.json` is present in the current repository. Before a clean install, verify it matches `package.json`; use `npm ci` only after lockfile synchronization is confirmed and committed.

## Current status

**Development foundation: implemented and tested. Production: separately deployed and partially verified, with authenticated workflows and recovery evidence still open.** MAELVYN is a working project identity and operating concept. This repository does not establish a legal entity, partnership, investment offer, ownership interest, or binding commitment by any person.

| Item | Status |
|---|---|
| Development URL | https://maelvyn-dev.pages.dev (Cloudflare Pages, user-owned account) |
| Identity | Clerk Development and Production instances exist. Production app is configured for Clerk Production; server secret is not installed, so authenticated use remains blocked |
| Database | D1 `maelvyn-dev-db` (development). Migrations `0001`–`0008` applied (remote, 2026-11-18; pre-migration export kept outside the repo) |
| Production | **Deployed / partially verified** on `maelvyn-production`; Clerk server secret is missing, so user sign-in and authenticated workflows remain blocked. See [Production verification](docs/MAELVYN-PRODUCTION-DEPLOYMENT-VERIFICATION.md). |
| Costs incurred | Research/actor costs are recorded per run in the Market Evidence register; infrastructure and provider billing must be reviewed in their respective accounts |

### What works today
The latest repository verification reports 105 automated tests passing across 11 test files, plus typecheck, lint, and build. Production-specific authenticated journeys, owner bootstrap, private artifact round-trip, and backup/restore remain unverified; see the dated Production verification report.

- **Identity boundary (migration 0004).** A singleton `platform_owner` is bound through the designated verified owner identity. The claim re-reads the primary email from Clerk's Backend API, requires it to be verified, and stores the stable Clerk subject. Specific owner identifiers are intentionally omitted from this public README.
  - Signup and first login create an account only, with no membership.
  - Other identities remain `owner_authorization_required` (ACCOUNT_ONLY) until explicitly authorized.
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
- **Owner binding on the live dev environment.** The designated owner must sign in through the configured Google identity and press "Klaim peran Platform Owner". The exact account identifier is intentionally omitted from this public README. The Clerk instance cannot create that user via API, so `platform_roles` is still empty remotely.
- **Production R2:** private bucket is provisioned and bound; authenticated upload/download/delete verification remains unverified. Queues and Workflows (research runs synchronously) and Workers AI inference/model registry remain unverified or unimplemented.
- Live Apify / Scrape.ly Actor runs (NOT-AUTHORIZED). External email/SMS notifications (in-app only).
- Active GitHub CI: the template is in `ops/github-workflows/` and needs `workflows` permission. The Playwright suite currently covers sign-in and identity-boundary denial only.

### Local development
```bash
cp .dev.vars.example .dev.vars          # fill with DEVELOPMENT credentials only (git-ignored)
npm ci
npm run check                           # typecheck + lint + current Vitest suite + build
npm run db:migrate:local
npm run build && pm2 start ecosystem.config.cjs   # http://localhost:3000
```
After confirming `package-lock.json` is synchronized with `package.json`, use `npm ci` for reproducible installs. Tests run the real migrations against an in-memory SQLite D1 shim (`tests/d1shim.ts`). Deploy to dev: `npm run deploy:dev`. Secrets are set with `wrangler pages secret put` and are never committed.

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

The initial stack decision supersedes earlier provider-selection language where there is a conflict. Clerk is selected. The MAELVYN Production instance and auth domain are verified; the application is deployed to the isolated Production Pages project, while authenticated end-user verification remains open.

## Commerce and production architecture upgrade

The current target architecture is documented in:
- [MAELVYN Commerce OS Master Architecture](docs/COMMERCE-OS-MASTER-ARCHITECTURE.md)
- [Legal Entity & Operating Model](docs/LEGAL-ENTITY-AND-OPERATING-MODEL.md)
- [Domain & Environment Strategy](docs/DOMAIN-AND-ENVIRONMENT-STRATEGY.md)
- [Clerk Production Runbook](docs/CLERK-PRODUCTION-RUNBOOK.md)
- [Production Readiness Checklist](docs/PRODUCTION-READINESS-CHECKLIST.md)
- [Architecture Decision Register](docs/ARCHITECTURE-DECISIONS.md)

**Important production status (2026-11-25):** `maelvyn.biz.id` and `www.maelvyn.biz.id` serve the isolated Production Pages deployment. Public health, readiness, security headers, and configuration are live-verified; authenticated sign-in, owner bootstrap, role/tenant E2E, private R2 round-trip, and backup/restore remain open. Do not describe MAELVYN as generally launched until those gates pass.


## Production execution

The Production environment is isolated from Development. The Genspark-specific Wrangler prompt is historical; use the tool-neutral `docs/MASTER-PROMPT.md` and current runbooks. Production deployment, D1 migrations and Pages secret installation must use Cloudflare Wrangler CLI; GitHub Actions CI is validation-only and must never deploy Production.

Current state and blockers: [Full repository and Production gap audit](docs/FULL-REPOSITORY-AND-PRODUCTION-GAP-AUDIT.md).


### Production continuation

| Document | Purpose |
|---|---|
| [Production Continuation Master System & Genspark Prompt](docs/PRODUCTION-CONTINUATION-MASTER-SYSTEM-AND-GENSPARK-PROMPT.md) | Historical Genspark-specific continuation prompt; see current tool-neutral master prompt, documentation governance, and dated Production verification |


## Brand and documentation control

- [Approved Brand Strategy](docs/BRAND-STRATEGY-AND-IDENTITY.md)
- [Brand Design System](docs/BRAND-DESIGN-SYSTEM.md)
- [Documentation Governance & Status](docs/DOCUMENTATION-GOVERNANCE-AND-STATUS.md)

The dated Production verification document is the source for live deployment claims. The latest evidence says the Production app and infrastructure are deployed, while authenticated end-user, storage, and recovery verification remain open. Do not describe MAELVYN as fully launched.

- [Tooling & Integration Strategy](docs/TOOLING-AND-INTEGRATION-STRATEGY.md)
- [UI/UX Audit & Enhancement Plan](docs/UI-UX-AUDIT-AND-ENHANCEMENT-PLAN.md)


## Canonical brand and current status

MAELVYN's approved tagline is **Building Ventures. Creating Value. Growing Together.** External positioning is **Venture Studio & Commerce Ecosystem**; the technical platform descriptor is **Agentic Shared Venture Studio OS**. The latest dated Production evidence is maintained in the Production verification report and records a live deployment with authenticated Clerk flows, private artifact round-trip, and recovery still open. See the brand strategy and Production verification documents before making public claims.

## Agentic platform master documents

The technical platform specification and Genspark execution prompt are maintained separately from the venture constitution:

| Document | Purpose |
|---|---|
| [Agentic Platform Master System](docs/MAELVYN-AGENTIC-PLATFORM-MASTER-SYSTEM.md) | Canonical technical architecture, identity boundaries, gateway, providers, product roadmap, security and autonomy |
| [Implementation Backlog P0–P5](docs/MAELVYN-IMPLEMENTATION-BACKLOG-P0-P5.md) | Dependency-ordered implementation epics, acceptance criteria, release gates and report template |
| [Genspark Full-Stack Master Prompt](docs/GENSPARK-FULLSTACK-MASTER-PROMPT.md) | Copy-ready instruction for Genspark to inspect and continue this existing repository |

These documents do not replace [Master System](docs/MASTER-SYSTEM.md). The latter remains authoritative for venture governance, participation, rights and ownership.
