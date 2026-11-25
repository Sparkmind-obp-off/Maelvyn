# MAELVYN — Production Deployment Verification

Date: 2026-11-18
Scope: first real Production deployment of `maelvyn-production` (Wrangler CLI only)

## 1. Status

**Latest state (2026-11-25): DEPLOYED / PARTIALLY VERIFIED.** The new Production release is live and `/api/v1/ready` returns `200`; the Production Clerk server secret is present as an encrypted Cloudflare secret. Authenticated user journeys, owner bootstrap, R2 round-trip, and backup/restore remain unverified, so this is **not** a general-launch or Production-Verified claim.

> Historical note: sections 2–6 below preserve the first-deployment evidence from 2026-11-18. Statements there that the secret was absent, readiness was `503`, or no current deployment existed are superseded by sections 7–8 below. Do not use that dated snapshot as the present state.

## 2. Commit and deployment

| Item | Value |
|---|---|
| Base commit | `97a2629` |
| Deploy fix commit | `9b8ecb9` (HEAD) |
| Deployment ID | `d0c365d9-4bfe-4f58-bbab-c8ad88484cb7` |
| Environment | Production, branch `main` |
| Canonical URL | https://maelvyn-production.pages.dev |
| Deployment URL | https://d0c365d9.maelvyn-production.pages.dev |

### 2.1 Root cause fixed in this deployment

`wrangler pages deploy` rejects `--config <custom path>`:

```
✘ [ERROR] Pages does not support custom paths for the Wrangler configuration file
```

The previous `deploy:production` script passed `--config wrangler.production.jsonc`, so **Production had
never been deployable**. `ops/deploy-production.sh` now temporarily stages `wrangler.production.jsonc` as
the root `wrangler.jsonc`, deploys, and restores the Development config via an `EXIT/INT/TERM` trap. It
also refuses to run if the Production config references any Development resource
(`maelvyn-dev`, `ad21e923`, `accounts.dev`, `pk_test`).

Verified after deploy: root `wrangler.jsonc` is back to `"name": "maelvyn-dev"` with zero Production references.

## 3. Verified live evidence

### 3.1 Application and API

| Check | Result |
|---|---|
| `https://maelvyn-production.pages.dev/` | `200` |
| `https://d0c365d9.maelvyn-production.pages.dev/` | `200` |
| `/api/v1/health` | `200` `{"status":"ok","environment":"production"}` |
| `/api/v1/config` | `{"environment":"production","identity_instance":"clerk-production","data_policy":"production"}` |
| SPA deep link `/workspaces` | `200`, `content-type: text/html` |
| SPA deep link `/w/x/v/y/artifacts` | `200`, `content-type: text/html` |

### 3.2 Readiness (honest state)

`/api/v1/ready` → **`503 not_ready`**

```json
{"database":"ok","schema":"ok","migrations":"ok","artifact_storage":"configured",
 "identity":"configured","identity_secret":"not_configured",
 "authorized_parties":"configured","publishable_key":"configured"}
```

Every dependency is satisfied except the Clerk server secret. This is the single blocking item.

### 3.3 D1 Production connectivity — read/write/read-back

Executed against the **remote** `maelvyn-production-db` (`6b42d874-61c8-4ebe-8b79-de7432e094de`), not a local DB.

| Step | Result |
|---|---|
| INSERT probe row (`rate_limits`) | success |
| SELECT read-back | `{"bucket":"probe_1794997605","count":1}` |
| DELETE cleanup | 1 row |
| SELECT after cleanup | `n = 0` |
| `PRAGMA foreign_key_check` | `[]` (clean) |
| Data set | people 0, workspaces 0, ventures 0, platform_roles 0, artifacts 0 |

Production holds schema + configuration only, and **no Development test data**.

### 3.4 Migration ledger

9 migrations recorded (`0001`–`0009`), including `0009_private_artifacts.sql` applied exactly once.
The eight original records retain their original `applied_at` timestamps after the ledger repair.

### 3.5 R2

- Bucket `maelvyn-production-private` exists, bound as `ARTIFACTS` (Production deployment config verified).
- Bucket is private; no public route exposes objects. Objects are served only by the Worker after an
  authorization check, or via a single-use 5-minute delivery token re-authorized at redemption.
- Object count: 0. Live upload/download **not yet verified** (blocked by 3.7).

### 3.6 Security headers (per-environment CSP)

Live `content-security-policy` on the Production HTML:

- `script-src 'self' https://clerk.maelvyn.biz.id https://challenges.cloudflare.com https://*.protect.clerk.com`
- occurrences of `accounts.dev` (Development Clerk): **0**
- `wss://clerk.maelvyn.biz.id` included for realtime
- `frame-ancestors 'none'`, `object-src 'none'`
- HTML: `cache-control: no-store`; hashed assets: `immutable`
- `x-frame-options: DENY`, `x-content-type-options: nosniff` present on API responses too

The CSP is generated per deployment from `CLERK_ISSUER` in `server/worker.ts`; `public/_headers` no longer
hardcodes any Clerk domain. `public/_routes.json` was changed to `include: ["/*"]` so HTML actually passes
through the Worker (previously only `/api/*` did, so no CSP could ever be applied to pages).

### 3.7 Authentication — fail-closed, confirmed live

| Request | Result |
|---|---|
| `GET /api/v1/session` (no token) | `503 SERVICE_UNAVAILABLE` — "Identity provider is not fully configured for this environment." |
| `GET /api/v1/session` (forged JWT) | `503` (same guard, checked before token parsing) |
| `POST /ventures/x/artifacts` (no session) | `503` |

The guard is intentional and was **not** removed to make the deployment look successful: without the
server-side secret, a Production request cannot be tied to a verified identity, and provisioning one would
create profile-less accounts. Public health/readiness/config remain reachable for monitoring.

### 3.8 Secret hygiene

`/api/v1/health`, `/api/v1/ready`, `/api/v1/config` were scanned for `sk_live`, `sk_test`, `tvly-` —
**0 occurrences** in all three.

### 3.9 No runtime dependency on Development

| Check | Result |
|---|---|
| Production CSP references Development Clerk | no (0 occurrences) |
| Production `/config` reports `clerk-production` | yes |
| `wrangler.jsonc` after deploy | `maelvyn-dev`, 0 Production references |
| `maelvyn-dev.pages.dev` | `200` (untouched) |
| `maelvyn-dev-db` contents after all work | people 8, workspaces 4 (unchanged) |
| Production D1 bound to Development DB | no — `DB` → `6b42d874…` |
| Production R2 bound to a Development bucket | no — Development declares no R2 binding |

### 3.10 Domain

| Host | Before | Now |
|---|---|---|
| `maelvyn.biz.id` | `522` | **`200`** |
| `www.maelvyn.biz.id` | `522` | **`200`** |
| `maelvyn.biz.id/api/v1/health` | `522` | `200`, `environment: production`, served from EWR |

The 522 was caused by the domains being attached to `maelvyn-production` while that project had **no
deployment at all**. The first successful deployment resolved it; no DNS or domain change was made.

**Important consequence:** the public root domain now serves a Production site where sign-in is impossible
until the Clerk secret is installed. This is a soft-launch window, not a live service.

### 3.11 Automated tests

`npm run check` → exit `0`: typecheck, lint, **9 test files / 94 tests passing**, build.
Coverage added for: per-environment CSP (Production/Development/absent issuer), production research mode
defaulting to real evidence, fail-closed identity guard, plus the earlier suites (JWT signature/issuer/expiry/azp,
readiness, R2 authorization, cross-venture denial, single-use delivery tokens, owner-boundary invariants).

## 4. Remaining blocker — one owner action

`CLERK_SECRET_KEY` is **not installed** (`wrangler pages secret list` shows none).

The key pasted in chat must be treated as **compromised** and revoked; it was never used by this work.
The replacement must be entered only through the hidden interactive prompt:

```bash
npx wrangler pages secret put CLERK_SECRET_KEY --project-name maelvyn-production
```

Then, to pick up the secret and finish verification:

```bash
cd <repo> && npm run deploy:production
```

## 5. Not yet verified (requires the secret)

| Area | Status |
|---|---|
| Google sign-in on Production origin | BLOCKED |
| JWT issuer/signature/expiry/azp against live Clerk Production JWKS | BLOCKED (unit-tested only) |
| Owner bootstrap `POST /platform/owner/claim` | BLOCKED (owner must perform in browser) |
| Administrative/role access end-to-end | BLOCKED |
| R2 live upload → download → delete | BLOCKED |
| Research live provider execution | BLOCKED (needs a session + provider activation) |

## 6. Honest release statement

Production is **deployed and structurally sound**, and the public plane is verified. It is **not**
operational for users: no one can sign in yet. Do not announce availability until the secret is installed,
Google login succeeds, the owner claims the platform exactly once, and the R2 round-trip is proven live.


## 7. Latest Production release — 2026-11-25

### 7.1 Release identity

| Item | Verified value |
|---|---|
| Source branch / SHA | `main` / `71c07eac092e52274ace4d97dbb593f8c552792b` (Cloudflare reported source `71c07ea`) |
| Source commit URL | https://github.com/Sparkmind-obp-off/Maelvyn/commit/71c07eac092e52274ace4d97dbb593f8c552792b |
| Cloudflare account | `sparkmind.support@gmail.com`, account `a167a50f1272635d3c1145aab3cd8f98` (Wrangler `whoami`; token value not read or recorded) |
| Pages project | `maelvyn-production`, existing production branch `main` |
| Wrangler | `4.164.0`; Node `v22.23.4`; npm `10.9.9` |
| Deployment ID | `356aa389-dfe3-4438-a6ed-8f5a7c0f668f` |
| Deployment URL | https://356aa389.maelvyn-production.pages.dev |
| Production/canonical URL | https://maelvyn-production.pages.dev |
| Existing attached domains checked | https://maelvyn.biz.id and https://www.maelvyn.biz.id |
| Deployment time | 2026-11-25, approximately 09:17 +07 (Wrangler reported the deployment at 09:17:08 +07) |
| Previous Production deployment | `a26473a5-cb13-4dfd-a5c9-e36765316010` (pre-release rollback candidate; rollback not executed) |

Deployment used the repository's `npm run deploy:production` → `ops/deploy-production.sh` → Wrangler Pages path, with the Production config temporarily staged at `wrangler.jsonc`. The script restored the Development root config afterward; `wrangler.jsonc` again names `maelvyn-dev`. Pages deployment emitted its expected dirty-tree warning while that temporary staging was active; after restoration, local `main` was clean and matched `origin/main`. No DNS records or domain attachments were changed. The existing root/www hostnames were already attached to the Production Pages project, so the release is live there too.

### 7.2 Migration and data safety

Before release, Wrangler showed only `0010_connect.sql` pending on Production D1 `6b42d874-61c8-4ebe-8b79-de7432e094de`. The migration was inspected and applied once through `npm run db:migrate:production`; it adds a proposal table, indexes, and a no-delete trigger. It does not update or delete existing rows. Post-migration Wrangler reported no migrations pending. Aggregate counts before/after were unchanged: people 2, workspaces 0, ventures 0, tasks 0, Connect proposals 0. No row contents or personal data were read/exported.

Cloudflare Wrangler confirmed `CLERK_SECRET_KEY` exists as an encrypted Production secret; only its name/presence was checked. No secret value was retrieved, printed, or written to source/docs.

### 7.3 Quality and live smoke evidence

- `npm ci`: exit 0; npm reported 0 vulnerabilities.
- `npm run check`: exit 0 — typecheck, lint, 11 test files / 102 tests passing, and web/Worker production build.
- Build emitted one non-fatal Vite warning: main JS bundle about 505.10 kB minified (144.32 kB gzip), slightly above 500 kB.
- Production Pages deployment: Wrangler reported `Deployment complete`; ID and URL above.
- Homepage: HTTP 200 on `maelvyn-production.pages.dev`, the deployment URL, `maelvyn.biz.id`, and `www.maelvyn.biz.id`; the approved tagline was present in HTML.
- `/api/v1/health`: HTTP 200, environment `production`.
- `/api/v1/ready`: HTTP 200; D1, schema, migrations, R2 configuration, identity, secret presence, authorized parties, and publishable key reported configured/ok.
- `/api/v1/config`: HTTP 200; only public Production configuration returned, no server secret.
- Unauthenticated `/api/v1/session`, `/api/v1/connect/manifest`, and `/api/v1/connect/registry`: HTTP 401, as expected.
- Production migration ledger: no pending migrations. Post-deploy D1 aggregate counts match the pre-deploy values above.
- Local Connect tests in `npm run check` cover unauthenticated rejection, scope, viewer write denial, and pending/audited proposal behavior.
- `git diff --check` passed; root Development config restored; working tree was clean immediately after deployment verification.

### 7.4 Provider, cost, authorization

This release used the existing Cloudflare API token via the `CLOUDFLARE_API_TOKEN` environment for Wrangler, the existing Cloudflare account/project, and the repository's existing build/deploy tooling. The user explicitly requested deployment through Cloudflare. No third-party paid API, paid visual asset, new service, DNS change, or separate purchase was made. Cloudflare account-level usage/billing was not independently inspected; normal Cloudflare plan/usage charges remain governed by that account. Build files were uploaded to the user's existing Cloudflare Pages project; no database export or user-content transfer was performed.

## 8. Remaining verification and release decision

**Current label: DEPLOYED / PARTIALLY VERIFIED — not Production Verified.** A `200 ready` response proves configured dependencies, not a complete authenticated user journey. Still pending: real Google sign-in and Production JWT issuer/signature/expiry/authorized-party verification; owner bootstrap (must be performed personally by the owner); authorized role and cross-workspace/venture E2E checks; live private R2 upload/download/delete; and backup/isolated restore verification. No owner was claimed, no workspace/venture was created, and no general-launch claim is made. The existing E2E script is explicitly development-only; it was not run against Production or with a Production secret.

Rollback candidate is the preceding deployment ID in section 7.1. No rollback or DNS/domain mutation was performed. Do not mark Production Verified or announce general availability until remaining security, owner, storage, and recovery gates are proven.


## 9. Repository audit and safe release delta — 2026-11-25

The repository was freshly cloned from `main` at baseline `cb82bbf50ec737f1ae14f0c370cec20ed73a1bb2` and audited against the live domain before changes. Baseline validation passed `npm ci` with 0 reported vulnerabilities and `npm test -- --run` with 11 test files / 103 tests passing. The live root returned HTTP 200 with the expected security headers, but `/robots.txt` and `/sitemap.xml` returned the SPA HTML shell rather than crawler documents.

The safe release delta adds:

- `public/robots.txt` with explicit public/private boundaries and the canonical sitemap URL;
- `public/sitemap.xml` containing only the public home and product catalog routes;
- canonical, Open Graph, Twitter, theme-color, and no-JavaScript fallback metadata in `web/index.html`;
- regression coverage in `tests/public-site.test.ts` for crawler documents and initial public metadata.

Post-change local validation passed `npm run check`: typecheck, lint, 11 test files / 105 tests, and web/Worker build. `git diff --check` passed and the changed files contain no credentials or Development Clerk references. The build retains a non-fatal Vite bundle-size warning (main JavaScript approximately 533 kB minified).

This delta is **safe and tested locally but not yet deployed** because the current execution environment has no active GitHub or Cloudflare authorization. The live deployment therefore remains the prior verified release until this commit is pushed to `main` and deployed through the existing Wrangler/Pages path. Production remains **DEPLOYED / PARTIALLY VERIFIED**, not Production Verified; authenticated sign-in/JWT, owner bootstrap, role and tenant E2E, private R2 upload/download/delete, and backup/restore remain unresolved.
