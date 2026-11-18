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
