# MAELVYN — Full-Stack Implementation Blueprint

**Version:** 1.0  
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