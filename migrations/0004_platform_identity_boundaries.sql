-- MAELVYN schema v0004 — platform identity & account boundaries
-- Implements docs/PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md v1.1.0.
-- Account identity, platform role, workspace membership and venture assignment are separate records.
PRAGMA foreign_keys = ON;

-- Exactly one active platform owner, bound to a stable provider subject + server-verified primary email.
CREATE TABLE platform_roles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('platform_owner')),
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  verified_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','transferred')),
  evidence_json TEXT NOT NULL,
  bound_at TEXT NOT NULL,
  ended_at TEXT
);
CREATE UNIQUE INDEX uq_platform_owner_active ON platform_roles(role) WHERE status = 'active';
CREATE TRIGGER trg_platform_roles_no_delete BEFORE DELETE ON platform_roles
BEGIN SELECT RAISE(ABORT, 'platform roles cannot be deleted'); END;
CREATE TRIGGER trg_platform_roles_binding_immutable BEFORE UPDATE ON platform_roles
WHEN OLD.status <> 'active' OR NEW.person_id <> OLD.person_id OR NEW.provider_subject <> OLD.provider_subject OR NEW.verified_email <> OLD.verified_email
BEGIN SELECT RAISE(ABORT, 'platform owner binding is immutable; use an audited owner-transfer procedure'); END;

-- Platform-level append-only audit (workspace-independent actions such as owner binding).
CREATE TABLE platform_audit_events (
  id TEXT PRIMARY KEY,
  actor_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  reason TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);
CREATE TRIGGER trg_platform_audit_no_update BEFORE UPDATE ON platform_audit_events
BEGIN SELECT RAISE(ABORT, 'platform_audit_events are append-only'); END;
CREATE TRIGGER trg_platform_audit_no_delete BEFORE DELETE ON platform_audit_events
BEGIN SELECT RAISE(ABORT, 'platform_audit_events are append-only'); END;

-- Accounts that may only receive scoped access through an explicit Platform Owner authorization.
CREATE TABLE account_policies (
  email_lower TEXT PRIMARY KEY,
  policy TEXT NOT NULL CHECK (policy IN ('owner_authorization_required')),
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO account_policies (email_lower, policy, reason, source, created_at) VALUES
 ('elfares621@gmail.com','owner_authorization_required','ACCOUNT_ONLY / NO_MEMBERSHIP until a separate, explicit Platform Owner authorization','docs/PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md v1.1.0 §2','2026-11-17T00:00:00.000Z'),
 ('elmatador0197@gmail.com','owner_authorization_required','ACCOUNT_ONLY / NO_MEMBERSHIP until a separate, explicit Platform Owner authorization','docs/PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md v1.1.0 §2','2026-11-17T00:00:00.000Z');

-- Verified primary email cached from the identity provider (refreshed on sensitive actions).
ALTER TABLE people ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0,1));

-- Invitations are bound to one intended, verified email and carry a reason; venture access is never part of an invitation.
ALTER TABLE workspace_invitations ADD COLUMN invitee_email TEXT;
ALTER TABLE workspace_invitations ADD COLUMN reason TEXT;
ALTER TABLE workspace_invitations ADD COLUMN review_date TEXT;
ALTER TABLE workspace_invitations ADD COLUMN owner_authorized INTEGER NOT NULL DEFAULT 0 CHECK (owner_authorized IN (0,1));

-- Venture assignments are separate, proposed first and activated only by the assignee's acceptance.
ALTER TABLE venture_members ADD COLUMN proposed_by_person_id TEXT REFERENCES people(id);
ALTER TABLE venture_members ADD COLUMN accepted_at TEXT;
ALTER TABLE venture_members ADD COLUMN reason TEXT;

-- ---------------------------------------------------------------------------
-- Reconciliation of legacy development records (audited, records preserved).
-- Before this migration no Platform Owner existed, so every existing membership was created through the
-- former development self-service path without owner authorization. Policy v1.1.0 requires no default
-- membership; these are suspended/ended (never deleted) and each change is recorded in audit_events.
-- ---------------------------------------------------------------------------
INSERT INTO audit_events (id, workspace_id, venture_id, actor_person_id, action, target_type, target_id, request_id, reason, metadata_json, created_at)
SELECT 'aud_' || lower(hex(randomblob(12))), workspace_id, NULL, NULL, 'membership.suspended_by_reconciliation', 'person', person_id, 'migration-0004',
       'Platform identity policy v1.1.0: no membership without owner authorization; legacy self-service membership suspended',
       json_object('previous_role', role, 'previous_status', status), strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM workspace_members WHERE status IN ('active','invited');
UPDATE workspace_members SET status = 'suspended', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE status IN ('active','invited');

INSERT INTO audit_events (id, workspace_id, venture_id, actor_person_id, action, target_type, target_id, request_id, reason, metadata_json, created_at)
SELECT 'aud_' || lower(hex(randomblob(12))), v.workspace_id, vm.venture_id, NULL, 'venture_assignment.ended_by_reconciliation', 'person', vm.person_id, 'migration-0004',
       'Platform identity policy v1.1.0: legacy venture assignment ended', json_object('previous_status', vm.status, 'role_label', vm.role_label), strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM venture_members vm JOIN ventures v ON v.id = vm.venture_id WHERE vm.status IN ('active','proposed');
UPDATE venture_members SET status = 'ended', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE status IN ('active','proposed');

INSERT INTO audit_events (id, workspace_id, venture_id, actor_person_id, action, target_type, target_id, request_id, reason, metadata_json, created_at)
SELECT 'aud_' || lower(hex(randomblob(12))), workspace_id, NULL, NULL, 'invitation.revoked_by_reconciliation', 'invitation', id, 'migration-0004',
       'Platform identity policy v1.1.0: pending legacy invitation not bound to a verified email', NULL, strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM workspace_invitations WHERE status = 'pending';
UPDATE workspace_invitations SET status = 'revoked', revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE status = 'pending';
