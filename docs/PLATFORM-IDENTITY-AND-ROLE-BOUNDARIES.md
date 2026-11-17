# MAELVYN — Platform Identity & Role Boundary Policy

**Version:** 1.0.0  
**Status:** Approved governance decision; implementation and identity binding must be verified separately  
**Effective decision date:** 2026-11-17  
**Applies to:** All MAELVYN environments, workspaces, ventures, APIs, agents, automations, and administrative interfaces

## 1. Canonical platform authority

Exactly one account is designated as the **Platform Owner / Super Admin**:

- **Canonical owner email:** `sparkmind.support@gmail.com`
- **Platform role:** `platform_owner`
- **Cardinality:** exactly one active platform owner
- **Authority:** platform-wide governance and security administration, including appointing scoped administrators, managing platform configuration, and reviewing platform audit records.

No other account may receive `platform_owner` or `super_admin` by invitation, workspace membership, venture assignment, UI selection, agent recommendation, or default seeding.

This designation is a governance decision. It is not proof that the Clerk account has been securely bound yet. Implementation must resolve the verified Clerk identity to a stable Clerk subject ID; email text alone is not an authorization credential. The owner binding must require a verified primary email matching the canonical address and an explicit server-side bootstrap/configuration record. Do not grant ownership based only on a client-supplied email claim.

## 2. Named account role assignments

### 2.1 `elfares621@gmail.com`

**Assigned role:** `venture_operations_lead` (scoped; not platform admin)

Allowed, only within workspaces and ventures explicitly assigned:
- View permitted operational workspace and venture information.
- Create and edit draft opportunities, venture plans, charter drafts, tasks, milestones, research briefs, and operating reports.
- Coordinate assigned contributors and submit items for authorized review.
- View non-restricted operational metrics and records within assigned scope.

Not allowed by default:
- Platform configuration, platform-wide user administration, or owner succession.
- Granting/revoking workspace membership or changing another user's role.
- Approving their own or others' reserved decisions.
- Creating or changing ownership/equity/profit rights, legal agreements, or participant obligations.
- Approving budgets, payments, transfers, debt, investments, distributions, or financial journal posting.
- Accessing another venture, workspace, restricted personal data, credentials, or private finance records without a separate explicit grant.

This role does not automatically imply Workspace Admin, Venture Owner, legal representative, employee, investor, or equity holder.

### 2.2 `elmatador0197@gmail.com`

**Assigned role:** `venture_contributor` (scoped; not platform admin)

Allowed, only within workspaces and ventures explicitly assigned:
- View assigned tasks, milestones, and permitted venture materials.
- Create and edit own drafts, research notes, deliverables, and task updates.
- Submit work for review and see feedback relevant to assigned work.

Not allowed by default:
- Platform or workspace administration, member invitations, role changes, or offboarding.
- Venture-wide permission changes or access to unassigned ventures.
- Approval of budgets, payments, contracts, ownership, IP transfers, or reserved matters.
- Access to restricted financial, identity, security, or confidential records unless separately granted.

This role does not automatically imply employment, partnership, ownership, investment, or profit entitlement.

## 3. Role hierarchy and scope

Roles are not interchangeable. Platform roles and resource-scoped roles must be separate authorization dimensions.

| Role | Scope | Default capability |
|---|---|---|
| `platform_owner` | Entire MAELVYN platform | Sole platform-wide owner authority |
| `platform_admin` | Platform functions explicitly delegated | No owner succession or reserved owner powers |
| `workspace_admin` | One named workspace | Membership and workspace settings only within that workspace |
| `venture_operations_lead` | Explicitly assigned ventures | Operational drafts and coordination |
| `venture_lead` | One named venture | Venture execution within approved charter and budget |
| `venture_contributor` | Assigned venture/tasks | Contribute drafts and updates |
| `finance_preparer` | Explicit finance scope | Prepare/reconcile draft finance records; no payment approval |
| `finance_approver` | Explicit delegated approval scope | Approve only within documented thresholds; cannot approve own request |
| `researcher` | Assigned research scope | Research and evidence preparation |
| `viewer` | Explicitly assigned read scope | Read-only access |

Workspace and venture roles must be stored with their scope identifiers. A workspace role never implies platform-wide access. A venture role never grants access to sibling ventures.

## 4. Authorization invariants

1. Deny by default; enforce authorization server-side on every private read and write.
2. Resolve principal from a verified Clerk session and stable Clerk subject ID.
3. Resolve role and scope from MAELVYN's server-side records, never from browser state, user metadata, request body, or a role label supplied by an agent.
4. Match the canonical owner email only after Clerk confirms it as verified primary email; bind and persist the stable Clerk subject ID during controlled bootstrap.
5. Enforce exactly one active `platform_owner`. Prevent demotion, deletion, suspension, or replacement through ordinary membership endpoints.
6. Owner succession is a separate break-glass governance procedure with strong re-authentication, explicit evidence, audit event, and recovery controls; never an ordinary role dropdown.
7. Do not seed named emails into a live database until the corresponding Clerk subject IDs are verified and the account owner confirms access.
8. Workspace invitation grants only the explicitly selected workspace membership and does not automatically grant venture membership.
9. Offboarding revokes active scoped access while retaining audit and business records according to retention policy.
10. Every role grant, change, revocation, and scope change records actor, subject, old/new role, scope, reason, timestamp, and correlation ID.

## 5. Approval separation

The person preparing a request cannot approve their own request. Operational role does not equal financial authority. Finance preparation does not equal payment execution. The platform owner role does not silently override rights reserved to venture participants or executed agreements; reserved decisions still require the applicable rights-holders' explicit approval.

## 6. Implementation and rollout

Required implementation sequence:
1. Add canonical role constants and typed permission matrix.
2. Add a one-time owner bootstrap binding using verified Clerk identity and stable subject ID.
3. Separate platform roles from workspace and venture membership roles in the database and API.
4. Add server-side policy helpers and route guards; remove any reliance on client-supplied role fields.
5. Add UI labels that clearly show scope (Platform / Workspace / Venture).
6. Add regression tests for owner uniqueness, unverified email rejection, cross-workspace and cross-venture denial, self-promotion denial, member invitation boundaries, role-change audit, and owner-protection.
7. Reconcile existing development memberships before applying named account roles. Do not silently overwrite current records.
8. Deploy to development only after tests pass. Production remains blocked until its separate readiness gates are met.

## 7. Current implementation status

The assignments above are approved policy decisions. They must not be reported as technically enforced until:
- Clerk subject IDs for the three named accounts are verified;
- the platform owner bootstrap binding is persisted;
- server-side authorization and membership records are reconciled;
- automated permission tests pass against the deployed development application.

Until then, the policy is authoritative for new design and implementation, but the live database's actual role state is **UNVERIFIED**.
