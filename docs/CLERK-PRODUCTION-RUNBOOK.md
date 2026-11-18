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
