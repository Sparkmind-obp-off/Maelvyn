# MAELVYN — Domain, Environment & Release Strategy

**Version:** 1.0.0  
**Status:** Target configuration; DNS and production resources not yet verified  
**Primary domain:** `maelvyn.biz.id`

## 1. Domain status

The domain `maelvyn.biz.id` has been reported as purchased by the user. Purchase alone does not prove that:
- The domain is delegated to the intended DNS provider.
- The zone is active in the correct Cloudflare account.
- DNS records are configured.
- SSL is issued.
- A production app or Clerk domain is verified.

Do not publish DNS targets or claim production readiness until records are read from the relevant provider and verified.

## 2. Proposed hostname map

| Hostname | Intended use | Status |
|---|---|---|
| `maelvyn.biz.id` | Public corporate/ecosystem site | Proposed |
| `www.maelvyn.biz.id` | Canonical redirect or public alias | Proposed |
| `app.maelvyn.biz.id` | Authenticated MAELVYN application | Proposed |
| `api.maelvyn.biz.id` | API only if separately routed | Optional |
| `accounts.maelvyn.biz.id` | Clerk custom auth domain candidate | Proposed; confirm from Clerk-generated DNS |
| `dev.maelvyn.biz.id` | Development app, only if custom dev hostname is needed | Optional |

The existing development deployment `https://maelvyn-dev.pages.dev` remains the known development URL until a verified change is made.

## 3. Environment separation

| Environment | Frontend | API | Database | Identity | Data |
|---|---|---|---|---|---|
| Local | localhost | local worker | local D1 | Clerk Development | synthetic |
| Development | `maelvyn-dev.pages.dev` | dev worker/API | `maelvyn-dev-db` | Clerk Development | synthetic/test |
| Production | `app.maelvyn.biz.id` (proposed) | production worker/API | separate production D1 | Clerk Production | approved live data only |

Never point production code at development D1 or development Clerk keys. Never point development code at production resources.

## 4. Configuration matrix

Use separate environment variables/secrets for each environment.

### Browser-safe values
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL`
- `VITE_APP_ENV`

### Server-only secrets
- `CLERK_SECRET_KEY`
- `CLERK_JWKS_URL` only if the implementation explicitly requires a configured URL rather than issuer discovery.
- Provider API credentials.
- Webhook signing secrets.
- Encryption keys and internal service credentials.

Never place server secrets in `VITE_*`, source control, client bundles, screenshots, or logs. Do not paste secrets into issue comments or documentation.

## 5. Clerk production separation

- Keep the current development Clerk instance for development only.
- Production must use a dedicated Clerk Production instance and live keys.
- The frontend publishable key and backend secret key must belong to the same production instance.
- Configure the production application URL and allowed origins using the exact deployed hostnames.
- Configure OAuth provider credentials separately for production; development OAuth credentials are not assumed to work in production.
- Use Clerk-generated DNS records for the custom auth domain. Do not invent CNAME targets.
- Verify domain, SSL, redirect, sign-in, sign-out, session JWT, issuer, and server-side authorization before accepting live users.
- Do not weaken minimum ClerkJS version protections to work around SDK incompatibility.

## 6. Cloudflare deployment boundaries

- Keep Pages/Workers development and production deployments distinct.
- Use separate D1 databases and migration histories.
- Use separate R2 buckets or strict environment-level bucket isolation.
- Use distinct API tokens/secrets with least privilege.
- Do not run production migrations until a backup/export and rollback plan are verified.
- Use preview deployments for code review; preview must not connect to production data or secrets.
- Production deploys require a release record and verified build/test output.

## 7. DNS and TLS sequence

1. Confirm the registrar and current authoritative nameservers.
2. Confirm the domain is active in the intended Cloudflare account/zone.
3. Confirm DNSSEC status and avoid conflicting nameserver changes.
4. Add the Pages custom domain using the exact Cloudflare-generated instructions.
5. Add Clerk custom domain only after the production Clerk instance exists; copy its exact generated DNS records.
6. Confirm DNS propagation and provider-side verification.
7. Confirm TLS certificate issuance.
8. Test root, app, auth, API, canonical redirects, and security headers.
9. Record screenshots or machine-readable verification evidence without exposing secrets.

## 8. Rollback and change control

For each production release record:
- Release ID and source commit.
- Build and test results.
- Database migration version.
- Environment/config version (never secret values).
- DNS changes.
- Clerk instance and domain IDs (not secret keys).
- Backup reference.
- Rollback procedure and owner.
- Post-deploy smoke-test results.

Do not change DNS, authentication issuer, production secrets, or production database in one unreviewed step. Prefer reversible changes and a staged cutover.


## 9. Observed Cloudflare state (2026-11-18)

Read-only inspection of the connected Cloudflare account found:
- Zone `maelvyn.biz.id` exists and reports `active`.
- Cloudflare authoritative nameservers are `ace.ns.cloudflare.com` and `elaine.ns.cloudflare.com`.
- Pages project `maelvyn-dev` has `maelvyn.biz.id` and `www.maelvyn.biz.id` attached as custom domains.
- The Pages project's configured production deployment environment currently declares `APP_ENV=development`, uses a Clerk Development issuer and test publishable key, and binds the development D1 database `maelvyn-dev-db`.

**Critical interpretation:** Cloudflare Pages labels this deployment target as `production`, but its application environment and identity/database bindings are development. The custom domain is therefore attached to a development-configured project. Do not treat the custom domain or Pages deployment label as proof of a production environment.

### Required correction before public launch

1. Keep the current `maelvyn-dev` project as development and remove the public root/www custom-domain binding from it as part of a planned cutover, or otherwise restrict access while it remains development-configured.
2. Provision a distinct production application environment with a distinct Worker/Pages production configuration, D1 database, R2 bucket, and Clerk Production instance.
3. Validate the production app on a staging hostname first.
4. Move `maelvyn.biz.id` and `www.maelvyn.biz.id` to the verified production Pages project only after all release gates pass.
5. Preserve the development URL `maelvyn-dev.pages.dev` for development testing.
6. Confirm DNS/TLS and smoke tests after cutover.

Do not delete the current project or database. Do not run production migrations against `maelvyn-dev-db`. The correction should be a reversible, staged domain cutover.


## 10. Corrected live audit — 2026-11-18

The MAELVYN-specific Clerk connection has now been identified. Clerk Production already exists; do not create another instance:
- Clerk application: `Maelvyn`.
- Production instance: `ins_3MGb1IDHmPZvgywrCn50QjHDaW4`.
- Auth frontend: `clerk.maelvyn.biz.id`.
- Accounts portal: `accounts.maelvyn.biz.id`.
- Clerk domain, five required CNAME records, SSL, and mail verification: `complete`.
- Google OAuth production credentials: configured.
- Production Clerk users: 0 at audit time.

The remaining blocker is application environment separation, not Clerk instance creation.

### Verified Cloudflare state

- Pages project `maelvyn-dev` has `maelvyn-dev.pages.dev`, `maelvyn.biz.id`, and `www.maelvyn.biz.id` attached.
- Its production deployment target still has `APP_ENV=development`, Development Clerk issuer/JWKS, and a test publishable key.
- It binds D1 `maelvyn-dev-db` (ID `ad21e923-f1f2-4a77-b5f7-d9b85afe217b`).
- D1 read-only inspection confirms migrations `0001` through `0008` are applied and the application schema exists. The Cloudflare database list's `num_tables` metadata was inconsistent with direct SQL inspection; use the direct D1 query as the schema evidence.
- The account's R2 bucket listing contains no MAELVYN-specific bucket. Do not reuse another venture's private bucket.
- The Cloudflare API response redacts secret-text values; presence/value of `CLERK_SECRET_KEY` cannot be verified from that response. Do not interpret a redacted empty value as proof that a secret is absent.

### Required next steps

1. Keep `maelvyn-dev` and `maelvyn-dev-db` as Development; do not relabel or repurpose them.
2. Create a dedicated production Pages/Worker deployment and a distinct production D1 database, plus a MAELVYN-specific private R2 bucket if digital asset storage is needed.
3. Bind the existing Clerk Production instance to the production application: `CLERK_ISSUER=https://clerk.maelvyn.biz.id`, production JWKS endpoint, and the Production publishable key. Add the Production secret key directly through a secure Cloudflare secret entry; never commit or paste it into chat.
4. Use a staging hostname and test Google sign-in, callback URLs, session verification, authorization, owner bootstrap, and invitation flows.
5. Review sign-up mode, MFA, CAPTCHA, terms/privacy URLs, and session policy before external onboarding.
6. Only after the production release checklist passes, move `maelvyn.biz.id` and `www.maelvyn.biz.id` from the development project to the dedicated production project.

No live application environment, DNS, Clerk auth configuration, or database was changed during this audit.


## 10. Production provisioning update — 2026-11-18

A separate Pages project `maelvyn-production` (ID `77cd5d42-5667-4ac4-9dbd-edb60c5ea249`) now exists at `https://maelvyn-production.pages.dev`, without custom root/www domains. It has Production Clerk public configuration and the authorized-party allowlist for that Pages hostname. Its preview and production configurations use `fail_open=false`.

A separate R2 bucket `maelvyn-production-private` has been created and bound as `ARTIFACTS`. The application does not yet implement R2 artifact handling.

Creating `maelvyn-production-db` failed because the Cloudflare account reached its 10 D1 database limit. Do not reuse dev D1 or another venture database. A potentially disposable test database must not be deleted without owner approval.

The Production Clerk secret is not configured yet; insert it directly into Cloudflare secret-text. No deployment exists. The current root/www domains remain attached to `maelvyn-dev` until the isolated project is complete, tested and cutover is explicitly approved.


## 11. Production D1 completion — 2026-11-18

The Production D1 database has now been created: `maelvyn-production-db` (UUID `6b42d874-61c8-4ebe-8b79-de7432e094de`, APAC). It is bound to the isolated `maelvyn-production` Pages project as `DB`. Migrations 0001–0008 have been applied and verified, with 59 total tables including internal `_cf_KV`.

The Development database `maelvyn-dev-db` (UUID `ad21e923-f1f2-4a77-b5f7-d9b85afe217b`) was not deleted or modified. No existing database was deleted to make room.

Production-only Wrangler config is `wrangler.production.jsonc`; scripts `db:migrate:production` and `deploy:production` are available. The Production Pages project has exact Clerk Production public configuration and D1/R2 bindings. It still lacks `CLERK_SECRET_KEY`, an actual deployment, Production E2E, owner bootstrap and restore evidence. Root/www stay on the existing dev project until explicit approved cutover.


---

## 12. Production deployment evidence reconciliation — 2026-11-24

The earlier proposed-only sections are historical. The 2026-11-18 verification records:
- `maelvyn-production` Pages project deployed and reachable.
- Production D1 `maelvyn-production-db` bound and verified with read/write/read-back.
- Production private R2 `maelvyn-production-private` bound as `ARTIFACTS`.
- Production Clerk issuer and publishable configuration present.
- Production readiness returned 503 because `CLERK_SECRET_KEY` was not installed.
- The root and www domains returned 200 after the first production deployment; this does not mean authenticated service launch is approved.

Re-check current Cloudflare/Clerk state before any change. Do not move domains, reuse Development resources, or deploy from a dashboard. The Wrangler-only process remains the recorded deployment route.
