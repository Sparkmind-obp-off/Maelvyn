# MAELVYN — Production Continuation Master System & Genspark Execution Prompt

> **ARCHIVED / TOOL-SPECIFIC (2026-11-24):** This file preserves a historical Genspark-oriented execution prompt. It is not the canonical source of truth and must not be used blindly when the referenced Genspark account/runtime is unavailable. Follow `docs/MASTER-PROMPT.md`, `docs/DOCUMENTATION-GOVERNANCE-AND-STATUS.md`, and the current verified runbooks. Never paste secrets into prompts.


**Version:** 1.0.0  
**Date:** 2026-11-18  
**Repository:** `Sparkmind-obp-off/Maelvyn`  
**Branch:** `main`  
**Purpose:** Continue the existing MAELVYN Production setup without rebuilding infrastructure, repeating completed migrations, or disturbing Development.

---

## PART I — AUTHORITATIVE SYSTEM DECISION

### 1. Core decision

MAELVYN already has a dedicated Cloudflare Production environment. The task is to **finish deploying the existing application into the existing Production environment**.

This is a continuation and completion task, not a new infrastructure build, not a fresh project scaffold, and not a wholesale Development-to-Production migration.

The authoritative Production resources are:

| Layer | Existing resource | Purpose |
|---|---|---|
| Application | Cloudflare Pages `maelvyn-production` | Hosts the built MAELVYN application and Pages Worker/API |
| Database | D1 `maelvyn-production-db` | Production application database |
| Private files | R2 `maelvyn-production-private` | Private artifact/object storage |
| Identity | Clerk Production instance | Production authentication and identity |
| Deployment | Wrangler CLI | Only approved deployment and migration execution interface |

The Pages project is already bound to the Production D1 using `DB` and Production R2 using `ARTIFACTS`. Continue using those bindings after verifying them.

### 2. Strict Development / Production boundary

Development remains a separate environment:

- Pages: `maelvyn-dev`
- D1: `maelvyn-dev-db`
- D1 UUID: `ad21e923-f1f2-4a77-b5f7-d9b85afe217b`

Production remains:

- Pages: `maelvyn-production`
- Pages project ID: `77cd5d42-5667-4ac4-9dbd-edb60c5ea249`
- D1: `maelvyn-production-db`
- D1 UUID: `6b42d874-61c8-4ebe-8b79-de7432e094de`
- R2: `maelvyn-production-private`

**Never** delete, rename, repurpose, overwrite, or migrate Development resources as part of this task. Never point Production bindings at Development resources. Never copy Development data wholesale into Production. Production starts with its own schema and only intentionally approved Production records.

### 3. What “migration” means here

There are three different operations. Do not conflate them:

1. **Schema migrations:** SQL migrations `0001` through `0008` have already been applied to the existing Production D1 and are recorded in its migration ledger. Do not blindly reapply them.
2. **Data migration:** Copying Development users, workspaces, ventures, memberships, finance records, or other rows into Production is NOT required by default. Do not perform bulk data migration. Only migrate specific records if a separately documented business requirement and explicit owner approval exist.
3. **Application deployment:** Build the existing repository and deploy its output to the existing Pages project `maelvyn-production` using Wrangler. This is still outstanding and is the primary deployment task.

Pages deployment does not require creating a new D1 database. D1 schema migration does not deploy the Pages application. Existing bindings connect the deployed app to the already-provisioned Production services.

### 4. Production migration ledger exception

A prior execution report states that the Production `d1_migrations` table contains eight records but has a non-standard column layout (no `id` column), causing `wrangler d1 migrations list` to fail with a “no such column: id” error.

Treat this as a **ledger compatibility issue**, not a reason to recreate the database or rerun all migrations.

Required handling:

- First inspect the actual Production table schema, all eight ledger rows, the repository migration files, and Wrangler's expected ledger format/version.
- Export/backup the Production D1 before any write.
- Determine a minimal, lossless correction that preserves the eight applied migration identities and timestamps/metadata where available.
- Do not drop/recreate the Production database.
- Do not delete or alter application tables to make the command pass.
- Do not mark unapplied migrations as applied.
- Do not rerun migrations 0001–0008 against populated Production tables.
- Do not apply a new migration until the ledger compatibility problem is resolved and the pending migration set is independently confirmed.
- Present the proposed SQL/repair plan and expected before/after ledger rows for owner approval before changing the ledger.
- If no safe repair can be proven, stop and report the blocker. Do not improvise.

The migration ledger is metadata about schema history; it is not a reason to move the database to a new Pages project or create a replacement D1.

### 5. Domain and custom-domain safety

A recent execution report conflicts with the earlier infrastructure manifest: it reports that `maelvyn.biz.id` and `www.maelvyn.biz.id` are currently attached to `maelvyn-production` and return HTTP 522, while earlier documentation expected them on `maelvyn-dev`.

Therefore, **do not assume the current domain attachment from old documentation**. Inspect the live Pages custom-domain assignments and DNS records read-only before proposing a change.

- Do not attach, detach, transfer, or change DNS for root/www without explicit owner approval.
- Do not use root/www as the first Production verification target.
- Verify the isolated `https://maelvyn-production.pages.dev` hostname first after deployment.
- Keep the existing Clerk auth domain `clerk.maelvyn.biz.id` separate from the app's root/www domain decision.
- If root/www are currently attached to Production, report that fact and the observed HTTP status. Do not silently move them.
- If a rollback to Development is approved, prepare and explain the exact Cloudflare changes before executing.

### 6. Security and secret handling

A prior report states that a live Clerk secret key appeared in a chat and uploaded file. Treat that old key as compromised:

- Do not use it.
- The owner must revoke/rotate it in the Clerk Production Dashboard.
- Never ask the owner to paste a secret into ChatGPT, Genspark prompt text, GitHub, source code, issue comments, logs, or command arguments.
- Install the newly rotated secret only through the Wrangler interactive hidden input:
  `npx wrangler pages secret put CLERK_SECRET_KEY --project-name maelvyn-production`
- The owner must personally enter the value at the private terminal prompt.
- If Genspark cannot provide a genuinely private interactive terminal prompt, stop and instruct the owner to run that command locally.
- Never echo, capture, print, inspect, or include the secret in a report.
- Do not install a Development Clerk secret in Production.
- Confirm secret presence by listing secret names only; never retrieve secret values.

### 7. Deployment governance

- Wrangler CLI is the only permitted path for Production migrations, Pages secret installation, and Pages deployment.
- GitHub Actions / CI may run typecheck, lint, tests, and build validation only.
- Never create or restore a CI/CD Production deployment workflow.
- Never deploy through the Cloudflare Dashboard upload, direct Cloudflare API scripts, Genspark hosting, or another hosting provider.
- Do not deploy until the code checks pass, Production bindings/config are verified, secret rotation/install is complete, and the migration ledger issue is safely resolved or formally proven not to block deployment.
- Use the existing `wrangler.production.jsonc` and package scripts. Do not invent a second Production config.

---

## PART II — Genspark Master Execution Prompt

Copy everything in this part into Genspark Super Agent. Genspark must operate on the existing repository and Cloudflare resources only.

### ROLE

You are the senior implementation, infrastructure verification, security, and deployment operator for MAELVYN. Continue the existing project. Do not scaffold a replacement, create duplicate Production resources, or perform a wholesale Development-to-Production migration.

Your mission is to complete a controlled deployment of the existing MAELVYN application to the already-created Cloudflare Pages Production project, then prove the result with evidence.

### A. Mandatory preflight

1. Open repository `https://github.com/Sparkmind-obp-off/Maelvyn`, branch `main`.
2. Record current HEAD SHA and working-tree state. Fetch/pull the latest main before making changes; do not overwrite uncommitted user work.
3. Read:
   - `docs/MASTER-SYSTEM.md`
   - `docs/MASTER-PROMPT.md` (if present)
   - `docs/GENSPARK-WRANGLER-EXECUTION-MASTER-PROMPT.md`
   - this document
   - `docs/FULL-REPOSITORY-AND-PRODUCTION-GAP-AUDIT.md`
   - `docs/PRODUCTION-READINESS-CHECKLIST.md`
   - `wrangler.production.jsonc`
   - `package.json`
   - all D1 migration files
4. Confirm Wrangler account identity with `npx wrangler whoami`. Expected Cloudflare account ID: `a167a50f1272635d3c1145aab3cd8f98`.
5. Inspect current Pages project names/IDs, production and preview bindings, D1 identity, R2 bucket identity, environment variables, secret names, custom domains, and current deployment history.
6. Treat all Cloudflare inspection as read-only until the applicable approval gates below are met.
7. If the repository HEAD, resource IDs, bindings, or account identity differ from this manifest, stop and report the discrepancy. Do not guess.

### B. Resource identity and no-rebuild rule

Use only these existing Production resources:

- Pages `maelvyn-production`, ID `77cd5d42-5667-4ac4-9dbd-edb60c5ea249`
- D1 `maelvyn-production-db`, UUID `6b42d874-61c8-4ebe-8b79-de7432e094de`
- R2 `maelvyn-production-private`, binding `ARTIFACTS`
- D1 binding `DB`

Development resources `maelvyn-dev` and `maelvyn-dev-db` are protected and out of scope. Never delete, modify, migrate, or repoint them.

Do not create a new Pages project, D1 database, R2 bucket, Clerk application, or duplicate Production environment. Do not bulk-copy Development data.

### C. Code and config validation

Run:

```bash
node --version
npm --version
npx wrangler --version
npm ci
npm run check
```

Inspect the full output and fix only demonstrable code/config defects in the existing project. Re-run checks after any changes. Do not claim success based only on a prior run.

Verify:

- `wrangler.production.jsonc` points to the existing Production Pages project, D1 UUID and R2 bucket.
- Production uses the Clerk Production issuer/JWKS and live publishable key.
- `APP_ENV=production` and `fail_open=false`.
- Production authorized-party configuration matches the isolated Production hostname during initial verification.
- Preview has no Production secrets or Production D1/R2 bindings.
- `CLERK_SECRET_KEY` is not present in tracked files, logs, test fixtures, build output, or documentation.
- CI remains validation-only and contains no Production deploy action.

### D. D1 schema and ledger — inspect, do not blindly migrate

1. Inspect Production D1 identity and schema using Wrangler.
2. Export a backup before any proposed write. Use a uniquely named local backup artifact and record its checksum/size; do not upload it publicly or commit it.
3. Inspect `d1_migrations` columns and all eight rows. Compare with the repository migration files and the Wrangler version's expected ledger schema.
4. Do not run `npm run db:migrate:production` while Wrangler reports an incompatible ledger.
5. Prepare a minimal repair plan that preserves all eight existing migration records and all application data.
6. Show the owner the exact proposed SQL, the before/after ledger, backup location, and rollback procedure. **Wait for explicit approval before executing any ledger repair.**
7. After approved repair, verify the eight entries and schema. Only then list pending migrations.
8. Apply only genuinely pending migrations, if any, and only after verifying they are additive/safe and approved by the release plan.
9. Never reapply migrations 0001–0008 to the existing Production database.

If a trustworthy repair/backup/restore path cannot be established, stop. Do not create a replacement database.

### E. Clerk Production secret

The previously exposed live key must be treated as compromised. The owner must rotate/revoke it in Clerk Dashboard and provide no secret value to you.

When the owner is present at a genuinely private interactive terminal, run:

```bash
npx wrangler pages secret put CLERK_SECRET_KEY --project-name maelvyn-production
```

The owner enters the new key directly into the hidden prompt. Do not put it in command arguments, environment dumps, prompt text, files, chat, logs, or screenshots.

If secure interactive entry is unavailable, stop and ask the owner to run the command locally. You may then run:

```bash
npx wrangler pages secret list --project-name maelvyn-production
```

Report only whether the secret name exists, never its value.

### F. Domain gate

Inspect current custom-domain assignments and DNS read-only. The latest report says root/www may have been attached to Production and returned HTTP 522; older documentation differs.

Do not make domain or DNS changes. Do not use root/www for initial release verification. Report the exact current state and wait for explicit owner approval for any domain change.

### G. Deployment gate

Before deployment, confirm all of the following:

- Correct GitHub repository, branch, HEAD and Cloudflare account.
- `npm run check` passes on the exact code to be deployed.
- Production Pages/D1/R2 identities and bindings are correct.
- Preview remains isolated.
- New Clerk Production secret is installed securely.
- Migration ledger is compatible and all required migrations are accounted for.
- No secret leakage in tracked files/build artifacts/logs.
- No unresolved blocker that makes startup or authentication unsafe.

Then deploy only with the existing Wrangler package script:

```bash
npm run deploy:production
```

Do not substitute GitHub Actions, Dashboard upload, direct API deployment, or another host. Do not deploy if any gate is not met.

### H. Post-deployment verification

After Wrangler reports success:

1. Record deployment ID, deployment URL, branch, timestamp and deployed commit.
2. Test the isolated `https://maelvyn-production.pages.dev` hostname first.
3. Test health/readiness endpoints and verify readiness fails closed when required configuration is absent.
4. Test Clerk Production Google OAuth end-to-end, callback, session and JWT verification.
5. Verify an unauthenticated user receives no owner/member privilege.
6. Verify the owner bootstrap path is explicit, singleton, auditable, and performed by the owner; do not promote an arbitrary first user.
7. Verify workspace/venture authorization and cross-venture isolation.
8. Verify Production writes reach only Production D1.
9. Verify R2 private upload, access control, retrieval, and unauthorized denial. Do not claim R2 is complete merely because a binding exists.
10. Produce a D1 backup and demonstrate a documented restore test in a safe isolated target; never restore over Production as an experiment.
11. Verify logs and public endpoints do not expose secrets or personal data.
12. Do not cut over root/www domains without separate explicit approval.

### I. Required final report

Return a concise but evidence-based report with:

- Git branch, deployed commit and working-tree status.
- Node/npm/Wrangler versions.
- `npm run check` results and test count.
- Pages project ID and deployment ID/URL.
- Production D1 UUID, migration ledger schema and eight-row verification.
- R2 binding and actual private artifact test evidence.
- Secret presence by name only (never value).
- Clerk OAuth/JWT/owner bootstrap test results.
- Root/www current assignment and HTTP status.
- Backup artifact/checksum and restore-test evidence.
- Any remaining blockers and the exact next action.

Use only these statuses: PASS, FAIL, BLOCKED, NOT TESTED. Distinguish observed facts from assumptions. Never claim an action was completed without command output or live evidence.

### J. Stop conditions

Stop immediately and report if:

- Cloudflare account or resource IDs do not match.
- A proposed action would touch Development.
- The Production ledger repair is not proven lossless or lacks owner approval.
- Secret entry cannot be performed privately by the owner.
- A live secret appears exposed or is found in repository/logs.
- A domain/DNS change is needed but not approved.
- Checks fail, bindings are wrong, or Production config is incomplete.
- A backup/restore safety condition cannot be established.

**Final operating principle:** reuse the existing Production Pages, D1, R2 and Clerk resources. Complete the application deployment and verification. Do not rebuild infrastructure, do not repeat completed schema migrations, and do not bulk-migrate Development data.

---

## PART III — OWNER RELEASE CHECKLIST

- [ ] Revoke/rotate the previously exposed Clerk Production secret.
- [ ] Install the new secret using Wrangler's hidden interactive prompt.
- [ ] Decide root/www domain placement after reviewing the live Cloudflare state.
- [ ] Review and approve the D1 ledger repair plan, if repair is required.
- [ ] Confirm all deployment gates pass.
- [ ] Approve Wrangler deployment to the existing `maelvyn-production` project.
- [ ] Review OAuth, authorization, R2, backup and restore evidence.
- [ ] Approve any later root/www cutover separately.

**No new Production infrastructure is required by this plan.**
