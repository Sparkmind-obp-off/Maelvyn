-- MAELVYN schema v0003 — workspace invitations (P1 membership lifecycle).
-- Additive only. Invitation tokens are stored as SHA-256 hashes; the plaintext is shown once to the inviter.
-- Accepting an invitation is an explicit, voluntary act by the invitee (silence is never consent).
PRAGMA foreign_keys = ON;

CREATE TABLE workspace_invitations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('workspace_admin','governance_approver','venture_operator','finance_operator','viewer')),
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  accepted_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_invitations_workspace ON workspace_invitations(workspace_id, status, created_at);

-- A decided invitation (accepted/revoked) can never be reopened or altered.
CREATE TRIGGER trg_invitation_decided_immutable BEFORE UPDATE ON workspace_invitations
WHEN OLD.status <> 'pending'
BEGIN SELECT RAISE(ABORT, 'decided invitations are immutable'); END;

CREATE TRIGGER trg_invitation_no_delete BEFORE DELETE ON workspace_invitations
BEGIN SELECT RAISE(ABORT, 'invitations cannot be deleted; revoke instead'); END;
