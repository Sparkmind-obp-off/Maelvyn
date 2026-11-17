-- MAELVYN initial schema v0001
-- D1 / SQLite. Structure only; no production or participant data.
PRAGMA foreign_keys = ON;

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup','active','suspended','archived')),
  default_currency TEXT NOT NULL DEFAULT 'IDR' CHECK (length(default_currency) = 3),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE people (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','withdrawn')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE identity_links (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(provider, provider_subject),
  UNIQUE(person_id, provider)
);

CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('workspace_admin','governance_approver','venture_operator','finance_operator','viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','ended')),
  granted_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, person_id)
);

CREATE TABLE ventures (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('digital','commerce','productive_asset','investment_capital','other')),
  stage TEXT NOT NULL DEFAULT 'discover' CHECK (stage IN ('discover','validate','build','launch','operate','scale','hold','restructure','exit')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','active','paused','closed','archived')),
  accountable_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, code)
);

CREATE TABLE venture_members (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  role_label TEXT NOT NULL,
  scope_description TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','active','ended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(venture_id, person_id, role_label)
);

CREATE TABLE agreements (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('participation','contribution','ownership','ip_license','loan','service','asset_transfer','other')),
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','approved','executed','expired','terminated','superseded')),
  effective_at TEXT,
  expires_at TEXT,
  document_object_key TEXT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE agreement_parties (
  id TEXT PRIMARY KEY,
  agreement_id TEXT NOT NULL REFERENCES agreements(id) ON DELETE RESTRICT,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  party_role TEXT NOT NULL,
  signature_status TEXT NOT NULL DEFAULT 'pending' CHECK (signature_status IN ('pending','signed','declined','not_required')),
  signed_at TEXT,
  UNIQUE(agreement_id, person_id, party_role)
);

CREATE TABLE contributions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  contributor_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('cash','labor','skill','technology','ip','network','equipment','inventory','loan','service','other')),
  legal_character TEXT NOT NULL CHECK (legal_character IN ('capital','loan','service_fee','reimbursement','license','sale','in_kind_use','gift','other')),
  description TEXT NOT NULL,
  currency TEXT CHECK (currency IS NULL OR length(currency) = 3),
  agreed_value_minor INTEGER CHECK (agreed_value_minor IS NULL OR agreed_value_minor >= 0),
  valuation_method TEXT,
  agreement_id TEXT REFERENCES agreements(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','under_review','accepted','rejected','returned','withdrawn')),
  accepted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ownership_interests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  holder_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  agreement_id TEXT NOT NULL REFERENCES agreements(id) ON DELETE RESTRICT,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('equity','unit','revenue_share','profit_share','other')),
  quantity TEXT,
  percentage_basis_points INTEGER CHECK (percentage_basis_points IS NULL OR (percentage_basis_points >= 0 AND percentage_basis_points <= 10000)),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','effective','suspended','transferred','terminated')),
  effective_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE approval_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  request_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  requested_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','cancelled','superseded')),
  policy_snapshot TEXT,
  submitted_at TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE approval_votes (
  id TEXT PRIMARY KEY,
  approval_request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE RESTRICT,
  voter_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  decision TEXT NOT NULL CHECK (decision IN ('approve','reject','abstain')),
  rationale TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(approval_request_id, voter_person_id)
);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  cap_minor INTEGER NOT NULL CHECK (cap_minor >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','superseded')),
  approval_request_id TEXT REFERENCES approval_requests(id) ON DELETE RESTRICT,
  period_start TEXT,
  period_end TEXT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  UNIQUE(venture_id, version)
);

CREATE TABLE finance_accounts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL,
  UNIQUE(venture_id, code)
);

CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  entry_number TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted')),
  source_type TEXT,
  source_id TEXT,
  reversal_of_entry_id TEXT REFERENCES journal_entries(id) ON DELETE RESTRICT,
  created_by_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  posted_by_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  posted_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(venture_id, entry_number)
);

CREATE TABLE journal_lines (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
  account_id TEXT NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  description TEXT,
  debit_minor INTEGER NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor INTEGER NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  CHECK ((debit_minor > 0 AND credit_minor = 0) OR (credit_minor > 0 AND debit_minor = 0))
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  ownership_basis TEXT NOT NULL CHECK (ownership_basis IN ('personal_not_contributed','owned_by_venture','leased','licensed','shared_use','under_review')),
  legal_owner_description TEXT,
  agreement_id TEXT REFERENCES agreements(id) ON DELETE RESTRICT,
  acquisition_value_minor INTEGER CHECK (acquisition_value_minor IS NULL OR acquisition_value_minor >= 0),
  currency TEXT CHECK (currency IS NULL OR length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','active','maintenance','disposed','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  venture_id TEXT REFERENCES ventures(id) ON DELETE RESTRICT,
  actor_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  reason TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_workspace_members_person ON workspace_members(person_id, status);
CREATE INDEX idx_ventures_workspace_stage ON ventures(workspace_id, stage, status);
CREATE INDEX idx_contributions_venture_status ON contributions(venture_id, status);
CREATE INDEX idx_ownership_venture_status ON ownership_interests(venture_id, status);
CREATE INDEX idx_approvals_workspace_status ON approval_requests(workspace_id, status, created_at);
CREATE INDEX idx_votes_request ON approval_votes(approval_request_id);
CREATE INDEX idx_journal_venture_date ON journal_entries(venture_id, entry_date, status);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_audit_workspace_created ON audit_events(workspace_id, created_at);
CREATE INDEX idx_audit_target ON audit_events(target_type, target_id);


-- Append-only safeguards for records that become legally or financially material.
CREATE TRIGGER trg_audit_events_no_update
BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events are append-only');
END;

CREATE TRIGGER trg_audit_events_no_delete
BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events are append-only');
END;

CREATE TRIGGER trg_approval_votes_no_update
BEFORE UPDATE ON approval_votes
BEGIN
  SELECT RAISE(ABORT, 'approval_votes are immutable; supersede through a new decision workflow');
END;

CREATE TRIGGER trg_approval_votes_no_delete
BEFORE DELETE ON approval_votes
BEGIN
  SELECT RAISE(ABORT, 'approval_votes are immutable');
END;

CREATE TRIGGER trg_posted_journal_entries_no_update
BEFORE UPDATE ON journal_entries
WHEN OLD.status = 'posted'
BEGIN
  SELECT RAISE(ABORT, 'posted journal entries are immutable; create a reversal entry');
END;

CREATE TRIGGER trg_posted_journal_entries_no_delete
BEFORE DELETE ON journal_entries
WHEN OLD.status = 'posted'
BEGIN
  SELECT RAISE(ABORT, 'posted journal entries cannot be deleted');
END;

CREATE TRIGGER trg_posted_journal_lines_no_insert
BEFORE INSERT ON journal_lines
WHEN (SELECT status FROM journal_entries WHERE id = NEW.journal_entry_id) = 'posted'
BEGIN
  SELECT RAISE(ABORT, 'cannot add lines to a posted journal entry');
END;

CREATE TRIGGER trg_posted_journal_lines_no_update
BEFORE UPDATE ON journal_lines
WHEN (SELECT status FROM journal_entries WHERE id = OLD.journal_entry_id) = 'posted'
  OR (SELECT status FROM journal_entries WHERE id = NEW.journal_entry_id) = 'posted'
BEGIN
  SELECT RAISE(ABORT, 'posted journal lines are immutable');
END;

CREATE TRIGGER trg_posted_journal_lines_no_delete
BEFORE DELETE ON journal_lines
WHEN (SELECT status FROM journal_entries WHERE id = OLD.journal_entry_id) = 'posted'
BEGIN
  SELECT RAISE(ABORT, 'posted journal lines are immutable');
END;

CREATE TRIGGER trg_executed_agreements_no_update
BEFORE UPDATE ON agreements
WHEN OLD.status = 'executed'
BEGIN
  SELECT RAISE(ABORT, 'executed agreements are immutable; create a new version');
END;

CREATE TRIGGER trg_executed_agreements_no_delete
BEFORE DELETE ON agreements
WHEN OLD.status = 'executed'
BEGIN
  SELECT RAISE(ABORT, 'executed agreements cannot be deleted');
END;

CREATE TRIGGER trg_effective_ownership_no_update
BEFORE UPDATE ON ownership_interests
WHEN OLD.status = 'effective'
BEGIN
  SELECT RAISE(ABORT, 'effective ownership records are immutable; record a transfer or superseding interest');
END;

CREATE TRIGGER trg_effective_ownership_no_delete
BEFORE DELETE ON ownership_interests
WHEN OLD.status = 'effective'
BEGIN
  SELECT RAISE(ABORT, 'effective ownership records cannot be deleted');
END;
