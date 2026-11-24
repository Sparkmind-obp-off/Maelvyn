# MAELVYN — Architecture Decision Register

**Version:** 1.0.0  
**Status:** Active decision log  
**Rule:** Supersede decisions by adding a new dated decision; do not silently rewrite history.

## ADR-001 — Venture studio operating model

**Decision:** Active Venture Studio with Shared Economic Core.  
**Rationale:** Coordinate venture discovery, validation, build, operations, governance, and portfolio learning while preserving venture-level accountability.  
**Consequences:** No automatic partnership, holding company, pooled wallet, ownership transfer, or cross-venture liability.

## ADR-002 — Cloudflare-first technical foundation

**Decision:** Use React/TypeScript/Vite, Cloudflare Workers with Hono, D1, and private R2 as the initial target stack; evaluate Queues, Workflows, and Durable Objects only where justified.  
**Rationale:** Keep the initial platform modular and aligned with the existing development project.  
**Consequences:** Separate development and production resources; verify platform-specific transaction, storage, and workflow behavior before relying on it.

## ADR-003 — Identity provider and Clerk Core 3

**Decision:** The existing development implementation uses Clerk Core 3 via `@clerk/react`.  
**Production decision:** MAELVYN Production Clerk application binding is not yet verified. No unrelated project's Clerk application may be reused.  
**Consequences:** Keep development identity separate; create/identify a MAELVYN-specific production instance only after the correct workspace and domain are confirmed.

## ADR-004 — Hybrid Commerce

**Decision:** Central Marketplace + Independent Venture Storefronts + Partner & Distribution Network.  
**Scope:** All Commerce, subject to product/legal/provider eligibility.  
**Consequences:** Marketplace discovery does not transfer product ownership, customer data rights, seller liability, or revenue.

## ADR-005 — Initial legal operating model

**Decision:** Prefer using the existing eligible operating entity for initial approved activities rather than forming a holding group immediately.  
**Candidate:** PT Waskita Cakrawarti Digital — Perseroan Perorangan, subject to current document and KBLI/licensing verification.  
**Consequences:** MAELVYN brand is not automatically a legal entity. Every contract and invoice identifies the actual contracting party. Reassess when shareholders, investors, regulation, risk separation, or scale require a different structure.

## ADR-006 — Modular monolith before microservices

**Decision:** Start with clearly bounded modules in a modular monolith.  
**Rationale:** Lower operational overhead and easier transactional consistency at early scale.  
**Consequences:** Preserve domain boundaries and API contracts so services can be extracted later if justified.

## ADR-007 — Human-authorized reserved decisions

**Decision:** Ownership, capital commitments, contracts, legal filings, production access, money movement, settlement destination changes, and material IP transfers remain human-authorized.  
**Consequences:** Agents may research, prepare, recommend, and perform only narrowly pre-authorized reversible tasks.

## ADR-008 — Production release gates

**Decision:** Production is a separately verified state, not a synonym for merged code or a successful build.  
**Consequences:** Require isolated production identity, database, storage, secrets, domains, backups, monitoring, and acceptance evidence before launch.

## Open decisions

| ID | Decision | Current status |
|---|---|---|
| OPEN-001 | Correct Clerk workspace/application for MAELVYN | Unverified |
| OPEN-002 | Final public/app/auth hostnames on `maelvyn.biz.id` | Proposed |
| OPEN-003 | Cloudflare production project and resource IDs | Unverified |
| OPEN-004 | Legal entity/KBLI fit for each planned commerce activity | Requires professional verification |
| OPEN-005 | Payment provider and merchant-of-record model | Not selected |
| OPEN-006 | Public marketplace launch scope | Not selected |


## ADR-009 — MAELVYN brand and external positioning

**Decision date:** 2026-11-24  
**Decision:** Use MAELVYN as the master brand; position it externally as a **Venture Studio & Commerce Ecosystem**; describe the underlying platform as **Agentic Shared Venture Studio OS**; use the approved tagline **Building Ventures. Creating Value. Growing Together.**  
**Rationale:** Separate the market-facing business category from the technical operating-system descriptor.  
**Consequences:** All public and internal brand collateral must follow `docs/BRAND-STRATEGY-AND-IDENTITY.md`. This does not establish legal ownership of ventures or trademark/domain clearance.

## ADR-010 — Tool-neutral integration policy

**Decision date:** 2026-11-24  
**Decision:** External AI, research, browser, design, app-building, and demo tools are optional adapters or workflow aids—not mandatory MAELVYN core dependencies.  
**Consequences:** Keep Cloudflare/Workers/Hono/D1/R2 as the existing implementation baseline unless a new ADR approves a change. Evaluate each external tool for data access, security, cost, commercial terms, exportability, and measurable benefit before connection. No paid service or credit use is authorized by a mention in a document. See `docs/TOOLING-AND-INTEGRATION-STRATEGY.md`.
