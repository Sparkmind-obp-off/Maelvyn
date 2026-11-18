-- MAELVYN Production d1_migrations ledger repair (history-preserving).
-- Converts (name PK, applied_at) -> Wrangler layout (id AUTOINCREMENT, name UNIQUE, applied_at).
-- Preserves all 8 names and original applied_at timestamps; ids assigned in migration-file order.
CREATE TABLE d1_migrations_wrangler (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO d1_migrations_wrangler (name, applied_at) SELECT name, applied_at FROM d1_migrations ORDER BY name;
DROP TABLE d1_migrations;
ALTER TABLE d1_migrations_wrangler RENAME TO d1_migrations;
