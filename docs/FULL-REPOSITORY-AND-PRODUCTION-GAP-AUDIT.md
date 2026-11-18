# MAELVYN — Full Repository & Production Gap Audit

**Audit date:** 2026-11-18  
**Repository:** https://github.com/Sparkmind-obp-off/Maelvyn  
**Branch:** main  
**Audited head:** 0e79439c65dc7daefa7b418a523ac66cc6bbd05a  
**Status:** Codebase inspected; production release BLOCKED.

## 1. Executive finding

MAELVYN is not a blank scaffold. The repository contains a React 19 + TypeScript + Vite frontend, Hono API running as a Cloudflare Pages advanced-mode Worker, eight D1 migrations, a database-backed identity and authorization model, venture/workspace governance, finance/rights/operations modules, provider adapters, tests, and operating documentation.

The application is a substantial development foundation. It is not yet proven to be a complete live production service. A successful Pages deployment whose target label says "production" is not equivalent to an application configured with APP_ENV=production.

## 2. Verified repository inventory

- Web: React, Clerk React Core 3, React Router, Vite, Tailwind CSS.
- API: Hono; server-side Clerk JWT verification using jose and remote JWKS.
- Data: D1 migrations 0001–0008.
- Identity: Clerk subject → internal person; first login creates account identity only.
- Access: database-resolved platform owner, workspace role, venture membership; deny-by-default and venture scope checks.
- Governance: charters, approvals, stage requests, decision records, risk and review structures.
- Finance/rights/operations: dedicated route modules and append-only/immutable record patterns in schema.
- Agentic/provider layer: Research Brief task runner, provider registry for mock-search, Tavily, Firecrawl, Apify, Scrape.ly and Workers AI.
- Tests: auth, identity, members, modules, providers, research, D1 shim and one Clerk Development Playwright E2E.
- CI: GitHub workflow runs typecheck, lint, Vitest and build.

## 3. Material code observations

### Positive controls observed
- Clerk JWT verification checks signature via JWKS, issuer, expiry and authorized party allowlist.
- Development test keys are rejected by the verifier when APP_ENV is production.
- First sign-in provisions an account but grants no workspace or venture membership.
- Platform owner claim re-reads verified primary email from Clerk Backend API and is singleton/audited.
- Workspace and venture permissions are read from D1; client-supplied roles are not trusted.
- Cross-venture access is denied unless a workspace-wide role or explicit venture assignment applies.
- Provider routing checks agent capability allowlist, credentials, workspace enablement, paid execution approval and per-task/daily caps; no automatic provider fallback.
- Actor execution has an explicit max charge bound and idempotency header.
- Research tasks use idempotency, kill-switch checks and human review.
- API applies no-store, nosniff, referrer and frame headers and returns request IDs.

### Risks / gaps requiring implementation or evidence
1. `/api/v1/config` returns the Clerk publishable key and identifies the instance by key prefix. This is public config by design, but it must be confirmed that the production build is served only with the intended live publishable key and matching backend secrets.
2. `/ready` currently checks database, a small table subset, migration names and presence of issuer/JWKS. It does not prove the Clerk secret works, provider health, R2 access, owner bootstrap, legal gates, backup/restore, or production origin correctness.
3. `verifyClerkToken` only rejects a non-empty unauthorized-party claim when an allowlist exists. Production should fail closed if authorized-party configuration is missing/empty and reject missing `azp` where the chosen Clerk token contract requires it.
4. `fetchClerkProfile` returns null on missing secret or upstream failure. The first-login path still creates an identity record with null/unverified profile; owner claim separately refreshes and blocks, which is safe for owner claim but requires operational monitoring.
5. Rate limiting uses the current D1-backed implementation; distributed concurrency, hot-key contention and abuse behavior need production load testing.
6. API security headers do not establish a full Content-Security-Policy. Review Clerk script/connect origins and implement a tested CSP before public production.
7. No MAELVYN production R2 bucket or binding was found. Current code's Env interface also has no R2 artifact binding, so private file delivery is not implemented as a production capability.
8. Workers AI adapter deliberately reports unconfigured and exposes no executable capability. Do not advertise live inference as implemented.
9. No production-specific Clerk E2E exists. The existing E2E explicitly rejects live Clerk keys and is development-only.
10. No evidence in the repo audit establishes a production owner account, a successful Production Google sign-in, a completed first owner claim, or production D1 migration.
11. No confirmed production payment execution or settlement integration is evidenced by this repository; do not infer it from finance records or UI.
12. Legal/privacy/terms and data-retention review remains a release gate.

## 4. Verified Cloudflare state (read-only inspection)

Account: MAELVYN Cloudflare account already identified in the prior audit.

- Existing Pages project: `maelvyn-dev`.
- Root and `www` MAELVYN domains are attached to `maelvyn-dev`.
- Its deployment target is named `production`, but `APP_ENV=development`, Clerk Development issuer/JWKS, test publishable key and `maelvyn-dev-db` are bound.
- Existing development D1: `maelvyn-dev-db` (`ad21e923-f1f2-4a77-b5f7-d9b85afe217b`).
- No MAELVYN-specific Production D1 or R2 bucket was found at audit time.
- Never reuse another venture's D1 or private R2 bucket.
- Cloudflare API redacts secret values; a blank/redacted secret value is not proof that a secret is absent.

## 5. Verified Clerk Production state

- Clerk application: `Maelvyn` (`app_3MGax1kdfbzSasqHwUlBO9E1DJ3`).
- Development instance: `ins_3MGawyTIeUoXm52k4cQHMQ5YCrB`.
- Production instance: `ins_3MGb1IDHmPZvgywrCn50QjHDaW4`.
- Auth frontend API: `https://clerk.maelvyn.biz.id`.
- Accounts portal: `https://accounts.maelvyn.biz.id`.
- Clerk reports the Production domain, required DNS records and SSL complete.
- Google OAuth Production credentials report configured.
- Production user count at audit time: 0.
- Production sign-up is public; Google enabled; email/password sign-in disabled; MFA and CAPTCHA/bot protection disabled; account lockout enabled (10 attempts / 60 minutes); maximum session lifetime 7 days; inactivity timeout disabled; Clerk legal URLs not configured.
- Do not change sign-up/MFA/bot controls blindly. First establish the owner bootstrap and recovery path, then apply a reviewed restricted-invitation posture.

## 6. Production architecture target

Keep the existing development project untouched:
- `maelvyn-dev.pages.dev` → Clerk Development → `maelvyn-dev-db` → synthetic/test data only.

Create isolated production resources:
- Dedicated Pages project `maelvyn-production`, initially only on `maelvyn-production.pages.dev`.
- Clerk Production instance above, with live publishable key in the frontend and secret key only as a Cloudflare secret.
- Dedicated D1 `maelvyn-production-db`.
- Dedicated private R2 `maelvyn-production-private`.
- Production environment variables, allowed parties and backups.
- No root/www domain move until staging checks pass and the owner explicitly approves cutover.

The code currently reads `CLERK_PUBLISHABLE_KEY` from runtime `/api/v1/config`, not `VITE_CLERK_PUBLISHABLE_KEY`. Use the actual code contract unless intentionally refactoring it with tests.

## 7. Clerk Production implementation requirements

1. Confirm Production instance ID and frontend API URL against Clerk.
2. Obtain the Production publishable key from the MAELVYN Clerk application metadata.
3. Add `CLERK_PUBLISHABLE_KEY`, `CLERK_ISSUER=https://clerk.maelvyn.biz.id`, `CLERK_JWKS_URL=https://clerk.maelvyn.biz.id/.well-known/jwks.json`, and explicit authorized parties to the isolated production project.
4. Add `CLERK_SECRET_KEY` only through Cloudflare's secret-text interface. Never commit, print, paste into prompts or write it into ordinary vars.
5. Confirm frontend and backend keys belong to the same Production instance.
6. Test Google sign-in, callback, token refresh, sign-out, issuer mismatch, expired/tampered token, missing/invalid azp, and unauthorized workspace/venture requests.
7. Verify owner account by actual sign-in and audited owner claim; do not create a user or claim ownership on behalf of the user.
8. Restrict public signup only after owner bootstrap and recovery have been proven.

## 8. Implementation sequence and release gates

### P0 — Safe production foundation
- Provision isolated Production D1, R2 and Pages project without attaching root/www.
- Update Wrangler configuration with explicit production bindings, but keep all Production secrets out of source.
- Add migration and rollback evidence; do not migrate real data from development.
- Configure project secrets directly in Cloudflare.
- Deploy to the isolated Pages hostname only when all required bindings and keys are present.

### P1 — Identity and security
- Fail closed on missing Production authorized-party allowlist.
- Add Production Clerk smoke/E2E path that cannot accidentally run against Development or vice versa.
- Add CSP and test the exact Clerk origins.
- Test owner bootstrap and account recovery with the actual owner.
- Confirm invitation-only/member access policy.

### P2 — Data and operations
- Implement private R2 upload/download authorization, signed short-lived delivery and audit before claiming artifact delivery.
- Verify backups and isolated restore.
- Exercise rate limits, kill switches, provider caps and incident response.
- Keep paid providers disabled unless credentials, quota, terms, allowlists and budgets are approved.

### P3 — Cutover
- Review terms/privacy/legal disclosures.
- Test production hostname and rollback.
- Obtain explicit cutover approval.
- Only then move root/www domains from the dev project to the production project.
- Preserve dev hostname and bindings for development.

## 9. Verification standard

A task is complete only with code/configuration evidence, tests or a live read-only verification. Label every item PASS, FAIL, BLOCKED or UNVERIFIED. Never represent a resource as live merely because a config file or prompt describes it.

## 10. Current release decision

**NOT PRODUCTION-READY / NO PUBLIC CUTOVER.** The Clerk Production identity instance exists and is domain-verified, but the application remains on Development bindings. The next release gate is isolated Production infrastructure plus secure credential injection and end-to-end verification.


## 11. Implementation actions performed after the read-only audit — 2026-11-18

The following Cloudflare resources/configuration were safely created without changing the existing development project or custom domains:

- New Pages project: `maelvyn-production`.
- Pages project ID: `77cd5d42-5667-4ac4-9dbd-edb60c5ea249`.
- Isolated hostname: `https://maelvyn-production.pages.dev`.
- Production branch: `main`; build command `npm run build`; output `dist`.
- New private-intended R2 bucket: `maelvyn-production-private` (APAC, Standard).
- Pages Production binding: `ARTIFACTS` → `maelvyn-production-private`.
- Pages Production vars set: `APP_ENV=production`, Clerk Production issuer, Clerk Production JWKS URL, the MAELVYN Clerk Production publishable key, and authorized party `https://maelvyn-production.pages.dev`.
- Pages preview and production `fail_open=false`; preview has no Production environment variables.
- No custom root/www domains were attached. Existing `maelvyn-dev` remains unchanged.
- No Production deployment exists yet (`latest_deployment=null` at project creation/configuration).

### Hard blocker: D1 account limit

Creating `maelvyn-production-db` was attempted and Cloudflare returned HTTP 403 / error 7406: **System limit reached: databases per account (10)**. The account currently lists ten D1 databases. A separate database named `test-permission-check-invalid` has only Cloudflare's internal `_cf_KV` table in a read-only schema check, but it has not been deleted. Deleting any existing database is destructive and requires explicit owner approval. Do not bind MAELVYN Production to the Development D1 or another venture's D1 to work around this limit.

### Remaining Production blockers
- Dedicated MAELVYN Production D1 not created due account limit.
- `CLERK_SECRET_KEY` not set in Pages secret-text. The connector does not reveal existing Clerk secret keys; add the MAELVYN Production secret directly through Cloudflare's secure secret UI.
- No deployment, migration, E2E, owner sign-in/claim or restore test completed.
- R2 bucket exists and is bound, but the application has no R2 artifact implementation yet; do not advertise file delivery.
- Root/www domain cutover remains intentionally untouched.
