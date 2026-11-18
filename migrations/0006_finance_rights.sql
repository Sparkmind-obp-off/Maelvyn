-- MAELVYN schema v0006 — finance core and rights registers (builds on 0001 budgets/ledger/agreements/ownership).
-- Records only: no custody, no payment execution, no automatic distribution.
PRAGMA foreign_keys = ON;

ALTER TABLE budgets ADD COLUMN notes TEXT;
CREATE TRIGGER trg_budgets_locked BEFORE UPDATE ON budgets
WHEN OLD.status IN ('rejected','superseded')
  OR (OLD.status = 'approved' AND NEW.status <> 'superseded')
  OR (OLD.status IN ('approved','submitted') AND NEW.cap_minor <> OLD.cap_minor)
BEGIN SELECT RAISE(ABORT, 'budget version is locked'); END;
CREATE TRIGGER trg_budgets_no_delete BEFORE DELETE ON budgets WHEN OLD.status <> 'draft'
BEGIN SELECT RAISE(ABORT, 'submitted budgets cannot be deleted'); END;

CREATE TABLE budget_lines (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_budget_lines_budget ON budget_lines(budget_id);
CREATE TRIGGER trg_budget_lines_locked_ins BEFORE INSERT ON budget_lines
WHEN (SELECT status FROM budgets WHERE id = NEW.budget_id) <> 'draft'
BEGIN SELECT RAISE(ABORT, 'budget lines are locked after submission'); END;
CREATE TRIGGER trg_budget_lines_locked_upd BEFORE UPDATE ON budget_lines
WHEN (SELECT status FROM budgets WHERE id = OLD.budget_id) <> 'draft'
BEGIN SELECT RAISE(ABORT, 'budget lines are locked after submission'); END;
CREATE TRIGGER trg_budget_lines_locked_del BEFORE DELETE ON budget_lines
WHEN (SELECT status FROM budgets WHERE id = OLD.budget_id) <> 'draft'
BEGIN SELECT RAISE(ABORT, 'budget lines are locked after submission'); END;

ALTER TABLE finance_accounts ADD COLUMN subtype TEXT;
ALTER TABLE journal_entries ADD COLUMN posting_note TEXT;
-- At most one reversal per original entry.
CREATE UNIQUE INDEX uq_journal_single_reversal ON journal_entries(reversal_of_entry_id) WHERE reversal_of_entry_id IS NOT NULL;

CREATE TABLE reconciliations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  account_id TEXT NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  statement_date TEXT NOT NULL,
  statement_balance_minor INTEGER NOT NULL,
  ledger_balance_minor INTEGER NOT NULL,
  difference_minor INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('matched','difference')),
  note TEXT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);
CREATE TRIGGER trg_recon_no_update BEFORE UPDATE ON reconciliations BEGIN SELECT RAISE(ABORT, 'reconciliations are append-only'); END;
CREATE TRIGGER trg_recon_no_delete BEFORE DELETE ON reconciliations BEGIN SELECT RAISE(ABORT, 'reconciliations are append-only'); END;

ALTER TABLE contributions ADD COLUMN approval_request_id TEXT REFERENCES approval_requests(id);
CREATE TRIGGER trg_contributions_accepted_locked BEFORE UPDATE ON contributions
WHEN OLD.status IN ('accepted','rejected','returned','withdrawn') AND NOT (OLD.status = 'accepted' AND NEW.status = 'returned')
BEGIN SELECT RAISE(ABORT, 'decided contributions are immutable'); END;

ALTER TABLE agreements ADD COLUMN summary TEXT;
ALTER TABLE agreements ADD COLUMN approval_request_id TEXT REFERENCES approval_requests(id);
ALTER TABLE ownership_interests ADD COLUMN approval_request_id TEXT REFERENCES approval_requests(id);
ALTER TABLE ownership_interests ADD COLUMN created_by_person_id TEXT REFERENCES people(id);
ALTER TABLE ownership_interests ADD COLUMN notes TEXT;

CREATE TABLE ip_assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  ip_type TEXT NOT NULL CHECK (ip_type IN ('code','brand','content','design','data','invention','other')),
  provenance TEXT NOT NULL CHECK (provenance IN ('created_in_venture','contributed','licensed_in','pre_existing_excluded')),
  owner_description TEXT NOT NULL,
  agreement_id TEXT REFERENCES agreements(id) ON DELETE RESTRICT,
  license_terms TEXT,
  restrictions TEXT,
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded','active','retired')),
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_ip_venture ON ip_assets(venture_id);
