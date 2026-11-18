# MAELVYN — Production Deployment Verification

Date: 2026-11-18
Scope: first real Production deployment of `maelvyn-production` (Wrangler CLI only)

## 1. Status

**DEPLOYED / PARTIALLY VERIFIED.**

The application is live on Production Pages, bound to the Production D1 and R2, with Production Clerk
configuration and per-environment CSP. Public surfaces (HTML, SPA routes, health, readiness, config) are
verified live. Everything that requires a verified end-user session — Google login, JWT verification,
owner bootstrap, administrative access, R2 upload/download — remains **unverified** because
`CLERK_SECRET_KEY` is not installed.

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
