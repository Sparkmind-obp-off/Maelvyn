# Production Data Migration Assessment — Development → Production

Date: 2026-11-18
Source: `maelvyn-dev` / `maelvyn-dev-db` (`ad21e923-f1f2-4a77-b5f7-d9b85afe217b`)
Target: `maelvyn-production` / `maelvyn-production-db` (`6b42d874-61c8-4ebe-8b79-de7432e094de`) / `maelvyn-production-private`

Backups taken before any change:
- `maelvyn-production-db_2026-11-18T08-31-03Z.sql` (pre-audit)
- `maelvyn-production-db_pre-repair_2026-11-18T08-55-35Z.sql` (immediately pre-ledger-repair)
- `maelvyn-dev-db_2026-11-18T08-52-31Z.sql` (source snapshot)
- D1 Time Travel bookmark pre-repair: `00000005-00000000-00005127-78869ef8034fe5fc1f6173972df06772`

## 1. Schema and migration history — MATCHED

| Check | Development | Production |
|---|---|---|
| Migration files applied | 0001–0008 | 0001–0008 (+0009 after this task) |
| Logical objects | 147 | 147 (155 after 0009) |
| Schema comparison | — | object-by-object identical after whitespace/quote normalisation |
| `PRAGMA foreign_key_check` | clean | clean |

Ledger compatibility issue resolved (see `ops/d1/README.md`). All eight original rows preserved with their
`applied_at` timestamps; `id` 1–8 assigned in migration-file order. No migration was re-executed.

## 2. Record inventory

### 2.1 Configuration tables — ALREADY IDENTICAL, nothing to migrate

`provider_registry` (6), `agent_registry` (1), `agent_versions` (1), `account_policies` (2) are byte-identical
between Development and Production (compared row-by-row). Production already carries the full validated configuration.

### 2.2 Identity and business data in Development — SYNTHETIC / TEST ONLY

| Table | Dev rows | Nature | Recommendation |
|---|---|---|---|
| `people` | 8 | 3 rows with `contact_email IS NULL`; 2 duplicate-email pairs (`sparkmind.support@gmail.com` ×2, `wudi250305@gmail.com` ×2) | Do not migrate |
| `identity_links` | 6 | All subjects are **Clerk Development** ids (`user_3M…`) that do not exist in the Production Clerk instance | Do not migrate |
| `platform_roles` | 1 | `platform_owner` bound to Clerk **Dev** subject `user_3MGNtSo6G3x1Q7LKLu12PFnWUXo` | Do not migrate |
| `workspaces` | 4 | All `is_synthetic = 1`; names `Hyydrr` ×3, `Live Invite Test` (2 in `setup`) | Do not migrate |
| `ventures` | 2 | `SYN-A`, `SYN-B` (both `draft`, inside `Live Invite Test`) | Do not migrate |
| `workspace_members` | 5 | 1 active, 3 `suspended` (by 0004 reconciliation), 1 `ended` | Do not migrate |
| `venture_members` | 3 | All `ended` | Do not migrate |
| `workspace_provider_settings` | 24 | All `live_enabled = 0` | Not needed (created per workspace) |
| `workspace_invitations` | 1 | Test invitation to a synthetic invitee | Do not migrate |
| `audit_events` | 18 | Test exercise history (created/suspended/invitation) | Do not migrate |
| `permission_decisions` | 4 | Test denials | Do not migrate |
| `platform_audit_events` | 2 | Test owner binding | Do not migrate |
| `rate_limits` | 8 | Ephemeral counters (60s windows, already stale) | Do not migrate |
| `tasks` / `research_artifacts` / `memory_records` | 0 / 0 / 0 | Empty | Nothing to migrate |

### 2.3 R2 objects

`wrangler.jsonc` (Development) declares **no** `r2_buckets` binding → Development has no artifact objects.
`maelvyn-production-private` object count: 0. Nothing to transfer.

## 3. Conflict report

| ID | Conflict | Impact if migrated naively | Resolution |
|---|---|---|---|
| C1 | Duplicate `people.contact_email` (2 pairs) | `people` has **no** unique constraint on `contact_email`, so inserts succeed silently and create duplicate persons — exactly the state the owner-claim tests assert must be impossible | Do not migrate people rows |
| C2 | `platform_roles` Clerk **Dev** subject in a Production DB | `uq_platform_owner_active` + `trg_platform_roles_binding_immutable` + `trg_platform_roles_no_delete` make the single owner slot permanent; a Dev subject would never match a Production JWT, permanently wedging the owner slot. No `owner-transfer` procedure exists in the codebase | Owner must be bootstrapped in Production by the real owner via `POST /platform/owner/claim` with a verified Production Clerk account |
| C3 | Clerk instance boundary | Clerk internal user records cannot be copied between instances; only Development-issued subjects exist in the source | Google sign-in on Production creates Production identities on first login |
| C4 | Synthetic flag | All four workspaces are `is_synthetic = 1` | Excluded by policy below |

No ID collisions were found: all primary keys are opaque random ids (`per_`, `wsp_`, `ven_`, `wsm_`, `vnm_`, `idl_`),
prefixed and non-overlapping with the empty Production tables. FK integrity in the source is clean.

## 4. Policy conflict — the decisive finding

`docs/PRODUCTION-READINESS-CHECKLIST.md:63` requires, as a release gate:

> `[ ] No synthetic test users or balances in production.`

The entire Development dataset is synthetic test data (`is_synthetic = 1`; test users; `Hyydrr` / `Synthetic A`;
suspended-by-reconciliation memberships). A literal "full data migration" of Development → Production would
import exactly what the release checklist forbids, and would additionally fail C2 (unusable owner binding).

Therefore the requested full data migration is **not executed**. Production starts from the schema and configuration
it already has, and the owner is bootstrapped through the designed, audited procedure.

## 5. What that means per phase

| Phase | Status |
|---|---|
| A Development audit | Done |
| B Production audit | Done |
| C Backups | Done (3 exports + bookmark) |
| D Schema / history comparison | Done — matched |
| E Mapping and conflict report | Done — this document |
| F Ledger reconciliation | **Done and verified** (8 records preserved, 0009 applied once) |
| G Data migration | **Not executed — blocked by C1/C2/C4** (needs owner decision) |
| H R2 object migration | N/A — source has no R2 objects and target bucket is empty |
| I Production secret | **Pending — owner must enter it privately** |
| J Tests / integrity | Done for code (87 tests); Production integrity verified |
| K Wrangler deploy | **Blocked** — requires Phase I |
| L Live E2E + owner bootstrap | Blocked — requires Phase K; owner performs bootstrap in browser |
| M Domain cutover | Not started — root/www still attached to Production and returning 522 |

## 6. If non-empty Production business data is genuinely required

Then it must be a separate, explicitly approved migration:
1. Name the exact tables and business purpose.
2. Reconcile duplicate emails into one person per real human (person merge procedure — not yet implemented).
3. Recreate `identity_links` from **Production** Clerk subject ids obtained after each user signs in on Production.
4. Bootstrap the owner first through `POST /platform/owner/claim`, audit it, then attach memberships.
5. Never import `platform_roles`, `rate_limits`, or `audit_events` from Development.
