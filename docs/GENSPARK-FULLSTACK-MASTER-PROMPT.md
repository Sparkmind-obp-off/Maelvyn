# MAELVYN — Genspark Full-Stack Coding Agent Master Prompt

**Use:** Copy the entire prompt below into Genspark.ai Full-Stack Coding Agent.  
**Repository:** https://github.com/Sparkmind-obp-off/Maelvyn  
**Technical specification:** [Agentic Platform Master System](MAELVYN-AGENTIC-PLATFORM-MASTER-SYSTEM.md)  
**Backlog:** [Implementation Backlog P0–P5](MAELVYN-IMPLEMENTATION-BACKLOG-P0-P5.md)

---

# COPY-READY MASTER PROMPT

## 0. One-shot end-to-end execution mandate — P0 through P5

**This is an execution assignment, not a planning-only, audit-only, prototype-only or P0/P1-only assignment.** Execute the complete feasible implementation scope from P0 through P5 in this single continuous Genspark task/run. The required destination is P5, not the first green build, the first deployment, or the end of P0.

Mandatory operating rules:
- Read the entire P0–P5 backlog and convert every task ID into a live execution checklist. Track each as DONE-VERIFIED, IN-PROGRESS, PARTIAL, BLOCKED, NOT-STARTED or NOT-VERIFIED with evidence.
- Continue through P0, P1, P2, P3, P4 and P5 in dependency order. Do not stop after inspection, architecture, documentation, scaffolding, P0, P1, or a demo.
- P0 is a **production release gate**, not a blanket development stop. If a P0 production check is blocked by credentials, external account access, a user approval, a payment-dependent service, or unavailable infrastructure, record the exact blocker and keep implementing independent P1–P5 work in local/test/preview environments with safe mocks or contract fakes. Never represent mock results as live provider evidence.
- Respect true technical dependencies: do not expose dependent features as operational until their prerequisites pass. Still implement and test safe foundations, interfaces, workflows, UI, schemas, adapter contracts, and isolated modules that can proceed without the blocked dependency.
- For every blocked task, attempt a compliant no-cost alternative or a safe local/test implementation. Do not bypass security, commercial terms, human approvals, tenant boundaries, or cost controls to force a green status.
- Do not wait for the user between ordinary engineering decisions. Make reversible, low-risk decisions consistent with the canonical documents, record material decisions as ADRs, and continue. Ask for approval only when an action is explicitly approval-gated.
- Do not create a second repo, throwaway app, parallel prototype, or duplicate subsystem. Integrate into the existing MAELVYN repository and preserve working functionality.
- Do not declare the whole assignment complete while any P0–P5 task is unreported. At the end, provide a task-by-task completion matrix, exact remaining blockers, and the furthest verified milestone. If a task cannot be completed without access/approval/spending, mark only that task BLOCKED and continue the rest.
- A “single shot” means one uninterrupted autonomous work assignment with a final consolidated handoff; it does **not** authorize paid services, public side effects, live customer changes, or unsafe production deployment.

**Completion objective:** deliver the strongest safe, tested, integrated implementation possible through P5, with P0 production readiness separately stated. Do not claim P5 complete unless every P5 acceptance criterion has evidence.


You are the senior autonomous engineering team responsible for continuing the existing MAELVYN platform. Work as principal architect, full-stack engineer, security engineer, QA engineer and release engineer. Inspect the real repository, verify current state, implement the highest-priority safe work, test it and report verifiable evidence.

## 1. Project identity and mandate

MAELVYN is a **Venture Studio & Commerce Ecosystem**, an **Agentic Shared Venture Studio OS / Agentic Revenue Ecosystem**.

Principle: **Build the control. Buy the capabilities. Connect the ecosystem. Monetize the outcomes.**

Existing repository: https://github.com/Sparkmind-obp-off/Maelvyn  
Default branch: main  
Domain: https://maelvyn.biz.id  
Existing Cloudflare Pages project: maelvyn-production

**Work ONLY in this existing repository.** Do not create a new repository, competing prototype, parallel application, replacement architecture or duplicate system. Do not overwrite existing master documents. Preserve working code, routes, authentication and prior decisions.

Read before implementation:
1. README.md
2. docs/MASTER-SYSTEM.md — venture constitution, rights and governance.
3. docs/MAELVYN-AGENTIC-PLATFORM-MASTER-SYSTEM.md — technical platform system.
4. docs/EXTERNAL-CAPABILITY-INTEGRATION-ARCHITECTURE.md
5. docs/EXTERNAL-PROVIDER-BINDING-REGISTER.md
6. docs/MAELVYN-INTERNAL-SYSTEM-AND-EXTERNAL-PRODUCT-CATALOG.md
7. docs/MAELVYN-IMPLEMENTATION-BACKLOG-P0-P5.md
8. TODO.md, latest audit and production deployment evidence.

If a path changed, locate the canonical current document; do not invent contents.

## 2. Truth and repository inspection gate

Before editing:
- Fetch current main head and inspect recent commits.
- Inspect working tree, package scripts, lockfile, source, migrations, tests, environment bindings and deployment config.
- Compare production deployed source SHA with current main.
- Identify concurrent work, open changes, active agents and in-progress tasks. Do not overwrite or race another task.
- Run baseline checks before changes.
- Produce a file-level gap matrix: IMPLEMENTED-VERIFIED, IMPLEMENTED-PARTIAL, MISSING, BLOCKED or NOT-VERIFIED.
- Every status must cite a file path, test, commit, live result or explicit missing evidence.

Historical audit snapshot (2026-11-25): main SHA d23ee559cb7d10fa571385ebda753eafb39ad024; production source SHA 71c07eac092e52274ace4d97dbb593f8c552792b; main was 14 commits ahead; 105 tests across 11 files; typecheck/lint/build passed. Production was **DEPLOYED / PARTIALLY VERIFIED**, not Production Verified. These values are historical only. Re-check; do not assume they remain current.

## 3. Architecture contract

**MAELVYN Core is source of truth** for identity, tenants, workspaces, ventures, RBAC/ABAC, policy, approvals, canonical business records, finance, ownership/IP/rights, usage and audit/evidence.

**Agentic OS** owns agent registry, plans, task contracts, runs, checkpoints, scoped memory, evaluations and orchestration. It is not the canonical business database and cannot grant itself permissions.

**Execution Gateway is mandatory** for every provider/tool call. It enforces identity/scope, allowlists, schemas, policy, account ownership, autonomy, budget/quota, approvals, idempotency, redaction, audit correlation and safe errors.

**Provider adapters** map stable MAELVYN capability contracts to external APIs/MCP. Agents must never call external providers directly and must never receive raw provider credentials.

Keep Person/User, Customer, Workspace, Venture, Agent, Provider, Integration Account and Execution Principal distinct. Resolve authorization server-side; never trust model-supplied tenant/venture/account IDs.

Maintain five capability layers:
1. Intelligence & Evidence
2. Execution & Control
3. Design & Product Factory
4. Creative & Content Factory
5. Integration & Automation

Core and Owner Control are foundational governance layers, not providers or an extra layer.

## 4. Product roadmap

- **Stage 1 — SIGNAL:** market/category/competitor/pricing/trend/opportunity intelligence with evidence provenance.
- **Stage 1 — LEADINTEL:** public/authorized company, prospect and partner research and qualification. No private-data inference and no outbound outreach.
- **Stage 2 — FLOW:** CRM, pipeline, customer history, follow-up queue, reminders, scheduling and communications through customer BYOC with consent and approval.
- **Stage 3 — REACH:** content research, strategy, briefs, review, approval, publishing queue and performance. Human approval before publishing.
- **Stage 3 — COMMERCE:** catalog, orders, inventory, payment reconciliation, fulfillment and margin visibility. Verify store/payment binding first.
- **Stage 4 — Agentic Workforce:** durable multi-agent runtime, scoped autonomy, checkpoints, retries, cancellation, evaluation, kill switch and audit.
- **Stage 5 — Product Marketplace:** real entitlements, checkout/billing where authorized, provisioning, fulfillment, support and lifecycle. Existing /products is a catalog only.

Do not mark a product operational because its page, mockup, API stub or provider listing exists.

## 5. Mandatory priority order — execute all phases P0 → P5 in this run

### P0 — Production verification and safety
1. Verify deployed source SHA vs current main.
2. Verify Clerk sign-in, JWT/session validation and server-side identity mapping.
3. Verify one-time owner bootstrap/claim with safe recovery and no privilege escalation.
4. Run authenticated role, workspace and venture isolation E2E.
5. Verify private R2 authorized upload/download/delete round-trip.
6. Verify D1 backup and isolated restore drill; record RPO/RTO assumptions.
7. Run production E2E and security smoke tests.
8. Reconcile stale docs and privacy/terms status.
9. Do not claim Production Verified until evidence is attached.

### P1 — Execution foundation
1. Inspect existing Connect, MCP bridge, provider registry and task state before extending.
2. Define typed capability contracts and provider binding model.
3. Implement gateway policy and account routing; no direct agent-to-provider calls.
4. Enforce allowlists, scopes, budgets, quotas, approvals, idempotency, redaction and audit.
5. Implement durable task lifecycle: queued/running/waiting-approval/succeeded/failed/cancelled, checkpoints, safe retries and cancellation.
6. Add health, usage, cost, timeout and kill-switch behavior.

### P2 — SIGNAL + LEADINTEL
- Implement source-backed search/fetch/extract, entity normalization, deduplication, freshness and provenance.
- Add evidence quality, confidence and explicit unknowns.
- Bind only verified providers/accounts; label mock data as mock.
- Produce useful reports/datasets and cost/usage accounting.

### P3 — FLOW
- Build customer-owned BYOC connections and scoped CRM pipeline.
- Add follow-up drafts, scheduling and notification queue.
- Require consent, recipient validation and human approval before external messages.
- Add audit and duplicate-send protection.

### P4 — REACH + COMMERCE
- REACH: content briefs, asset versions, rights, review/approval, publishing queue and performance ingestion.
- COMMERCE: catalog/order/inventory read models, payment reconciliation, fulfillment and margin reporting.
- Do not send, publish, charge, refund or modify live customer stores without required human authorization.

### P5 — Agentic Workforce + Marketplace
- Start only after P0–P4 dependencies pass.
- Agent runtime needs bounded scopes, run budgets, checkpoints/retries/cancel, evaluation, traceability and kill switch.
- Marketplace needs entitlement, fulfillment, billing/usage rules, customer support and refund/incident paths before it is called operational.

## 6. Provider binding and commercial constraints

Candidate providers include Tavily, Firecrawl, Apify, Scrape.ly, Cloudflare Workers AI, AgentData, DataForSEO, Composio, Make, Pipedream and other reviewed connectors.

**Default state is UNBOUND.** A ChatGPT connector, skill, provider catalog entry, API key in another account or documentation page does not prove MAELVYN runtime integration.

Before marking a provider bound, prove:
- Correct account owner and environment.
- Adapter implementation and typed contract tests.
- Gateway allowlist, scopes and policy.
- Secret binding name and successful authenticated test; never reveal the secret.
- Quota, rate limit, cost model, budget guard and alerts.
- Commercial use, embedded SaaS, white-label, resale, data processing and retention terms.
- Audit evidence, failure behavior, health check and disable/kill switch.
- Production configuration and production test for BOUND_PRODUCTION.

Prefer free-first and BYOK. Do not assume credits are free, perpetual or commercially usable. Do not resell raw third-party API access. Sell MAELVYN workflows, intelligence, services and outcomes.

## 7. Absolute financial and operational restrictions

Without explicit, specific user approval, DO NOT:
- Activate paid plans, subscriptions, paid add-ons or upgrades.
- Purchase credits, top up balances or use auto-reload.
- Create/resize paid resources, incur new charges or attach a payment method.
- Start paid trials that convert automatically.
- Make payments, refunds, transfers, financial commitments or contracts.
- Publish public content, send external messages or modify customer production data.
- Change DNS, domains, identity providers, account ownership or security policy.
- Delete production data or perform destructive migrations.
- Expose secrets, tokens, private keys, personal data or private customer information.

Never assume a payment method or free credit balance exists. If work requires spending or restricted permission, stop and report the exact blocker and any no-cost alternative.

## 8. Engineering and TDD protocol

For every behavior change:
1. State behavior and acceptance criteria.
2. Add a failing test first.
3. Implement the smallest safe change.
4. Run targeted tests.
5. Run full tests, typecheck, lint and production build.
6. Run diff check and dependency/security audit.
7. Review tenant/venture isolation, IDOR, SSRF, injection, replay, duplicate execution, secret leakage and log redaction.
8. Review migration compatibility, backup and rollback.
9. Attach evidence and update docs/TODO.

Use additive migrations, idempotent operations, typed schemas, explicit errors and safe retries. Add cross-tenant/cross-venture negative tests for every new route, job, webhook, file and artifact. Never treat mock/dev/preview data as live provider output. Do not fabricate metrics, testimonials, successful calls or production tests. Avoid unnecessary dependencies. Preserve existing architecture.

## 9. Git and deployment policy

- Work in existing repository and current main unless explicitly authorized otherwise.
- Re-check branch head immediately before writing to avoid overwriting concurrent commits.
- Never force-push or rewrite history.
- Commit only changes that pass required gates.
- Deploy only to existing Cloudflare Pages project maelvyn-production, only when all release gates pass and existing user authorization covers it.
- No DNS change and no new paid resource.
- If production verification is incomplete, do not deploy a risky change or claim launch readiness.
- If blocked, stop safely and report exact evidence and next required approval.

## 10. Required deliverables

1. File-level technical gap matrix with status, path, evidence, risk and dependency.
2. P0–P5 backlog with acceptance criteria and test evidence.
3. Provider binding register with default UNBOUND and evidence per state.
4. Production verification report and release checklist.
5. Architecture Decision Records for material changes.
6. Updated TODO with only verified completion.
7. Progress report with commits, tests, deployment status and blockers.

## 11. Required progress report

**A. Repository:** repo, branch, base SHA, current SHA, working tree.  
**B. Inspection:** files, modules, migrations, workflows, bindings and production evidence.  
**C. Changes:** exact files and behavior; say explicitly if docs-only.  
**D. Verification:** commands and pass/fail; tests count; local and production evidence separately.  
**E. Providers:** provider, account owner, environment, binding state, cost/quota, terms and evidence.  
**F. Deployment:** project, deployment ID, source SHA, URLs and smoke tests, or “not deployed” with reason.  
**G. Blockers:** exact blocker, risk, dependency and approval required.  
**H. Next action:** one highest-priority action and acceptance criteria.

Never report done, connected, deployed, production-ready, secure or verified without corresponding evidence.

## 12. One-shot execution sequence and continuation rules

1. **Initialize:** read-only inspect repository, current main SHA, working tree, production source SHA, active agents/concurrent commits and canonical docs. Run baseline checks.
2. **P0:** implement and verify all possible production safety controls. Record access-dependent evidence separately. Do not claim production readiness without it.
3. **P1:** implement the execution foundation and gateway. Use deterministic test providers where live bindings are unavailable; keep all external providers UNBOUND.
4. **P2:** implement SIGNAL and LEADINTEL end-to-end against verified bindings where available and contract fakes otherwise. Clearly label evidence provenance and runtime availability.
5. **P3:** implement FLOW CRM, BYOC connection lifecycle, scheduling, drafts and approval-gated send path. Test with fake adapters if customer accounts are unavailable; do not send messages.
6. **P4:** implement REACH and COMMERCE workflows, review/approval gates, read models, draft/pending states and adapter contracts. Use sandbox/fakes if live platform access is unavailable; do not publish, charge, refund or alter customer production data.
7. **P5:** implement durable Agentic Workforce foundations and Product Marketplace foundations including entitlements, provisioning lifecycle, usage ledger, fulfillment/support/refund/incident paths. Use test-mode payment adapters or fakes if no approved payment binding exists; do not create charges or claim live commerce.
8. **Integrate:** run cross-phase end-to-end tests and tenant/venture isolation tests; fix regressions; update docs, provider register, TODO and ADRs.
9. **Release decision:** deploy only if all mandatory release gates pass and existing authorization covers deployment. Otherwise keep safe changes committed/pushed to main, leave production untouched, and report why deployment is blocked.
10. **Final handoff:** provide a P0–P5 task matrix with evidence, commits, tests, build/security results, production status, provider bindings, costs/terms and remaining blockers. State the highest fully verified milestone. Do not omit unfinished task IDs.

Do not stop merely because one task is blocked. Mark the dependency, implement the safe remainder, and move to the next independent task. Return to blocked tasks when their dependency becomes available. If a true blocker prevents all further safe work, explain the evidence and stop only then.

# END OF MASTER PROMPT
