-- MAELVYN schema v0008 — scoped memory, in-app notifications, data-subject requests.
PRAGMA foreign_keys = ON;

CREATE TABLE memory_records (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('source_finding','decision','insight','hypothesis','note')),
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('research_artifact','decision','experiment','manual')),
  source_id TEXT,
  citations_json TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('verified_decision','unverified','hypothesis')),
  sensitivity TEXT NOT NULL DEFAULT 'internal' CHECK (sensitivity IN ('internal','confidential')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retracted')),
  retract_reason TEXT,
  created_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  retracted_at TEXT
);
CREATE INDEX idx_memory_venture ON memory_records(venture_id, status, created_at);
CREATE TRIGGER trg_memory_content_immutable BEFORE UPDATE ON memory_records
WHEN OLD.status <> 'active' OR NEW.content <> OLD.content OR NEW.venture_id <> OLD.venture_id
BEGIN SELECT RAISE(ABORT, 'memory content is immutable; retract and create a correction'); END;
CREATE TRIGGER trg_memory_no_delete BEFORE DELETE ON memory_records BEGIN SELECT RAISE(ABORT, 'memory records cannot be deleted; retract instead'); END;

CREATE TABLE memory_access_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  query TEXT,
  result_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TRIGGER trg_memory_access_no_update BEFORE UPDATE ON memory_access_events BEGIN SELECT RAISE(ABORT, 'memory access events are append-only'); END;

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_notifications_person ON notifications(person_id, read_at, created_at);

CREATE TABLE data_requests (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  request_type TEXT NOT NULL CHECK (request_type IN ('export','deletion','correction')),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','declined')),
  resolution TEXT,
  resolved_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
