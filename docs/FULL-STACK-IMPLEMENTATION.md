# MAELVYN — Agentic Shared Venture Studio OS Full-Stack Blueprint

**Version:** 2.0  
**Status:** Proposed engineering plan; no production implementation implied

## Runtime architecture
Browser React UI → HTTPS → Cloudflare Worker/Hono → identity adapter + authorization → domain services → typed repositories → D1. Private R2 is accessed only through authorized server paths. Queues and Workflows are later additions. Audit and observability are server-side.

The browser never connects directly to D1 or private R2. The API is the trust boundary.

## Suggested repository layout
~~~text
/
  apps/web/                 React + Vite
  apps/worker/              Hono Worker
  packages/contracts/       Shared schemas and types
  packages/domain/          Pure business rules
  packages/ui/              Accessible UI primitives
  migrations/
  tests/unit/
  tests/integration/
  tests/e2e/
  docs/decisions/
  wrangler.jsonc
  package.json
~~~
A simpler single application with separated web/server/domain folders is acceptable for MVP. Avoid monorepo complexity unless it provides real value.

## Backend modules
Identity; Access; Workspaces; Opportunities; Ventures; Agreements; Contributions; Ownership; Approvals; Finance; Assets; Documents; Audit; Notifications (later).

## Request pipeline
1. Assign request ID.
2. Apply security headers, CORS allowlist, body limits, and rate limits.
3. Authenticate session.
4. Resolve internal person and active membership.
5. Authorize workspace and venture scope.
6. Validate schema and idempotency key.
7. Execute domain service and repository transaction.
8. Write audit event for material action.
9. Return typed response and request ID.

Never trust browser-supplied roles, approval states, amounts, totals, or ownership percentages.

## Transaction and ledger requirements
Use tested D1 transaction/batch semantics for related writes. Approval and state transitions must be atomic. Journal posting validates at least two lines and debit=credit per currency. Audit and posting must commit consistently; otherwise use an outbox/reconciliation design. Sensitive writes require idempotency. Posted entries are immutable and corrected by linked reversal. Budget approval is not payment. Reconcile records to source evidence.

## API modules
Base path /api/v1:
- /session
- /workspaces, /memberships, /invitations
- /opportunities, /opportunities/:id/evidence
- /ventures, /ventures/:id/charter, /milestones, /risks
- /agreements, /contributions, /ownership-interests
- /approvals, /approvals/:id/votes
- /budgets, /finance/accounts, /finance/journals
- /assets, /documents
- /reports, /audit-events

Use cursor pagination, strict schemas, stable error codes, version checks, and idempotency on sensitive writes.

## Frontend modules
App shell/invitations; role-aware Home; opportunity pipeline; venture workspace; approval inbox; finance ledger/budget/reports; asset register; people/agreements/rights; documents/audit; settings/security.

Frontend state is presentation state only. Server is authoritative for permissions, workflow, and calculations.

## Testing strategy
Unit: lifecycle, permissions, contribution classification, approval thresholds, journal balance/reversal, currency, redaction/export scope.  
Integration: authorized/unauthorized API access, clean/upgrade migrations, constraints/triggers, rollback, retries, audit, private files.  
E2E: invite/decline, opportunity-to-charter, contribution-to-agreement, expense approval-to-posting, monthly review, offboarding.

## Release gates
Typecheck/lint/unit/integration/E2E pass; migrations tested; backup/restore demonstrated; role-boundary tests pass; no critical/high security issue; production resources/secrets isolated; owner signs release checklist.

## Build sequence
1. Scaffold and environment separation.
2. Identity adapter and authorization.
3. Execute/test D1 migrations in development.
4. Audit, workspace, membership.
5. Opportunities and venture charter.
6. Approvals, contributions, agreements.
7. Budget, chart of accounts, journal.
8. Assets and private document metadata.
9. Responsive UI and journey integration.
10. Notifications, exports, monitoring, backups, hardening.

## Not implemented by this document
No code, deployment, provisioning, identity-provider selection, migration execution, or legal entity is created by this specification. Each requires separate implementation and approval.

## Agentic runtime implementation extension

### Recommended first vertical slice
Implement one authenticated, read-only research workflow before building a multi-agent swarm:
1. User creates a research task inside a venture workspace.
2. API verifies identity, venture membership, task scope, and provider budget.
3. Orchestrator creates a task contract and an agent run record.
4. A single research agent uses one approved search adapter through the tool gateway.
5. Results are stored as evidence with source URL, timestamp, and provenance; large artifacts go to private R2.
6. A durable Workflow checkpoints each step, applies retry limits, and pauses if human review is required.
7. A verifier checks source coverage and acceptance criteria.
8. UI displays findings, citations, usage/cost, status, and audit trace.

### Suggested module boundaries
- `agents/registry`: definitions, versions, roles, release status.
- `agents/orchestrator`: planning, routing, dependency graph, budgets.
- `agents/runtime`: model adapter and execution loop.
- `agents/policy`: permissions, autonomy, approvals, venture isolation.
- `agents/memory`: scoped retrieval and provenance-aware writes.
- `tools/gateway`: schemas, allowlists, idempotency, provider adapters.
- `workflows`: durable orchestration, retry, escalation, human waits.
- `providers`: health, quota, usage, fallback, credential references.
- `evaluations`: golden tasks, adversarial tests, scorecards.
- `audit`: append-only event trail and trace correlation.

### Implementation order
Start with schema and policy tests, then read-only tool gateway, one agent, durable workflow, evaluation harness, and UI. Add specialist agents only after the first vertical slice demonstrates correct scoping, reliable recovery, source-grounded output, and bounded cost. Do not connect payment execution, public publishing, or production mutation tools in the initial runtime.


---

## Agentic OS implementation extension

### Additional backend modules
Agent Registry; Agent Versions; Agent Grants; Task Orchestration; Task Runs; Task Artifacts; Tool Broker; Provider Registry; Model Routing; Memory & Retrieval; Policy Decisions; Evaluations; Agent Incidents; Usage & Cost Ledger.

### Additional request/task flow
1. Authenticate the human requester or trusted system trigger.
2. Resolve workspace and venture scope.
3. Create a task contract and persist it before dispatch.
4. Resolve eligible registered agent(s) and approved provider route.
5. Evaluate data classification, permissions, autonomy, budget, quota, and approvals.
6. Dispatch asynchronously; record each task/run transition.
7. Broker each tool call through allowlist, idempotency, redaction, and audit.
8. Persist checkpoints and artifacts; validate output schema and provenance.
9. Run reviewer/evaluation checks; route to human approval when required.
10. Mark completed only after authoritative verification; otherwise fail, pause, or escalate.

### Additional repository modules (when justified)
~~~text
packages/agents/             Agent contracts, registry types, policies
packages/orchestration/      Task graph, state transitions, delegation
packages/providers/          Model/search/storage/identity adapters
packages/tool-broker/        Allowlist, scopes, idempotency, redaction
packages/evaluations/        Agent test suites and quality checks
apps/worker/src/agents/      Agent API and task handlers
migrations/                  Agent/task/provider/audit schema migrations
tests/agents/                Permission, isolation, reliability, quality tests
~~~

### Engineering constraints
- Persist before dispatch; use queue/workflow-based execution for long-running tasks.
- Avoid keeping critical run state only in memory.
- Separate agent definition from agent run and task state.
- Store secret references, never raw API keys, in operational records.
- Add per-task/provider usage and cost accounting.
- Enforce parent-to-child permission narrowing.
- Treat generated memory as non-authoritative; use source records for rights, finance, and approvals.
- Start with one low-risk agent vertical slice; do not build a large agent fleet before orchestration and security are proven.
