# MAELVYN — Platform Account & Administrator Boundary Policy

**Version:** 1.1.0  
**Status:** Approved governance decision; live identity binding remains to be verified  
**Applies to:** All MAELVYN environments, accounts, workspaces, ventures, APIs, agents and administrative interfaces

## 1. The one administrator rule

Exactly one account is the MAELVYN platform administrator / Platform Owner:

- Canonical account: `sparkmind.support@gmail.com`
- Canonical platform role: `platform_owner`
- Cardinality: exactly one active Platform Owner.

No other account is a platform administrator, Super Admin, delegated platform admin, Workspace Admin, or Venture Admin by default.

The owner account is the only account with platform administration authority. Do not create a second administrator role for convenience, fallback, or operational coverage. Any future succession must be a separately authorized, audited owner-transfer procedure; it is not ordinary role assignment.

## 2. Named accounts that are accounts only

The following are recognized account identities, but are **not administrators and are not workspace/venture members by virtue of being listed here**:

- `elfares621@gmail.com`
- `elmatador0197@gmail.com`

Their current MAELVYN status is **ACCOUNT_ONLY / NO_MEMBERSHIP**:
- They may have an authenticated account identity in Clerk.
- They have no default workspace membership.
- They have no default venture membership.
- They have no operational role, contributor role, viewer role, finance role, or administrative role.
- They cannot access private workspace or venture data unless a separate, explicit, future membership grant is approved and accepted under the membership policy.
- Their account existence must not create or imply participation, employment, partnership, ownership, investment, profit share, or other rights.

Do not automatically convert either account into a Member, Contributor, Viewer, Workspace Admin, Venture Lead, or any other role. Do not infer permission from email address, prior conversation, login, account creation, or presence in a user list.

## 3. Account identity versus membership

These concepts must be represented separately in the data model and UI:

1. **Account / Identity:** an authenticated principal known to MAELVYN, resolved from a verified Clerk session and stable Clerk subject ID.
2. **Platform role:** platform-wide authority. Only the canonical owner has `platform_owner`.
3. **Workspace membership:** an explicit relationship to one workspace, created only through an approved invitation/acceptance or explicit owner-authorized grant.
4. **Venture assignment:** an explicit relationship to one venture, separately granted within a workspace.
5. **Functional role:** a permission set attached only to an explicit workspace or venture scope, never automatically to the account itself.

An account is not a member. A login is not an invitation acceptance. An account listing is not a permission grant. A workspace membership does not automatically grant membership in every venture.

## 4. Authorization invariants

1. Deny by default. Every private API read/write and artifact retrieval is authorized server-side.
2. Resolve principal from a verified Clerk session and stable Clerk subject ID; never trust client-supplied email or role.
3. Resolve platform authority and scoped memberships from MAELVYN server-side records.
4. The owner binding requires verified primary email matching `sparkmind.support@gmail.com`, plus a persisted stable Clerk subject ID and controlled bootstrap evidence. Email text alone is not authorization.
5. Enforce exactly one active `platform_owner`. Protect it from ordinary role, membership, invitation, offboarding and user-management endpoints.
6. `elfares621@gmail.com` and `elmatador0197@gmail.com` remain `ACCOUNT_ONLY / NO_MEMBERSHIP` until a separate explicit authorization is made. Do not seed workspace or venture membership for them.
7. Workspace invitations are scoped to one workspace and activate only after the invitee explicitly accepts. Venture access requires its own explicit assignment.
8. No cross-workspace or cross-venture access by implication.
9. Revoking membership removes access but preserves records and audit history under retention policy.
10. Every grant, acceptance, role/scope change, revocation and owner action records actor, subject, old/new state, scope, reason, timestamp and correlation ID.
11. Agents, automations and delegated child tasks cannot grant themselves or others a platform role or membership.
12. A person cannot approve their own reserved decision or use account existence as consent.

## 5. Future grants

A future workspace or venture role for either account requires:
- a distinct, explicit authorization by the Platform Owner;
- named workspace and (where relevant) named venture scope;
- a defined functional role and permission list;
- invite/acceptance or equivalent recorded acknowledgement;
- reason, effective date, expiry/review date where appropriate;
- an immutable audit event.

Until all required steps are complete, status remains **ACCOUNT_ONLY / NO_MEMBERSHIP**.

## 6. Required implementation

1. Separate account identity, platform role, workspace membership and venture assignment in schema/API.
2. Add the single-owner bootstrap binding to verified Clerk subject ID.
3. Ensure new signups and Clerk users receive no workspace/venture membership by default.
4. Remove any automatic membership creation on first login, account discovery, or email allowlist.
5. Enforce owner-only platform administration on server routes, not just UI.
6. Ensure invite endpoints cannot grant platform roles and cannot auto-assign venture access.
7. Add an account directory view that clearly distinguishes Account Only, Workspace Member and Venture Assigned.
8. Add regression tests: only owner can administer; account-only user sees no workspace/venture data; first login creates no membership; no self-promotion; no email spoofing; invite acceptance is scoped; no cross-venture access; owner cannot be removed through ordinary routes.
9. Reconcile development records before any migration/backfill. Never silently change existing users or memberships.
10. Deploy to development only after all tests pass. Production remains blocked until independent readiness gates pass.

## 7. Verification status

Status as of 2026-11-18. Evidence comes from the repository, remote dev D1, tests, and the live dev deployment.

| Item | Status | Evidence |
|---|---|---|
| Stable Clerk subject bound to owner | **PENDING (by design)** | Code implemented: `POST /platform/owner/claim` re-reads the primary email from Clerk's Backend API, requires `verified` and equality with `sparkmind.support@gmail.com`, then stores the subject; there is a singleton unique index. The owner account does not exist yet in the Clerk Development instance, and the API cannot create it by email. Remote `platform_roles` = 0 rows. The owner must sign in with that Google account and claim. |
| Account-only identities exist in Clerk | VERIFIED | elmatador0197 → `user_3MF5i55huhkEruwohaSHRJKu7Mn`; elfares621 → `user_3MF54617VRWDY12yOTz1jkd4I1s` (Google). |
| Legacy workspace memberships | VERIFIED + RECONCILED | Before 0004, both accounts (and Synthetic Tester) were active `workspace_admin` of self-service workspaces. After 0004 (remote), all are `suspended`; 2 venture assignments ended. Audited as `membership.suspended_by_reconciliation` ×3 and `venture_assignment.ended_by_reconciliation` ×2 with `request_id=migration-0004`. A D1 export was taken before migrating. |
| First login auto-creates memberships | VERIFIED: NO | `resolvePrincipal` creates only `people` + `identity_links`. Tests cover this. Live E2E: a synthetic user has `memberships=0`, `account_status=ACCOUNT_ONLY`. |
| Server enforcement + deployed negative tests | VERIFIED (dev) | 63 automated tests (owner-only admin, no self-promotion, unverified/spoofed email rejected, policy accounts require owner authorization, invitations cannot grant admin, owner cannot be removed, cross-venture denial). Live: `POST /workspaces` → 403, `/platform/accounts` → 403, claim by non-owner → 403, tampered JWT → 401. |

Technical enforcement is claimed only for the development environment. Production remains blocked.
