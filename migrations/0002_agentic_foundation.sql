-- MAELVYN schema v0002 — agentic foundation (development).
-- Additive only: 0001 is not rewritten. Structure only; no participant or financial data.
-- Secrets are NEVER stored here: providers hold only an env secret *name* reference.
PRAGMA foreign_keys = ON;

-- Synthetic marker so development workspaces can never be confused with real ones.
ALTER TABLE workspaces ADD COLUMN is_synthetic INTEGER NOT NULL DEFAULT 1 CHECK (is_synthetic IN (0,1));

-- ---------------------------------------------------------------------------
-- Provider registry (global catalogue) + per-workspace activation policy
-- ---------------------------------------------------------------------------
CREATE TABLE provider_registry (
  id TEXT PRIMARY KEY,                       -- e.g. 'tavily'
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('search','extraction','actor','inference','mock')),
  capabilities_json TEXT NOT NULL,           -- JSON array of capability ids
  secret_ref TEXT,                           -- env var NAME only, never the value
  docs_url TEXT,
  pricing_note TEXT,
  is_external INTEGER NOT NULL CHECK (is_external IN (0,1)),
  created_at TEXT NOT NULL
);

CREATE TABLE workspace_provider_settings (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  provider_id TEXT NOT NULL REFERENCES provider_registry(id) ON DELETE RESTRICT,
  live_enabled INTEGER NOT NULL DEFAULT 0 CHECK (live_enabled IN (0,1)),
  paid_execution_allowed INTEGER NOT NULL DEFAULT 0 CHECK (paid_execution_allowed IN (0,1)),
  daily_credit_cap INTEGER NOT NULL DEFAULT 0 CHECK (daily_credit_cap >= 0),
  per_task_credit_cap INTEGER NOT NULL DEFAULT 0 CHECK (per_task_credit_cap >= 0),
  actor_allowlist_json TEXT NOT NULL DEFAULT '[]',
  last_health_status TEXT,
  last_health_at TEXT,
  updated_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, provider_id)
);

-- ---------------------------------------------------------------------------
-- Agent registry and versions
-- ---------------------------------------------------------------------------
CREATE TABLE agent_registry (
  id TEXT PRIMARY KEY,                       -- e.g. 'research-brief'
  display_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  specialist_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','suspended','retired')),
  created_at TEXT NOT NULL
);

CREATE TABLE agent_versions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_registry(id) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  autonomy_level TEXT NOT NULL CHECK (autonomy_level IN ('L1','L2','L3','L4')),
  tool_allowlist_json TEXT NOT NULL,
  data_classes_json TEXT NOT NULL,
  max_task_credits INTEGER NOT NULL CHECK (max_task_credits >= 0),
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0,1)),
  created_at TEXT NOT NULL,
  UNIQUE(agent_id, version)
);

-- ---------------------------------------------------------------------------
-- Kill switches (workspace-scoped; system-wide switch is an env var)
-- ---------------------------------------------------------------------------
CREATE TABLE kill_switches (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  switch_key TEXT NOT NULL,                  -- 'all' | 'agent:<id>' | 'provider:<id>'
  engaged INTEGER NOT NULL DEFAULT 0 CHECK (engaged IN (0,1)),
  reason TEXT,
  updated_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, switch_key)
);

-- ---------------------------------------------------------------------------
-- Task contracts and executions
-- ---------------------------------------------------------------------------
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  parent_task_id TEXT REFERENCES tasks(id) ON DELETE RESTRICT,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  agent_version_id TEXT NOT NULL REFERENCES agent_versions(id) ON DELETE RESTRICT,
  task_type TEXT NOT NULL CHECK (task_type IN ('research_brief')),
  objective TEXT NOT NULL,
  requested_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  human_owner_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  data_class TEXT NOT NULL CHECK (data_class IN ('public','internal','confidential','restricted')),
  autonomy_level TEXT NOT NULL CHECK (autonomy_level IN ('L1','L2','L3','L4')),
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('synthetic','live')),
  contract_json TEXT NOT NULL,               -- full task contract snapshot
  budget_credits INTEGER NOT NULL CHECK (budget_credits >= 0),
  credits_used INTEGER NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  status TEXT NOT NULL CHECK (status IN ('created','running','awaiting_review','accepted','rejected','failed','blocked','cancelled')),
  status_reason TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, idempotency_key)
);

CREATE TABLE task_executions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  step TEXT NOT NULL,                        -- 'policy','search','extract','synthesize','review'
  provider_id TEXT REFERENCES provider_registry(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('succeeded','failed','skipped','denied')),
  attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1),
  detail_json TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL
);

-- Provider usage / budget accounting (append-only)
CREATE TABLE provider_usage (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  task_id TEXT REFERENCES tasks(id) ON DELETE RESTRICT,
  provider_id TEXT NOT NULL REFERENCES provider_registry(id) ON DELETE RESTRICT,
  capability TEXT NOT NULL,
  estimated_credits INTEGER NOT NULL DEFAULT 0 CHECK (estimated_credits >= 0),
  actual_credits INTEGER CHECK (actual_credits IS NULL OR actual_credits >= 0),
  outcome TEXT NOT NULL CHECK (outcome IN ('succeeded','failed','denied')),
  error_class TEXT,
  duration_ms INTEGER,
  request_id TEXT NOT NULL,
  usage_date TEXT NOT NULL,                  -- YYYY-MM-DD UTC, for daily caps
  created_at TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Evidence / provenance and research artifacts
-- ---------------------------------------------------------------------------
CREATE TABLE evidence_sources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  provider_id TEXT NOT NULL REFERENCES provider_registry(id) ON DELETE RESTRICT,
  query TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT,
  extracted_excerpt TEXT,
  relevance_score REAL,
  evidence_class TEXT NOT NULL CHECK (evidence_class IN ('synthetic','secondary_unverified','primary_unverified')),
  trust TEXT NOT NULL DEFAULT 'untrusted_external' CHECK (trust IN ('untrusted_external','synthetic')),
  retrieved_at TEXT NOT NULL
);

CREATE TABLE research_artifacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  brief_json TEXT NOT NULL,
  generator TEXT NOT NULL,                   -- how it was produced (e.g. 'extractive-v1')
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','accepted','rejected')),
  reviewed_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  review_note TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Policy decisions, idempotency, rate limits
-- ---------------------------------------------------------------------------
CREATE TABLE permission_decisions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  venture_id TEXT,
  person_id TEXT,
  action TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allow','deny')),
  reason TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE idempotency_records (
  scope TEXT NOT NULL,
  idem_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (scope, idem_key)
);

CREATE TABLE rate_limits (
  bucket TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

CREATE INDEX idx_tasks_venture ON tasks(venture_id, created_at);
CREATE INDEX idx_task_exec_task ON task_executions(task_id, started_at);
CREATE INDEX idx_usage_ws_provider_date ON provider_usage(workspace_id, provider_id, usage_date);
CREATE INDEX idx_evidence_task ON evidence_sources(task_id);
CREATE INDEX idx_perm_decisions_ws ON permission_decisions(workspace_id, created_at);
CREATE INDEX idx_venture_members_person ON venture_members(person_id, status);

-- Append-only safeguards
CREATE TRIGGER trg_provider_usage_no_update BEFORE UPDATE ON provider_usage
BEGIN SELECT RAISE(ABORT, 'provider_usage is append-only'); END;
CREATE TRIGGER trg_provider_usage_no_delete BEFORE DELETE ON provider_usage
BEGIN SELECT RAISE(ABORT, 'provider_usage is append-only'); END;
CREATE TRIGGER trg_task_exec_no_update BEFORE UPDATE ON task_executions
BEGIN SELECT RAISE(ABORT, 'task_executions are append-only'); END;
CREATE TRIGGER trg_task_exec_no_delete BEFORE DELETE ON task_executions
BEGIN SELECT RAISE(ABORT, 'task_executions are append-only'); END;
CREATE TRIGGER trg_perm_decisions_no_update BEFORE UPDATE ON permission_decisions
BEGIN SELECT RAISE(ABORT, 'permission_decisions are append-only'); END;
CREATE TRIGGER trg_perm_decisions_no_delete BEFORE DELETE ON permission_decisions
BEGIN SELECT RAISE(ABORT, 'permission_decisions are append-only'); END;
CREATE TRIGGER trg_evidence_no_update BEFORE UPDATE ON evidence_sources
BEGIN SELECT RAISE(ABORT, 'evidence_sources are immutable provenance records'); END;
-- A reviewed brief cannot be changed again.
CREATE TRIGGER trg_reviewed_artifact_no_update BEFORE UPDATE ON research_artifacts
WHEN OLD.status <> 'draft'
BEGIN SELECT RAISE(ABORT, 'reviewed research artifacts are immutable'); END;

-- ---------------------------------------------------------------------------
-- Catalogue seed (no secrets, no people, no business data)
-- ---------------------------------------------------------------------------
INSERT INTO provider_registry (id, display_name, kind, capabilities_json, secret_ref, docs_url, pricing_note, is_external, created_at) VALUES
 ('mock-search','Synthetic Mock Search','mock','["search.web"]',NULL,NULL,'No cost. Returns clearly labelled synthetic results.',0,'2026-11-17T00:00:00Z'),
 ('tavily','Tavily','search','["search.web"]','TAVILY_API_KEY','https://docs.tavily.com/documentation/api-reference/endpoint/search','basic search = 1 API credit (verified 2026-11-17)',1,'2026-11-17T00:00:00Z'),
 ('firecrawl','Firecrawl','extraction','["extract.page"]','FIRECRAWL_API_KEY','https://docs.firecrawl.dev/api-reference/endpoint/scrape','scrape = 1 credit/page (verified 2026-11-17)',1,'2026-11-17T00:00:00Z'),
 ('apify','Apify','actor','["actor.run"]','APIFY_TOKEN','https://docs.apify.com/api/v2','Actor runs consume compute units; disabled until Actor + budget approved',1,'2026-11-17T00:00:00Z'),
 ('scrapely','Scrape.ly','actor','["actor.run"]','SCRAPELY_API_KEY','https://scrape.ly/docs/api-overview','Actor runs are charged; disabled until Actor + budget approved',1,'2026-11-17T00:00:00Z'),
 ('workers-ai','Cloudflare Workers AI','inference','["inference.text"]',NULL,'https://developers.cloudflare.com/workers-ai/platform/limits/','Requires AI binding; not bound in this environment',1,'2026-11-17T00:00:00Z');

INSERT INTO agent_registry (id, display_name, purpose, specialist_role, status, created_at) VALUES
 ('research-brief','Research Brief Agent','Collect public sources for a venture question and draft a cited brief for human review.','Opportunity Research','active','2026-11-17T00:00:00Z');

INSERT INTO agent_versions (id, agent_id, version, autonomy_level, tool_allowlist_json, data_classes_json, max_task_credits, is_current, created_at) VALUES
 ('agv_research_brief_1','research-brief','1.0.0','L2','["search.web","extract.page"]','["public"]',10,1,'2026-11-17T00:00:00Z');
