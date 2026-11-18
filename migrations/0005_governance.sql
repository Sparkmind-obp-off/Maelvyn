-- MAELVYN schema v0005 — governance: approval engine, decision register, charters, lifecycle, access reviews.
PRAGMA foreign_keys = ON;

ALTER TABLE approval_requests ADD COLUMN required_approvals INTEGER NOT NULL DEFAULT 1;
ALTER TABLE approval_requests ADD COLUMN eligible_roles_json TEXT;
ALTER TABLE approval_requests ADD COLUMN expires_at TEXT;
ALTER TABLE approval_requests ADD COLUMN payload_json TEXT;
ALTER TABLE approval_requests ADD COLUMN payload_hash TEXT;
ALTER TABLE approval_requests ADD COLUMN closed_reason TEXT;
ALTER TABLE approval_requests ADD COLUMN executed_at TEXT;
ALTER TABLE approval_requests ADD COLUMN subject_person_id TEXT REFERENCES people(id);
CREATE INDEX idx_approvals_target ON approval_requests(target_type, target_id, status);

-- A decided request can never be reopened or have its payload altered.
CREATE TRIGGER trg_approval_requests_decided_immutable BEFORE UPDATE ON approval_requests
WHEN OLD.status IN ('approved','rejected','cancelled','superseded')
BEGIN SELECT RAISE(ABORT, 'decided approval requests are immutable'); END;
CREATE TRIGGER trg_approval_requests_no_delete BEFORE DELETE ON approval_requests
WHEN OLD.status <> 'draft'
BEGIN SELECT RAISE(ABORT, 'submitted approval requests cannot be deleted'); END;

CREATE TABLE approval_events (
  id TEXT PRIMARY KEY,
  approval_request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE RESTRICT,
  event TEXT NOT NULL CHECK (event IN ('submitted','vote','approved','rejected','withdrawn','expired','superseded','executed','conflict_declared')),
  actor_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_approval_events_req ON approval_events(approval_request_id, created_at);
CREATE TRIGGER trg_approval_events_no_update BEFORE UPDATE ON approval_events BEGIN SELECT RAISE(ABORT, 'approval_events are append-only'); END;
CREATE TRIGGER trg_approval_events_no_delete BEFORE DELETE ON approval_events BEGIN SELECT RAISE(ABORT, 'approval_events are append-only'); END;

CREATE TABLE conflict_declarations (
  id TEXT PRIMARY KEY,
  approval_request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE RESTRICT,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(approval_request_id, person_id)
);
CREATE TRIGGER trg_conflicts_no_update BEFORE UPDATE ON conflict_declarations BEGIN SELECT RAISE(ABORT, 'conflict declarations are append-only'); END;
CREATE TRIGGER trg_conflicts_no_delete BEFORE DELETE ON conflict_declarations BEGIN SELECT RAISE(ABORT, 'conflict declarations are append-only'); END;

CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  approval_request_id TEXT NOT NULL UNIQUE REFERENCES approval_requests(id) ON DELETE RESTRICT,
  decision_type TEXT NOT NULL,
  title TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('approved','rejected','superseded')),
  summary TEXT NOT NULL,
  authority_json TEXT NOT NULL,
  decided_at TEXT NOT NULL
);
CREATE INDEX idx_decisions_ws ON decisions(workspace_id, decided_at);
CREATE TRIGGER trg_decisions_no_update BEFORE UPDATE ON decisions BEGIN SELECT RAISE(ABORT, 'decisions are append-only'); END;
CREATE TRIGGER trg_decisions_no_delete BEFORE DELETE ON decisions BEGIN SELECT RAISE(ABORT, 'decisions are append-only'); END;

CREATE TABLE venture_charters (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','superseded')),
  content_json TEXT NOT NULL,
  approval_request_id TEXT REFERENCES approval_requests(id) ON DELETE RESTRICT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(venture_id, version)
);
CREATE TRIGGER trg_charters_immutable BEFORE UPDATE ON venture_charters
WHEN OLD.status IN ('rejected','superseded')
  OR (OLD.status = 'approved' AND (NEW.status <> 'superseded' OR NEW.content_json <> OLD.content_json))
  OR (OLD.status = 'submitted' AND NEW.content_json <> OLD.content_json)
BEGIN SELECT RAISE(ABORT, 'charter version is locked'); END;
CREATE TRIGGER trg_charters_no_delete BEFORE DELETE ON venture_charters BEGIN SELECT RAISE(ABORT, 'charters cannot be deleted'); END;

CREATE TABLE venture_stage_history (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  approval_request_id TEXT REFERENCES approval_requests(id) ON DELETE RESTRICT,
  changed_at TEXT NOT NULL
);
CREATE TRIGGER trg_stage_history_no_update BEFORE UPDATE ON venture_stage_history BEGIN SELECT RAISE(ABORT, 'stage history is append-only'); END;
CREATE TRIGGER trg_stage_history_no_delete BEFORE DELETE ON venture_stage_history BEGIN SELECT RAISE(ABORT, 'stage history is append-only'); END;

CREATE TABLE access_reviews (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  reviewer_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  findings_json TEXT NOT NULL,
  notes TEXT,
  completed_at TEXT NOT NULL
);
CREATE TRIGGER trg_access_reviews_no_update BEFORE UPDATE ON access_reviews BEGIN SELECT RAISE(ABORT, 'access reviews are append-only'); END;
CREATE TRIGGER trg_access_reviews_no_delete BEFORE DELETE ON access_reviews BEGIN SELECT RAISE(ABORT, 'access reviews are append-only'); END;
