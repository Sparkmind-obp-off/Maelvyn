-- MAELVYN Connect: auditable, human-reviewable status proposals.
-- No direct task mutation is performed by Connect.
PRAGMA foreign_keys = ON;

CREATE TABLE connect_status_proposals (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  task_id TEXT REFERENCES tasks(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  requested_status TEXT NOT NULL CHECK (requested_status IN ('proposed','in_progress','blocked','done','needs_review')),
  note TEXT,
  source TEXT NOT NULL CHECK (source IN ('api','mcp')),
  requested_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_connect_proposals_workspace ON connect_status_proposals(workspace_id, status, created_at);
CREATE INDEX idx_connect_proposals_venture ON connect_status_proposals(venture_id, created_at);

CREATE TRIGGER trg_connect_proposals_no_delete BEFORE DELETE ON connect_status_proposals
BEGIN SELECT RAISE(ABORT, 'connect status proposals cannot be deleted'); END;
