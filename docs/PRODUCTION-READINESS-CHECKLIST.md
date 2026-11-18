# MAELVYN — Production Readiness & Release Gates

**Version:** 1.0.0  
**Status:** Operational checklist; gates must be evidenced  
**Applies to:** MAELVYN web app, Worker API, D1, R2, Clerk, custom domains, and commerce modules

## 1. Release states

- **DRAFT:** design or code is being prepared.
- **DEV-VERIFIED:** development deployment and tests pass with synthetic data.
- **STAGING-VERIFIED:** production-like resources are isolated and smoke-tested.
- **PRODUCTION-READY:** all gates below have evidence and named owners.
- **PRODUCTION-LIVE:** deployment is live and post-deploy checks pass.

A successful GitHub commit or build is not equivalent to production deployment.

## 2. Gate A — Product and governance

- [ ] Canonical system and architecture versions agree.
- [ ] Venture, legal seller, ownership, and IP boundaries are explicit.
- [ ] No unapproved participant, shareholding, pooled funds, or investment representation.
- [ ] User-facing terms, privacy notice, refund, support, and seller disclosures are reviewed.
- [ ] Admin and reserved decisions require explicit authorization.

## 3. Gate B — Identity and authorization

- [ ] Correct MAELVYN Clerk application and production instance verified.
- [ ] Development and production keys/issuers are separated.
- [ ] JWT signature, issuer, expiry, authorized party/origin are validated server-side.
- [ ] Signup creates identity only; no implicit workspace or venture membership.
- [ ] Owner bootstrap is verified, single-use, and audited.
- [ ] Invitations, role changes, session revocation, and offboarding tested.
- [ ] Cross-workspace and cross-venture IDOR tests pass.
- [ ] No production secret appears in client assets or logs.

## 4. Gate C — Infrastructure and domain

- [ ] Production Cloudflare project and account confirmed.
- [ ] Production Pages/Worker routes and custom domains verified.
- [ ] Production D1 is distinct from development D1.
- [ ] Production R2 storage is private and distinct from development.
- [ ] Queue/Workflow bindings and retries tested if enabled.
- [ ] DNS ownership, records, TLS, redirects, and security headers verified.
- [ ] Preview deployments cannot read production data or secrets.
- [ ] Backup/export and isolated restore tested.
- [ ] Rollback owner and steps documented.

## 5. Gate D — Application quality

- [ ] Clean dependency install and lockfile committed.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Unit/integration tests pass.
- [ ] Production build passes.
- [ ] Browser E2E passes on the target domain.
- [ ] Accessibility and responsive checks completed.
- [ ] Error reporting, health/readiness, and monitoring verified.
- [ ] Rate limits, body limits, CORS, CSP, and security headers reviewed.

## 6. Gate E — Data and financial integrity

- [ ] Production migrations reviewed and backed up.
- [ ] No synthetic test users or balances in production.
- [ ] Monetary values use integer minor units and explicit currency.
- [ ] Posted journals are immutable; corrections use reversals.
- [ ] Payment webhook signatures and idempotency tested.
- [ ] Provider settlement reconciles to source records.
- [ ] Refund, cancellation, dispute, and duplicate-event paths tested.
- [ ] No autonomous transfer or payout capability is enabled.

## 7. Gate F — Commerce launch

- [ ] Legal seller identified for every public offer.
- [ ] Product ownership/license and commercial-use rights recorded.
- [ ] Offer price, currency, taxes, terms, and fulfillment promise are accurate.
- [ ] Customer data collection has purpose and access controls.
- [ ] Order snapshots preserve seller and product terms at purchase time.
- [ ] Delivery completion is verifiable.
- [ ] Support and complaint channel is staffed.
- [ ] Marketplace listings do not imply MAELVYN owns or fulfills third-party products.

## 8. Gate G — Operations

- [ ] Incident response contact and escalation path exist.
- [ ] Credential rotation and session revocation runbook tested.
- [ ] Backup retention and restore objective documented.
- [ ] Provider outage/fallback behavior tested.
- [ ] Cost ceilings and alerts configured.
- [ ] Audit logs are append-only and searchable by request/correlation ID.
- [ ] Data export, correction, retention, and deletion workflows reviewed.

## 9. Release record

For every release, record:
- Release ID.
- Git commit SHA.
- Environment and deployment URL.
- Build/test results.
- Migration version.
- Non-secret configuration version.
- Identity provider instance identifier.
- Domain and TLS verification evidence.
- Backup reference.
- Approver and operator.
- Smoke-test results.
- Rollback plan and status.

## 10. Launch decision

The release owner must mark each gate PASS, FAIL, or NOT APPLICABLE with evidence. Any failed critical security, identity, legal, financial, data-isolation, or recovery gate blocks public production launch.

**No production claim without production evidence.**


## 11. Observed MAELVYN state — 2026-11-18

| Item | Observed state | Release implication |
|---|---|---|
| Cloudflare zone | `maelvyn.biz.id` is active | Domain zone exists; not sufficient for app production |
| Pages project | `maelvyn-dev` | Development project |
| Custom domains | Root and www are attached to `maelvyn-dev` | Must be cut over to a dedicated production project before public launch |
| Pages environment | Deployment target named production | Platform target label only |
| Application environment | `APP_ENV=development` | Development-configured |
| Clerk | Development issuer and test publishable key | Not production identity |
| Database | `maelvyn-dev-db` | Must not be used for production |
| Production D1/R2 | Not verified for MAELVYN | Blocked |
| MAELVYN Clerk Production app | Not identified in connected Clerk workspaces | Blocked |

**Current release decision: NOT PRODUCTION-READY.** The domain is active and attached, but it currently points to a development-configured Pages project. Treat the custom domain as a development exposure until a separate production environment is provisioned and verified.

## 12. Immediate P0 remediation

- [ ] Decide whether to temporarily restrict or detach root/www from `maelvyn-dev` while the production project is prepared.
- [ ] Identify the MAELVYN Clerk application in the correct Clerk workspace; do not reuse Oltavyn, Overlune, or another project's app.
- [ ] Provision separate production D1 and private R2 resources.
- [ ] Build and deploy the dedicated production project to a staging hostname.
- [ ] Complete Clerk Production and domain verification.
- [ ] Run end-to-end authentication, authorization, data-isolation, migration, backup, and rollback tests.
- [ ] Cut over root/www only after all critical gates pass.


## 13. Corrected live audit — 2026-11-18

The MAELVYN Clerk Production instance is present and its custom domain is verified. This supersedes the earlier checklist statement that the MAELVYN Clerk application could not be identified.

| Control | Verified result | Status |
|---|---|---|
| Clerk application | Maelvyn | <badge>Found</badge> |
| Clerk Production instance | Exists | <badge>Found</badge> |
| Clerk auth domain | `clerk.maelvyn.biz.id` | <badge color="success">Verified</badge> |
| Accounts portal | `accounts.maelvyn.biz.id` | <badge color="success">Verified</badge> |
| DNS / SSL / mail | Clerk reports complete | <badge color="success">Verified</badge> |
| Google OAuth production credentials | Configured | <badge color="success">Configured</badge> |
| Production users | 0 | <badge color="warning">Owner bootstrap pending</badge> |
| Production Pages project | Not provisioned/verified | <badge color="warning">Blocked</badge> |
| Current Pages root/www binding | Attached to `maelvyn-dev` with development auth settings | <badge color="danger">P0</badge> |
| Production D1 | Not provisioned | <badge color="warning">Blocked</badge> |
| MAELVYN-specific R2 | Not found in account bucket listing | <badge color="warning">Blocked if required</badge> |
| Clerk Production secret bound to production Worker | Not verified; API redacts secret values | <badge color="warning">Blocked</badge> |

**Release decision: NOT READY FOR PUBLIC PRODUCTION.** Clerk Production itself exists and its auth domain is verified, but the deployed MAELVYN web application still uses Development settings and the development D1 binding.

### Security review items
- Production sign-up mode is public; review against owner-only bootstrap and invitation policy.
- Google OAuth is enabled; email and password authentication are disabled.
- MFA is not enabled or required.
- CAPTCHA/bot protection reports disabled.
- Lockout is enabled (10 failed attempts / 60 minutes).
- Maximum session lifetime is 7 days; inactivity timeout is disabled.
- Terms/privacy URLs are not configured in Clerk.
- Do not alter these settings until owner bootstrap/recovery is tested and a change is approved.

### P0 execution plan
- [ ] Create dedicated production Pages/Worker project, production D1, and MAELVYN-specific private R2 if needed.
- [ ] Bind Clerk Production publishable key and issuer/JWKS to staging; securely set the Production secret key directly in Cloudflare.
- [ ] Verify Google OAuth redirect/callback URL and owner bootstrap.
- [ ] Confirm owner-only access and invitation authorization before changing sign-up mode.
- [ ] Test MFA and bot protection configuration, session policy, authorization boundaries, audit trail, and recovery.
- [ ] Move root/www domains only after staging acceptance and rollback plan.
