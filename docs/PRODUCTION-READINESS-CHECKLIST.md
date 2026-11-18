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
