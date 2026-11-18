# MAELVYN — Product Requirements & MVP Scope

**Version:** 1.0  
**Status:** Proposed product requirements

## Product shape
A private, invitation-based operating workspace. The public website explains the concept; the application is a controlled workspace. It is not an open registration marketplace.

## Information architecture
1. Home — portfolio snapshot, assigned work, pending decisions, activity.
2. Opportunities — research pipeline, assumptions, evidence, validation.
3. Ventures — lifecycle, charter, team, milestones, risks.
4. Approvals — pending decisions and decision history.
5. Finance — budgets, transactions, journals, liabilities, reports.
6. Assets — productive assets, custody, utilization, maintenance, rights evidence.
7. People & Agreements — invitations, roles, contributions, agreements, rights.
8. Documents — private files and evidence.
9. Reports — scoped venture and portfolio reporting.
10. Settings & Audit — access policy, audit trail, security, retention.

Navigation visibility is not authorization. Every API route independently checks access.

## MVP scope
### P0 — Controlled pilot
- Private workspace, invitations, revocation, identity adapter.
- Workspace membership and venture-scoped permissions.
- Opportunity intake with source, confidence, assumptions, and status.
- Venture charter draft/submit/approve and lifecycle.
- Contribution classification: service, loan, license, asset use, reimbursement, capital contribution, other reviewed type.
- Agreement metadata and execution evidence.
- Ownership register remains proposed until required agreement and approvals are recorded.
- Approval requests and immutable decision history.
- Versioned venture budgets and thresholds.
- Draft journals, balanced posting, reversals.
- Asset register and evidence references.
- Audit events, scoped exports, backups, restore test, access review.

### P1 — After pilot evidence
Private R2 documents, receipts/expenses, receivables/payables, cash forecast, monthly reporting, notifications, milestones/tasks, authorized search, offboarding workflow, webhooks.

### P2 — After operational/legal review
Payment execution, e-signature, accounting sync, asset depreciation/valuation, multi-entity consolidation, AI research/drafting, external collaborator portal.

## Core entities
Workspace, Person, IdentityLink, Membership, RoleGrant, Venture, VentureMember, Opportunity, Evidence, VentureCharter, Milestone, Risk, Agreement, AgreementParty, Contribution, OwnershipInterest, ApprovalRequest, ApprovalVote, Budget, FinanceAccount, JournalEntry, JournalLine, Asset, DocumentMetadata, Task, Notification, AuditEvent, IntegrationConnection, IdempotencyRecord.

## Key user stories and acceptance criteria
**Opportunity:** create a problem hypothesis with customer, source, assumptions, confidence, and next test. A draft never creates a venture or spending authority.

**Venture:** submit a charter with scope, owner, budget, risks, contributors, success and stop criteria. Approval only activates the defined scope; material changes require resubmission.

**Participation:** invited person can accept or decline a clearly scoped role. Acceptance is not an investment, IP transfer, partnership, or equity agreement.

**Finance:** finance operator drafts and posts balanced journals. Server validates account, venture, currency, debit/credit equality, and idempotency. Posted entries are immutable; correction uses reversal.

**Approval:** rights-holder sees evidence, impact, conflicts, and scope. Self-approval is blocked where policy requires. Approval does not execute payment or transfer rights.

## Required states
Opportunity: draft, researching, validating, selected, parked, rejected.  
Venture: proposed, validation, approved-pilot, build, launch, operate, scale, hold, restructure, exit, closed.  
Agreement: draft, under-review, approved-for-signature, executed, expired, terminated, superseded.  
Contribution: proposed, classified, under-review, approved, accepted, rejected, returned, disputed.  
Approval: draft, submitted, approved, rejected, cancelled, superseded.  
Journal: draft, posted, reversed.

Transitions are enforced by domain services, not UI controls.

## Reporting and export
Search and exports are permission-scoped. Portfolio summaries retain venture drill-down. Sensitive exports require reason capture, audit event, and bounded result size.

## Release definition
P0 workflows, role-boundary tests, financial invariants, migration/restore tests, and manual security review must pass. Public signup and public investment functionality are excluded.

## Commerce OS requirements extension

The commerce product target is hybrid: a central discovery marketplace, independent venture storefronts, and partner/distribution channels. The first MVP must not attempt a full multi-vendor marketplace.

### Initial commerce MVP
1. Seller/venture/product/rights registry.
2. Product catalogue and offer versioning.
3. One independent storefront.
4. Order creation and immutable order snapshot.
5. Payment status adapter in test mode.
6. Digital or manual service fulfillment with verifiable completion.
7. Venture-level revenue/cost reporting and reconciliation evidence.
8. Customer support and refund workflow.

### Explicit non-goals for first release
- Custody or automatic splitting of third-party funds.
- Public self-service vendor onboarding.
- Autonomous pricing or payout changes.
- Cross-venture customer data sharing.
- Unreviewed affiliate commission or tax calculations.
- Listing products without verified seller and commercial rights.

Acceptance criteria and module boundaries are defined in `docs/COMMERCE-OS-MASTER-ARCHITECTURE.md`.
