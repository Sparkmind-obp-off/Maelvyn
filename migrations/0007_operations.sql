-- MAELVYN schema v0007 — venture operations: milestones, work items, assets, revenue evidence, experiments, reviews, risks.
PRAGMA foreign_keys = ON;

CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  owner_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','blocked','cancelled')),
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_milestones_venture ON milestones(venture_id, status);

CREATE TABLE work_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  milestone_id TEXT REFERENCES milestones(id) ON DELETE RESTRICT,
  depends_on_id TEXT REFERENCES work_items(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  assignee_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','blocked','done','cancelled')),
  blocked_reason TEXT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_work_items_venture ON work_items(venture_id, status);
CREATE INDEX idx_work_items_assignee ON work_items(assignee_person_id, status);

ALTER TABLE assets ADD COLUMN custodian_person_id TEXT REFERENCES people(id);
ALTER TABLE assets ADD COLUMN location TEXT;
ALTER TABLE assets ADD COLUMN condition TEXT;
ALTER TABLE assets ADD COLUMN created_by_person_id TEXT REFERENCES people(id);
ALTER TABLE assets ADD COLUMN approval_request_id TEXT REFERENCES approval_requests(id);
CREATE TABLE asset_events (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('registered','custody_change','location_change','condition_report','maintenance','disposed')),
  detail TEXT NOT NULL,
  actor_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);
CREATE TRIGGER trg_asset_events_no_update BEFORE UPDATE ON asset_events BEGIN SELECT RAISE(ABORT, 'asset events are append-only'); END;
CREATE TRIGGER trg_asset_events_no_delete BEFORE DELETE ON asset_events BEGIN SELECT RAISE(ABORT, 'asset events are append-only'); END;
CREATE TRIGGER trg_assets_disposed_locked BEFORE UPDATE ON assets WHEN OLD.status = 'disposed'
BEGIN SELECT RAISE(ABORT, 'disposed assets are immutable'); END;

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  segment TEXT,
  notes TEXT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);
CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
  unit_cost_minor INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost_minor >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired')),
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('quoted','confirmed','fulfilled','cancelled','refunded')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
  evidence_note TEXT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_orders_venture ON orders(venture_id, status);

CREATE TABLE experiments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  hypothesis TEXT NOT NULL,
  method TEXT NOT NULL,
  metric TEXT NOT NULL,
  success_threshold TEXT NOT NULL,
  budget_cap_minor INTEGER NOT NULL DEFAULT 0 CHECK (budget_cap_minor >= 0),
  timebox_end TEXT NOT NULL,
  owner_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','running','concluded','abandoned')),
  result TEXT CHECK (result IS NULL OR result IN ('supported','refuted','inconclusive')),
  result_summary TEXT,
  sample_size INTEGER,
  evidence_note TEXT,
  decision TEXT CHECK (decision IS NULL OR decision IN ('proceed','test','revise','hold','reject')),
  concluded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TRIGGER trg_experiments_concluded_locked BEFORE UPDATE ON experiments WHEN OLD.status IN ('concluded','abandoned')
BEGIN SELECT RAISE(ABORT, 'concluded experiments are immutable'); END;

CREATE TABLE venture_reviews (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  period_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('proceed','test','revise','hold','reject','scale','restructure','exit')),
  metrics_json TEXT NOT NULL,
  reviewer_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);
CREATE TRIGGER trg_reviews_no_update BEFORE UPDATE ON venture_reviews BEGIN SELECT RAISE(ABORT, 'venture reviews are append-only'); END;
CREATE TRIGGER trg_reviews_no_delete BEFORE DELETE ON venture_reviews BEGIN SELECT RAISE(ABORT, 'venture reviews are append-only'); END;

CREATE TABLE venture_risks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('governance','legal','financial','privacy','security','operational','market')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','closed')),
  mitigation TEXT,
  owner_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_risks_venture ON venture_risks(venture_id, status, severity);
