-- 0009: Private R2 artifact metadata + short-lived, single-use delivery tokens.
-- Objects live in the private R2 bucket bound as ARTIFACTS; the bucket is never public.
-- Object keys are random and never returned to clients.

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','deleted')),
  uploaded_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  deleted_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  deleted_at TEXT
);
CREATE INDEX idx_artifacts_venture ON artifacts(venture_id, status, created_at);
CREATE INDEX idx_artifacts_workspace ON artifacts(workspace_id, status);
-- Deletion is a one-way status change; the scope of an artifact can never be rewritten.
CREATE TRIGGER trg_artifacts_scope_immutable BEFORE UPDATE OF workspace_id, venture_id, object_key, sha256, uploaded_by_person_id ON artifacts
BEGIN SELECT RAISE(ABORT, 'artifact scope is immutable'); END;
CREATE TRIGGER trg_artifacts_no_undelete BEFORE UPDATE OF status ON artifacts WHEN OLD.status = 'deleted'
BEGIN SELECT RAISE(ABORT, 'deleted artifacts cannot be restored'); END;
CREATE TRIGGER trg_artifacts_no_hard_delete BEFORE DELETE ON artifacts
BEGIN SELECT RAISE(ABORT, 'artifact records are retained for audit'); END;

CREATE TABLE artifact_delivery_tokens (
  token_hash TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE RESTRICT,
  issued_to_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_artifact_tokens_artifact ON artifact_delivery_tokens(artifact_id);
