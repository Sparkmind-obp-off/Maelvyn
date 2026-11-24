# MAELVYN — Documentation Governance & Status

**Version:** 1.0.1  
**Effective date:** 2026-11-25  
**Scope:** All repository documentation, implementation prompts, operational runbooks, and release evidence.

## 1. Purpose

Prevent contradictory specifications, stale prompts, duplicated authority, and claims that exceed verified implementation. Documentation is part of the system's governance and release controls.

## 2. Source-of-truth hierarchy

1. Applicable law, regulatory obligations, and executed agreements.
2. Explicitly approved governance and brand decisions.
3. `docs/MASTER-SYSTEM.md` — canonical operating constitution and system invariants.
4. `docs/MASTER-PROMPT.md` — agent/coding/research execution behavior, subordinate to the Master System.
5. Domain specifications: architecture, commerce, product, security, data, UI, legal and operations.
6. Dated verification reports, test output, and current implementation evidence for claims about what exists.
7. Roadmaps and proposals — future intent only.
8. Historical prompts and superseded drafts — archive/reference only.

A newer timestamp does not automatically override a higher-authority document. A dated evidence report can supersede an older implementation-status statement only for the specific state it actually verified.

## 3. Status vocabulary

| Status | Meaning |
|---|---|
| APPROVED | Explicitly decided and recorded by an authorized human |
| IMPLEMENTED | Present in code/configuration; does not imply production verified |
| TESTED | Automated or manual test passed; state scope and date |
| VERIFIED LIVE | Observed against the actual target environment with evidence |
| PARTIALLY VERIFIED | Some live surfaces work; named blockers remain |
| PROPOSED | Candidate design or plan; not an approved commitment |
| UNVERIFIED | Evidence is missing, stale, or insufficient |
| BLOCKED | A named dependency prevents completion |
| DEPRECATED | Superseded; do not use for new execution |
| ARCHIVED | Preserved for history; not an active instruction |

Never use "complete", "live", "secure", "production-ready", or "launched" without specifying scope and evidence.

## 4. Canonical identity

- Brand: MAELVYN.
- External positioning: Venture Studio & Commerce Ecosystem.
- Platform descriptor: Agentic Shared Venture Studio OS.
- Approved tagline: Building Ventures. Creating Value. Growing Together.
- Brand strategy: `docs/BRAND-STRATEGY-AND-IDENTITY.md`.
- Brand visual system: `docs/BRAND-DESIGN-SYSTEM.md`.

## 5. Document inventory and authority

| Document family | Canonical documents | Rule |
|---|---|---|
| Governance | MASTER-SYSTEM, MASTER-BLUEPRINT, VENTURE-OPERATING-FRAMEWORK | Master System wins on conflict |
| AI execution | MASTER-PROMPT, AGENT-OPERATING-CONSTITUTION, AGENTIC-OS-ARCHITECTURE | Must inherit system authority and approval boundaries |
| Product | NORTH-STAR, PRODUCT-REQUIREMENTS, CUSTOMER-JOURNEYS, DYNAMIC-PRODUCT-PORTFOLIO-AND-TAXONOMY | Product target, not implementation proof |
| Commerce | COMMERCE-OS-MASTER-ARCHITECTURE, ECOSYSTEM-EXECUTION-AND-PRODUCTIZATION | Seller, rights, fulfillment, finance, and customer boundaries are explicit |
| Engineering | SYSTEM-ARCHITECTURE, FINAL-STACK-DECISION, FULL-STACK-IMPLEMENTATION, DATABASE-SCHEMA, API-CONTRACT | Code and migrations are the implementation truth |
| Security/operations | SECURITY-PRIVACY-OPERATIONS, PRODUCTION-READINESS-CHECKLIST, DOMAIN-AND-ENVIRONMENT-STRATEGY, Clerk runbooks | Dated evidence required for release claims |
| Evidence | MARKET-EVIDENCE-AND-OPPORTUNITY-REGISTER, FULL-REPOSITORY-AND-PRODUCTION-GAP-AUDIT, MAELVYN-PRODUCTION-DEPLOYMENT-VERIFICATION | Preserve source, date, limitations and evidence class |
| Brand/UI | BRAND-STRATEGY-AND-IDENTITY, BRAND-DESIGN-SYSTEM, UX-UI-SYSTEM | Strategy is approved; detailed visual implementation is staged |
| Website/acquisition/providers | WEBSITE-ACQUISITION-AND-PROVIDER-REGISTER | Canonical public-site journey, design references, provider statuses, release gates and work-log rules |
| Planning | 90-DAY-ROADMAP, CAPABILITY-INVENTORY-AND-UPGRADE-ROADMAP, IMPLEMENTATION-FOUNDATION-PLAN | Plans are not proof of completion |
| Historical execution | GENSPARK-* and older continuation prompts | Genspark-specific; archive or adapt before reuse if access/runtime is unavailable |

## 6. Required document header

For new or materially revised documents include:
- Title and canonical path.
- Version.
- Status.
- Owner/decision authority where known.
- Last updated date.
- Parent authority.
- Related documents.
- Evidence/source links where factual claims are made.

## 7. Change control

1. Identify the document authority and affected downstream docs.
2. Record the reason and evidence for the change.
3. Update canonical source first, then downstream references.
4. Search for conflicting old terminology, tagline, API/stack status, and dates.
5. Preserve historical decision records; supersede rather than silently erase decisions.
6. Update README links and this governance index.
7. Run markdown/link checks and relevant repository tests where code changes occur.
8. Record commit SHA and verification limits.

## 8. Evidence and freshness

- Use absolute dates (YYYY-MM-DD) for operational evidence.
- Distinguish a design decision, source-code presence, passing automated test, and live production observation.
- Record the environment and resource identity for infrastructure claims.
- Treat redacted secrets as unknown, not proof of absence.
- Never store secret values, personal account numbers, or private legal document identifiers in public docs.
- Do not promote a market listing, impression, view, or unverified claim to a completed transaction.

## 9. Genspark-specific documents

The repository contains legacy Genspark implementation/execution prompts. They are not the platform architecture and must not be treated as the only execution route. When the Genspark account/runtime is unavailable, use the tool-neutral `MASTER-PROMPT.md` and the current tool-specific runbook. Do not paste secrets into any agent prompt or chat.

## 10. Review cadence

Review canonical docs when any of these changes: brand strategy, legal structure, provider, auth, database schema, finance rules, agent autonomy, data boundaries, production environment, or commerce seller/fulfillment model. Review operational evidence before every production release. Update `docs/WEBSITE-ACQUISITION-AND-PROVIDER-REGISTER.md` whenever website, acquisition, provider, or chatbot status changes.
