# Production D1 — ledger repair, backup & restore runbook

Target: `maelvyn-production-db` (`6b42d874-61c8-4ebe-8b79-de7432e094de`) only. Never run any of this against `maelvyn-dev-db`.

## 1. Ledger incompatibility (finding, 2026-11-18)

| | Production (actual) | Wrangler 4.164.0 expects |
|---|---|---|
| DDL | `d1_migrations (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)` | `d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)` |
| Rows | 8 (`0001_initial.sql` … `0008_runtime_platform.sql`, applied 2026-11-18 07:08:36–07:08:44) | — |
| Effect | `wrangler d1 migrations list/apply` fail: `no such column: id` | |

Schema verification: a restore of the Production export was compared object-by-object (146 tables/indexes/triggers,
whitespace/quote-normalised) with a fresh `wrangler d1 migrations apply` of 0001–0008 → **identical**. Seed data identical
(provider_registry 6, account_policies 2, agent_registry 1, agent_versions 1). So all 8 migrations are genuinely applied;
only the ledger *table layout* is wrong.

## 2. Proposed repair — `0000_ledger_repair_production.sql` (NOT YET APPLIED — owner approval required)

History-preserving: copies all 8 names with their original `applied_at`, assigns `id` 1–8 in file order, swaps tables.
Touches no other table. No migration is re-executed.

Expected after state: `id 1..8` = `0001…0008`, same timestamps; `wrangler d1 migrations list` → only `0009_private_artifacts.sql` pending.

Rehearsal (local restore of the Production export): before → `no such column: id`; after → 8 rows preserved, list shows only
0009 pending; `apply` runs 0009 only; second `apply` → "No migrations to apply"; 146 objects + seed data unchanged.

### Execution (after approval)
```bash
npx wrangler d1 time-travel info maelvyn-production-db --config wrangler.production.jsonc        # record bookmark
npx wrangler d1 export maelvyn-production-db --remote --config wrangler.production.jsonc --output backups/pre-repair.sql
npx wrangler d1 execute maelvyn-production-db --remote --config wrangler.production.jsonc --file ops/d1/0000_ledger_repair_production.sql
npx wrangler d1 execute maelvyn-production-db --remote --config wrangler.production.jsonc --command "SELECT id,name,applied_at FROM d1_migrations ORDER BY id"
npx wrangler d1 migrations list maelvyn-production-db --remote --config wrangler.production.jsonc   # expect only 0009 pending
```
Then (separate step): `npm run db:migrate:production` applies 0009 only.

### Rollback
Point-in-time restore to the bookmark recorded immediately before the repair (D1 Time Travel, 30-day window):
```bash
npx wrangler d1 time-travel restore maelvyn-production-db --bookmark <bookmark> --config wrangler.production.jsonc
```
Pre-change bookmark captured 2026-11-18T08:31Z: `00000003-00000000-00005127-126b9f99409ef21eb9ee4228a1604afe`.

## 3. Backup

- Logical export: `npx wrangler d1 export maelvyn-production-db --remote --config wrangler.production.jsonc --output <file>.sql`
- Point-in-time: D1 Time Travel bookmarks (`wrangler d1 time-travel info`), restorable for 30 days.
- Backup files contain schema + data; store them outside the repository (never commit). `backups/` is local only.

## 4. Restore test (non-destructive)

Restore into a **local** throwaway D1 (never into Production):
```bash
npx wrangler d1 execute restore-test --local --file <export>.sql --yes
```
Verify: object count/schema diff vs fresh migrations, row counts, `PRAGMA foreign_key_check` empty.
A remote temporary restore DB is only created with explicit owner approval and deleted after confirmation.
