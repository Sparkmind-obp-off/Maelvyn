# MAELVYN — Clerk Production Runbook

**Version:** 1.0.0  
**Status:** Prepared; production application binding is UNVERIFIED  
**SDK:** Clerk Core 3 via `@clerk/react`  
**Parent documents:** `docs/SECURITY-PRIVACY-OPERATIONS.md`, `docs/DOMAIN-AND-ENVIRONMENT-STRATEGY.md`

## 1. Known state

Repository documentation reports:
- Development application deployed at `https://maelvyn-dev.pages.dev`.
- Clerk Development sign-in uses Clerk Core 3 (`@clerk/react`).
- Server-side JWT verification is implemented.
- Development data is synthetic.
- Production deployment is not established in the repository's last recorded status.
- Production Clerk must remain blocked until the application binding, domain, secrets, and release gates are verified.

A read-only check of the currently connected Clerk workspaces did not identify an application named MAELVYN. It showed applications for other projects. Do not reuse another project's Clerk application, instance, domain, or keys for MAELVYN. The correct MAELVYN Clerk application/account binding must be identified or created intentionally.

## 2. Production target

- Clerk application: MAELVYN-specific application (ID to be recorded after verification).
- Instance: Production.
- Primary app origin: `https://app.maelvyn.biz.id` (proposed).
- Auth custom domain: `accounts.maelvyn.biz.id` (candidate; use exact Clerk-generated configuration).
- SDK: `@clerk/react` Core 3; Node.js >=20.9.0.
- Backend: verify Clerk session JWT server-side using the production issuer/JWKS and audience/origin policy.
- Authorization: retain MAELVYN's database-backed deny-by-default policy. Clerk authenticates identity; MAELVYN backend authorizes workspace and venture actions.

## 3. Preconditions

Do not create or activate production identity until:
- Correct Clerk workspace/account is confirmed.
- MAELVYN-specific Clerk application is identified or explicitly authorized for creation.
- Domain ownership and DNS control are verified.
- Production app hostname and canonical origin are fixed.
- OAuth provider production credentials are available if OAuth is enabled.
- Privacy notice, terms, support contact, and data retention policy are reviewed.
- Owner bootstrap and account recovery procedures are verified.
- Production D1 and secrets are isolated from development.
- Cross-venture access and session revocation tests pass.
- A rollback and incident response owner is named.

## 4. Provisioning sequence

1. Inspect the correct Clerk application and current development configuration.
2. Confirm the app is MAELVYN-specific; never infer from a generic app name.
3. Review development authentication methods, session lifetime, allowed origins, redirects, bot protection, and minimum SDK protections.
4. Create the production instance only with explicit authorization. Production instance creation may be irreversible.
5. Retrieve the generated DNS targets from Clerk; do not guess CNAME records.
6. Configure DNS at the authoritative provider and wait for Clerk's domain and SSL verification.
7. Configure production OAuth credentials for each enabled provider.
8. Store the production publishable key in the production frontend environment and the secret key only in server-side secret storage.
9. Set production issuer/JWKS verification and allowed origins.
10. Deploy to a protected/staged production hostname.
11. Run sign-in, sign-out, token refresh, invalid token, expired token, issuer mismatch, and cross-venture authorization tests.
12. Complete smoke tests and record release evidence before public launch.

## 5. Environment variables

| Variable | Location | Rule |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Browser build | Production publishable key only in production build |
| `CLERK_SECRET_KEY` | Worker secret | Never expose to browser or logs |
| `CLERK_ISSUER` | Worker config | Exact production issuer |
| `CLERK_JWKS_URL` | Worker config, if required | Exact trusted JWKS URL |
| `APP_ORIGIN` | Worker config | Exact production origin |
| `ALLOWED_ORIGINS` | Worker config | Explicit allowlist, not wildcard |

Use the repository's actual environment variable names after inspecting the implementation. This table is a target contract, not proof that every variable is currently implemented.

## 6. Owner and membership safeguards

- Authentication does not create a workspace membership.
- Signup and first login must not grant admin, workspace, or venture privileges.
- Owner bootstrap must be a one-time, auditable, verified-email process bound to the intended account.
- Never copy development users or synthetic identities into production.
- Invitations are single-use, scoped, expiring, and explicitly accepted.
- No invite grants workspace administration or venture access unless the policy explicitly permits it.
- Role changes require server-side authorization and audit.
- Session revocation and offboarding must remove effective access promptly.

## 7. Verification checklist

- [ ] Correct MAELVYN Clerk application ID verified.
- [ ] Production instance created only after explicit approval.
- [ ] Production DNS and SSL verified by Clerk.
- [ ] OAuth provider production credentials configured and tested, if used.
- [ ] Production frontend and backend keys match the same instance.
- [ ] SDK is Core 3 and meets Clerk's minimum version protection.
- [ ] JWT issuer, signature, expiry, authorized party/origin are verified server-side.
- [ ] No development keys or test instance IDs in production bundle/config.
- [ ] No automatic workspace or venture membership on signup.
- [ ] Owner bootstrap tested and audited.
- [ ] Unauthorized and cross-venture requests return 401/403 as appropriate.
- [ ] Sign-out, session revocation, offboarding, and account recovery tested.
- [ ] No secrets appear in logs, browser bundle, repository, or documentation.

## 8. Rollback

If production authentication fails:
1. Stop public onboarding and privileged actions.
2. Keep the last known-good app release available.
3. Revert application configuration to the last verified production version; do not switch to development keys.
4. Preserve audit evidence and Clerk event IDs.
5. Revoke compromised sessions or rotate affected secrets.
6. Restore service only after issuer, DNS, keys, and authorization tests pass.

## 9. Current release decision

**Clerk Production: BLOCKED / NOT VERIFIED.**

The repository can be prepared for production, but production identity must not be claimed active until the MAELVYN application is bound to the correct Clerk workspace, production instance and domain are verified, and the end-to-end release checklist passes.


## 10. Connected Clerk workspace inspection — 2026-11-18

A read-only listing of the currently connected Clerk workspaces returned applications associated with other project names (including Oltavyn and Overlune in one workspace, and Rnnerhos.1 in another). No MAELVYN-named application was present in those returned lists.

The MAELVYN development deployment currently documents/uses the development issuer `https://organic-stinkbug-2628.clerk.accounts.dev`, but the corresponding Clerk application ID was not established from the connected workspace listing. This is an account-binding gap, not permission to use an unrelated app.

**Required:** identify the exact Clerk workspace/application that owns the MAELVYN development instance. If it is not accessible through the current connection, connect the correct workspace before creating or configuring Production. Do not create a duplicate application in an unconfirmed workspace.


## 11. Verified Clerk Production state — 2026-11-18 (supersedes sections 9–10)

A read-only audit through the MAELVYN-specific Clerk connection found the correct application:
- Application: `Maelvyn` (`app_3MGax1kdfbzSasqHwUlBO9E1DJ3`).
- Development instance: `ins_3MGawyTIeUoXm52k4cQHMQ5YCrB`.
- Production instance: `ins_3MGb1IDHmPZvgywrCn50QjHDaW4`.
- Production domain: `maelvyn.biz.id`.
- Frontend API: `https://clerk.maelvyn.biz.id`.
- Accounts portal: `https://accounts.maelvyn.biz.id`.
- Clerk reports domain verification `complete`; all five required CNAME records, SSL, and mail status report complete.
- Google OAuth is enabled and its production credentials are configured.
- Production user count at audit time: 0.

### Production configuration findings

The Production instance currently mirrors a development-oriented authentication posture:
- Sign-up mode: `public`.
- Google OAuth enabled.
- Email and password sign-in disabled.
- MFA is not enabled or required.
- CAPTCHA/bot protection reports disabled.
- User lockout is enabled (10 attempts / 60 minutes).
- Maximum session lifetime is enabled (7 days); inactivity timeout is disabled.
- Legal consent links are not configured in Clerk.

No Clerk configuration was changed during this audit. In particular, do not switch sign-up to restricted or enforce MFA until the owner bootstrap path and recovery access have been tested. Public sign-up is a security decision that must be aligned with MAELVYN's owner-only/member-invite policy before launch.

The Production publishable key is available from Clerk metadata. The Production secret key is not exposed by the connected read API and must never be copied into chat, repository files, or browser code. Add it directly as a Cloudflare secret through the authenticated Cloudflare dashboard or a secure secret-management path.

**Clerk status:** Production instance exists and its auth domain is verified. This does not mean the MAELVYN web application is already using it.


## 12. Production binding correction — 2026-11-18

The verified Clerk application and Production instance listed in §11 are correct. Earlier statements in §§1, 9 and 10 that no MAELVYN Production application was found are historical and superseded by §11 and `docs/FULL-REPOSITORY-AND-PRODUCTION-GAP-AUDIT.md`.

Important distinction: Clerk Production instance/domain exists, but the Cloudflare app remains attached to Clerk Development. Production identity is not yet wired into a dedicated MAELVYN production application environment.

Use the live application contract:
- Frontend publishable key: `CLERK_PUBLISHABLE_KEY` (served by `GET /api/v1/config`).
- Backend secret: `CLERK_SECRET_KEY` (Cloudflare secret-text only).
- Issuer: `CLERK_ISSUER=https://clerk.maelvyn.biz.id`.
- JWKS: `CLERK_JWKS_URL=https://clerk.maelvyn.biz.id/.well-known/jwks.json`.
- Authorized parties: explicit exact production application origins; do not use wildcard or empty allowlist.

Never put the Production secret key into GitHub, Genspark, prompts, ordinary Pages vars, browser configuration, logs or ChatGPT. Do not use a secret from another Clerk app. The Production instance currently has zero users as of the audit snapshot. The owner must personally sign in and complete the audited owner claim after secure bindings and recovery are verified.

The existing E2E script is Development-only and refuses live keys. A separate Production-safe smoke test must be created with safeguards and must not automate the owner claim.
