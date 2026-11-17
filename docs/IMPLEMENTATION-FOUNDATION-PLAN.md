# MAELVYN — Implementation Foundation Plan

**Version:** 1.0.0  
**Date:** 2026-11-17  
**Status:** Execution baseline  
**Related:** FINAL-STACK-DECISION.md, GENSPARK-MASTER-IMPLEMENTATION-PROMPT.md

## Objective

Move MAELVYN from documentation-only design into a working development application with a governed agentic foundation. Build a thin vertical slice first, then expand. Do not create a large untested platform in one pass.

## Current verified repository baseline

At the time this plan was written, the repository root contains:
- README.md
- docs/
- migrations/0001_initial.sql

The repository currently has specifications and an initial proposed D1 schema. No application source tree, package manifest, Cloudflare Worker entry point, test harness, or deployed runtime was visible in the inspected root. Treat the project as documentation/schema baseline until a fresh repository inspection proves otherwise.

## Final stack

Use docs/FINAL-STACK-DECISION.md as the canonical decision. Short version:
- React + TypeScript + Vite + Tailwind.
- Cloudflare Workers + Hono + Zod.
- D1 canonical relational store.
- R2 private artifact storage.
- Queues for async jobs.
- Workflows for durable multi-step orchestration.
- Workers AI inference adapter.
- Clerk identity: Development now; Production only after domain ownership and production readiness.
- Provider adapters: Tavily, Firecrawl, Apify, Scrape.ly.
- Vitest, integration tests, Playwright, GitHub CI.

## Build sequence

### Stage 0 — repository and policy baseline
- Verify default branch, clean tree, files, migrations, and current docs.
- Add final stack decision, Genspark implementation prompt, and this execution plan.
- Add architecture decision records for material technology choices.
- No cloud resources or paid services.

### Stage 1 — app scaffold
- Create a coherent project layout, preferably npm workspaces only if it reduces complexity; otherwise use a simple web/API structure.
- Add React/Vite frontend and Hono Worker API.
- Add strict TypeScript, Zod, lint, formatting, Vitest, and CI.
- Add /health and /ready endpoints.
- Add environment-specific Wrangler config without real production IDs/secrets.
- Provide .env.example and .dev.vars.example containing names only, no secret values.

### Stage 2 — identity and tenant security
- Integrate Clerk Development through a replaceable identity adapter.
- Add server-side token/session verification using Clerk-supported Workers-compatible approach.
- Create internal identity links, workspace membership, venture membership, role grants, and policy decisions.
- Enforce deny-by-default and cross-venture isolation.
- Include negative tests for missing identity, revoked membership, wrong venture, and client-forged roles.
- No production keys, real users, or sensitive data.

### Stage 3 — agentic foundation
- Agent registry and versioning.
- Provider registry and capability configuration.
- Task contracts, state transitions, dependency graph, deadlines, retries, and idempotency.
- Permission engine and autonomy policy.
- Approval requests for reserved actions.
- Scoped evidence/memory metadata.
- Append-only audit.
- Budget reservation and usage accounting.

### Stage 4 — provider adapter contracts
Implement typed adapters and mocks for:
- Workers AI
- Tavily
- Firecrawl
- Apify
- Scrape.ly

The first release may mark all external providers DISABLED or UNVERIFIED. A complete adapter contract does not imply live connectivity. Add provider-specific health, estimate, execute, usage, error classification, timeout, and disable behavior. Validate live endpoints against official docs before enabling.

### Stage 5 — first research vertical slice
Implement Research Brief Agent using a mock provider end-to-end:
- create task;
- authorize principal and venture;
- create task contract;
- reserve budget;
- call mock search adapter;
- persist evidence/provenance;
- produce a structured draft;
- require human review;
- record audit and usage;
- reject unconfigured live provider use cleanly.

After mock acceptance, enable a single live provider only with credentials, current pricing/terms, allowed scope, and approved budget.

### Stage 6 — durable jobs
Add Queues and Workflows only where async/retry/human-wait requirements are proven by the research slice. Implement idempotency, bounded retries, dead-letter handling, cancellation, and operational dashboards. Keep local/mock tests independent of live Cloudflare accounts.

### Stage 7 — production readiness
Blocked until domain ownership and explicit release approval:
- Clerk Production instance and dedicated OAuth credentials.
- Domain DNS, Clerk frontend API domain, redirect URLs, webhook secrets.
- Production Cloudflare resources and isolated bindings.
- Privacy policy/terms, data retention, deletion/export, incident response.
- R2 private access controls.
- D1 backup/restore demonstration.
- Security review and penetration/abuse testing.
- Rate limits, alerts, monitoring, operator runbook.
- Final human release approval.

## Definition of done for the first implementation milestone

The first milestone is not "all providers connected" or "production launched". It is a secure, testable development vertical slice:
1. Web app and Worker API build.
2. Clerk Development integration is isolated and works or has a documented blocker.
3. D1 schema/migrations work locally or in dedicated development.
4. Tenant/venture authorization tests pass.
5. Agent/provider/task/approval/audit contracts exist.
6. All five provider adapters have mock implementations and contract tests.
7. Research Brief Agent completes with synthetic evidence from mock provider.
8. Unconfigured live calls are safely rejected.
9. Typecheck, lint, unit/integration tests, and build pass.
10. No production resources or paid services activated.

## Stop conditions

Stop implementation and report if:
- Repository state conflicts with the plan.
- A migration appears already applied or cannot be safely reconciled.
- A provider requires paid activation without authorization.
- A credential is missing or exposed.
- A data flow crosses venture boundaries.
- Clerk integration requires production domain configuration.
- A critical permission, privacy, or security test fails.
- Tool access is insufficient to verify a claimed change.

## Execution rule

Implement the smallest complete vertical slice. Prefer real code with mocks and verifiable behavior over diagrams, placeholder integrations, or claims of full automation.
