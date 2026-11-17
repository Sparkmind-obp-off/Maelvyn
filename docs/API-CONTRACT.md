# MAELVYN API Contract — MVP

**Version:** 0.1.0  
**Status:** Proposed contract

## Conventions

- Base URL: `/api/v1`
- JSON request and response bodies.
- UTC ISO-8601 timestamps.
- Opaque IDs; no sequential identifiers.
- All private endpoints require authenticated identity and server-side authorization.
- Every write request carries an `Idempotency-Key` where duplicate execution could create financial or governance effects.
- Every response includes `request_id`.
- Pagination uses `cursor` and `limit`; enforce a server-side maximum.
- Never trust role, member ID, workspace ID, venture ID, or approval state supplied by the browser without resolving and authorizing it server-side.

## Standard error shape

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {}
  },
  "request_id": "opaque-request-id"
}
```

Expected codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `BUDGET_EXCEEDED`, `APPROVAL_REQUIRED`, `LEDGER_NOT_BALANCED`, `INTERNAL_ERROR`.

## Initial endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/session` | Current principal and effective grants |
| GET/POST | `/ventures` | List/create venture draft |
| GET/PATCH | `/ventures/:id` | Read/update allowed venture fields |
| POST | `/ventures/:id/submit` | Submit charter for approval |
| GET/POST | `/contributions` | Record proposed contribution |
| GET/POST | `/agreements` | Register agreement metadata |
| GET/POST | `/ownership-interests` | Register proposed rights; effective state requires executed agreement |
| GET/POST | `/approvals` | Create/list approval requests |
| POST | `/approvals/:id/votes` | Record authorized vote |
| GET/POST | `/ventures/:id/budgets` | Read/create budget version |
| GET/POST | `/ventures/:id/finance/journals` | Draft journal entry |
| POST | `/finance/journals/:id/post` | Validate and post balanced journal |
| POST | `/finance/journals/:id/reverse` | Create linked reversal entry |
| GET | `/audit-events` | Restricted audit search |

## Approval state machine

`draft → submitted → approved | rejected | cancelled`

- Only authorized requesters can submit.
- Required approvers are resolved from the applicable policy snapshot.
- A requester cannot approve their own request when separation of duties is required.
- A vote is immutable; corrections require a superseding decision event.
- Approval does not execute a payment, transfer, contract signature, or asset transfer.
- Material changes after approval invalidate the approval and require resubmission.

## Journal state machine

`draft → posted`; posted entries may be corrected only by a linked `reversal` entry.

- Drafts can be edited by authorized finance roles.
- Posting validates balance, currency, scope, budget/approval references, and idempotency.
- Posted entries are immutable.
- No hard delete for posted entries.
- Reversal references the original entry and uses equal/opposite lines.

## Authorization policy (initial)

| Capability | Workspace admin | Governance approver | Venture operator | Finance operator | Viewer |
|---|---:|---:|---:|---:|---:|
| Read workspace | Yes | Yes | Scoped | Scoped | Granted scope |
| Create venture draft | Yes | Yes | Scoped | No | No |
| Submit charter | Yes | Yes | Scoped | No | No |
| Approve reserved matter | If designated | If designated | No self-approval | No | No |
| Draft expense/journal | Yes | No | Scoped request | Scoped | No |
| Post journal | If designated | No | No | If designated | No |
| Change ownership register | No unilateral action | Per agreement | No | No | No |
| Export audit | Restricted grant | Restricted grant | No | Finance scope | No |

This is a starting policy matrix, not a declaration that any person currently holds a role. Actual grants must be explicitly assigned and reviewed.

## Sensitive operations requiring elevated control

- Adding/removing a participant.
- Changing roles or approval thresholds.
- Marking an agreement executed.
- Making an ownership interest effective.
- Approving debt, guarantees, investment, distributions, or material asset transfers.
- Posting/reversing journal entries.
- Exporting financial or personal data.

Require fresh authorization, reason codes, audit events, and, where appropriate, a second approver.

## API implementation sequence

1. Session and access-control middleware.
2. Workspace and membership read paths.
3. Venture CRUD and charter workflow.
4. Agreement/contribution/ownership registries.
5. Approval engine.
6. Chart of accounts and journal posting.
7. Audit search and exports.
8. Frontend integration.
