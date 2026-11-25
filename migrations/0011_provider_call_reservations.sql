-- One durable reservation per task/capability; finalized usage reuses the reservation ID.
CREATE TABLE provider_call_reservations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  provider_id TEXT NOT NULL REFERENCES provider_registry(id) ON DELETE RESTRICT,
  capability TEXT NOT NULL CHECK (capability IN ('search.web', 'extract.page')),
  estimated_credits INTEGER NOT NULL CHECK (estimated_credits > 0),
  usage_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (task_id, capability)
);
CREATE INDEX provider_reservations_daily ON provider_call_reservations(workspace_id, provider_id, usage_date);
