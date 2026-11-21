# MAELVYN — Governance & Decision Rights

**Status:** Control baseline  
**Applies to:** Studio, ventures, Factory, OS, agents, providers, distribution, and customer operations

## 1. Governance design principle

MAELVYN uses two operating speeds:
- **Fast execution:** teams and agents may execute routine, pre-approved work inside a written scope, budget, data boundary, and deadline.
- **Reserved decisions:** decisions affecting ownership, capital, legal obligations, customers' rights, sensitive data, public publication, payments, production infrastructure, or material risk require explicit human authorization.

Governance should protect the business without forcing every low-risk task through a committee. Autonomy is granted by capability and risk tier, not by an agent's confidence or model quality.

## 2. Decision roles

| Role | Primary accountability | Cannot unilaterally do |
|---|---|---|
| Studio Operator | Shared operations, portfolio coordination, delivery capacity, vendor relationships | Change ownership or approve their own reserved matter |
| Investment / Portfolio Decision Owner | Venture selection, capital/resource allocation, stage-gate decisions, hold/exit | Override law, signed contracts, or customer rights |
| Venture Managing Operator | Venture P&L, customer outcomes, roadmap, delivery, team | Spend beyond approved budget or bind another venture |
| Finance Controller | Books, reconciliation, cost allocation, budget monitoring | Approve their own payment exception or falsify source evidence |
| Rights / Legal Reviewer | Agreements, IP provenance, licenses, data and terms review | Give legal advice outside professional competence |
| System / Security Owner | Access policy, secrets, isolation, incident response, kill switches | Disable audit or bypass reserved approvals |
| Agent Owner | Agent purpose, allowed tools/data, quality, monitoring, rollback | Approve its own output or expand its own permissions |
| Human Approver | Decide a specific reserved action with evidence | Approve a request without reviewing its scope and consequences |

In a one-person stage, one person may hold multiple roles, but the system must still record which capacity they are acting in. For high-risk actions, introduce an independent reviewer before granting L3/L4 autonomy or external capital rights.

## 3. Reserved matters

Human approval is mandatory for:
- venture formation, spinout, closure, merger, or restructuring;
- ownership, equity, revenue share, profit share, or participant entitlement;
- capital contribution, loans, guarantees, new debt, or budget increases;
- bank account, payment processor, refund, payout, or transfer of money;
- signing or changing customer, partner, employment, contractor, IP, or data-processing agreements;
- public listings, paid ads, public social publishing, or binding commercial claims;
- production deployment, destructive database migration, or changing security boundaries;
- use of personal, confidential, restricted, or regulated data;
- enabling paid provider execution or increasing its cap;
- changing agent permissions, tool allowlists, autonomy level, or kill-switch state;
- resolving a serious customer complaint, data incident, or rights dispute.

Approval must be scoped to the exact action, target, amount/limit, environment, and validity period. A general approval is not a standing blank cheque.

## 4. Autonomy levels

| Level | Allowed behavior | Required control |
|---|---|---|
| L1 — Prepare | Read allowed data, research, draft, recommend | Human reviews before any external or material write |
| L2 — Supervised execution | Execute low-risk internal tasks in an approved task contract | Human approval before external side effect; bounded retries and logs |
| L3 — Bounded autonomy | Execute pre-approved action types within strict scope, budget, rate, and data policy | Owner, monitoring, kill switch, periodic review, exception escalation |
| L4 — High impact | High-impact or materially consequential operations | Independent oversight, adversarial testing, formal rollback/decommission plan; not enabled by default |

An agent cannot self-upgrade its level, change its allowlist, approve its own output, or remove its audit trail.

## 5. Financial controls

- Every venture has a separate budget and financial reporting scope.
- Every paid provider call reserves budget before execution and records actual cost after execution.
- No paid call when provider, capability, price, rights, budget, or approval is unknown.
- Budget caps are hard limits, not suggestions.
- Every order/payment/refund must map to a legal seller and source transaction.
- Posted journals are immutable; corrections use reversal entries.
- Factory internal work is costed to the consuming venture. Capital contribution and service invoice are different legal/economic events.
- Do not mix personal funds, Studio funds, and venture funds without a documented loan, reimbursement, contribution, or service agreement.

## 6. Ownership, contribution, and IP

- Participation is voluntary and specific.
- Silence, access, effort, or task completion does not create ownership.
- Contribution records are not ownership grants.
- Equity, revenue share, profit share, license, loan, reimbursement, and service fee are distinct legal characters.
- Any ownership interest must reference a reviewed and executed agreement.
- Each asset records legal owner, custody, usage rights, and evidence.
- Every employee, contractor, creator, and partner arrangement must document background IP, newly created IP, license/assignment scope, attribution, third-party materials, and permitted reuse.
- Do not assign a person's or partner's IP to MAELVYN merely because it was uploaded or used in a workflow.

## 7. Data and customer boundary

External customer identities and customer records are not internal workspace members by default. Customers see only their own account, orders, approved deliverables, invoices/receipts, and support communications.

The following must never be exposed to customer-facing surfaces:
- internal workspace and venture membership;
- prompts, agent memory, raw provider payloads, credentials, secret names, and execution logs;
- other customers' records or artifacts;
- internal budgets, margin, provider pricing, or portfolio decisions;
- unapproved drafts and private production assets.

All external inputs are untrusted. Validate, sanitize, scope, and store only what is necessary. Personal data must have a defined purpose, retention, access, and deletion/response procedure consistent with applicable Indonesian law.

## 8. Incident and stop authority

Any operator may stop a workflow when they detect a safety, privacy, rights, financial, or customer-impact risk. The System/Security Owner can engage workspace, agent, provider, or system kill switches. Restart requires a documented cause, mitigation, and approval appropriate to the risk.

A serious incident requires:
1. stop and contain;
2. preserve logs and evidence;
3. assess affected customers, ventures, providers, and data;
4. notify the accountable human;
5. meet applicable contractual/legal notification obligations;
6. remediate and test;
7. record a post-incident review and prevent recurrence.

## 9. Governance checks before production

- [ ] Legal seller and responsible operator are identified.
- [ ] Customer terms, privacy notice, refund and support procedures are approved.
- [ ] Venture charter, budget, owner, and stage gate are recorded.
- [ ] Product rights and provider commercial-use terms are checked.
- [ ] Agent owner, tool allowlist, autonomy, data class, and approval policy are registered.
- [ ] Cross-venture isolation tests pass.
- [ ] Secrets are server-side and environment-scoped.
- [ ] Paid execution is disabled unless explicitly approved and capped.
- [ ] Audit, recovery, and kill-switch tests pass.
- [ ] Production readiness checks pass; no missing required binding or migration.
