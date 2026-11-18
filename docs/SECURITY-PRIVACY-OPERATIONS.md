# MAELVYN — Security, Privacy & Operations Baseline

**Version:** 1.0  
**Status:** Proposed controls; review before live participant data

## Data classification
| Class | Examples | Default handling |
|---|---|---|
| Public | Approved brand copy/case studies | Public website |
| Internal | Opportunity notes, internal plans | Authenticated workspace |
| Confidential | Agreements, budgets, contributor records | Venture-scoped access |
| Restricted | Identity evidence, sensitive personal/financial records | Least privilege, limited retention, explicit access logging |

Do not store bank credentials, card data, passwords, or unnecessary identity documents.

## Access control
Deny by default. Authenticate every private request. Authorize every read/write server-side. Scope membership by workspace and venture. Separate application role from legal relationship and ownership. Require elevated authorization for role changes, ownership, debt, guarantees, distributions, sensitive exports, and destructive admin actions. Support session revocation and periodic access review.

## Application security
Validate server-side; parameterize SQL; configure CORS allowlist, CSRF protections appropriate to auth mode, secure cookies, CSP, security headers, body limits, and rate limits. Prevent IDOR by checking scope for every object. Keep secrets in encrypted platform storage. Redact personal/financial data from logs. Scan dependencies and uploads. Use private buckets and short-lived access.

## Financial integrity
Use integer IDR amounts and explicit currency. Distinguish cash received, revenue recognition, expenses, payables, debt, reserves, and distributable surplus. Budget approval is separate from payment. Enforce double-entry balance and immutable posted journals. Reconcile to source evidence. AI/automation cannot authorize or execute commitments.

## Audit and evidence
Audit invitations/membership, role changes, charter decisions, contributions/ownership, agreement status, budgets, approvals/votes, journal posts/reversals, asset rights/custody, document access/exports, offboarding, security settings, and admin actions. Record actor, action, target, timestamp, request ID, outcome, minimal change metadata. Never log secrets or full sensitive content.

## Privacy and retention
Collect only necessary data for a stated purpose. Explain access. Define retention per data class and legal obligations. Support correction and lawful deletion where applicable. Preserve legally required records with restricted access. Encrypt and restrict backups. Do not use participant/customer data to train external AI without clear lawful basis and required authorization.

## Incident response
1. Detect and classify.
2. Contain access/integration.
3. Preserve logs/evidence.
4. Identify affected data, users, ventures, services.
5. Notify responsible owner and affected parties under applicable obligations.
6. Recover from known-good state.
7. Rotate credentials and revoke sessions.
8. Document cause, impact, remediation, and regression tests.

## Backup and recovery
Define backup frequency/retention; back up D1 and object metadata/files consistently; test restore in isolation; document RTO/RPO; test migration recovery; ensure backups do not reintroduce revoked access.

## Required runbooks
Deployment/rollback; migration; backup/restore; access review/offboarding; incident response; provider outage/credential rotation; financial reconciliation; export and data-subject requests.

## Production gate
Do not store real participant agreements, identity data, or live finance records until privacy/terms are reviewed, responsibilities understood, access/audit tests pass, restore is demonstrated, production resources are isolated, incident/offboarding procedures exist, and legal/accounting review is complete.

## Commerce security and privacy extension

Commerce introduces customer, order, payment metadata, partner, and fulfillment data. Apply data minimization and purpose limitation. Separate public listing fields from private customer/order records. Record consent and marketing preference where required. Restrict customer exports and support access by seller/venture scope.

Never store full card credentials or payment secrets. Verify provider webhook signatures, reject replayed events, and use idempotency. Keep payment status and accounting posting separate. Protect digital downloads with private object storage and short-lived access. Do not expose private R2 objects through public buckets.

For each offer document the legal seller, controller/processor responsibilities, commercial rights, refund/support policy, retention period, and incident contact. Cross-venture analytics should use approved aggregates and be assessed for re-identification risk.
