# MAELVYN — Website, Acquisition & Provider Register

**Version:** 1.1.0
**Status:** APPROVED operating direction; repository implementation VERIFIED, external-builder implementation PARTIALLY VERIFIED
**Last reviewed:** 2026-11-24
**Parent authority:** `docs/MASTER-SYSTEM.md`, `docs/DOCUMENTATION-GOVERNANCE-AND-STATUS.md`  
**Related:** `docs/BRAND-STRATEGY-AND-IDENTITY.md`, `docs/BRAND-DESIGN-SYSTEM.md`, `docs/TOOLING-AND-INTEGRATION-STRATEGY.md`, `docs/CUSTOMER-JOURNEYS.md`, `docs/PRODUCTION-READINESS-CHECKLIST.md`

## 1. Purpose

This register connects MAELVYN's public website, commercial acquisition journey, provider/tooling decisions, and release evidence. It prevents a design reference, connected account, saved chatbot design, or proposed integration from being mistaken for a live production capability.

## 2. Canonical brand and design direction

- Brand: **MAELVYN — Venture Studio & Commerce Ecosystem**.
- Platform descriptor: **Agentic Shared Venture Studio OS**.
- Tagline: **Building Ventures. Creating Value. Growing Together.**
- Primary brand cyan: `#00AFEC`; core website navy: `#071B33`; white and restrained cyan accents.
- Typography: Manrope and Inter.
- Visual character: premium, modern, calm, confident, editorial, product-led, and human-centered.
- Layout principle: clear hierarchy, generous spacing, strong readable contrast, restrained motion, responsive cards, and obvious next actions.
- MAELVYN must not imply that independently operated ventures are owned, merged, funded, or guaranteed by MAELVYN unless that relationship is explicitly established and evidenced.

## 3. Design reference direction

BestSaaSWebDesigns is a read-only inspiration catalog, not a source of MAELVYN assets or an implementation provider. References are used for patterns only; do not copy their identity, copywriting, or proprietary assets.

| Reference | Useful pattern to study | MAELVYN application |
|---|---|---|
| [Hex](https://hex.tech/) | Clear product narrative and sophisticated information hierarchy | Explain the ecosystem and how work moves from idea to execution |
| [OpenUnit](https://www.openunit.com/) | Focused service/product storytelling | Keep each capability understandable and outcome-oriented |
| [Slash](https://www.slash.com/) | Premium dark visual system and restrained CTA treatment | Refine navy/cyan contrast, trust, and conversion hierarchy |
| [Retool](https://retool.com/) | Complex platform explained through tangible use cases | Present capabilities without overwhelming visitors |
| [Sanity](https://sanity.io/) | Platform positioning and modular capability storytelling | Explain the shared operating system and provider-neutral approach |
| [OpenHands](https://www.openhands.dev/) | Technical credibility and concise feature structure | Communicate agentic capabilities with clear boundaries |
| [Different](https://www.different.ai/) | Demand-generation narrative and campaign structure | Connect the website to an actionable acquisition journey |
| [Docker](https://www.docker.com/) | Trust, ecosystem breadth, and technical clarity | Explain interoperability and operating boundaries |
| [Webclaw](https://webclaw.io/) | Technical product explanation and feature grouping | Explain integrations as capabilities, not logos or unverified claims |

Reference pages and screenshots should be rechecked before a new design decision. The catalog's metadata does not prove current live design details.

## 4. Website information architecture and acquisition journey

The earlier UiChemy audit described eight pages and 37 sections. Treat that as an intended journey only; the project could not be attached to the current identity, so every route and action still requires verification through a supported authenticated path before release.

1. **Home — Understand:** communicate what MAELVYN is, who it serves, the outcomes it supports, and the next action.
2. **About — Trust:** explain purpose, principles, human-centered approach, governance, and independent venture boundaries.
3. **Ventures — Explore:** show independently identified ventures and their own destinations. Do not imply ownership or financial backing without evidence.
4. **Solutions — Match:** translate capabilities into concrete problems, use cases, and engagement paths.
5. **How We Work — De-risk:** explain discovery, scoping, validation, execution, review, and handover. Avoid guaranteed outcomes.
6. **Partnerships — Collaborate:** qualify creators, builders, service providers, distribution partners, and organizations.
7. **Contact — Convert:** capture a concise request, intent, contact route, and consent. Avoid asking for unnecessary sensitive information.
8. **Supporting page(s):** retain the existing eighth page and verify its role, navigation, metadata, and conversion purpose before launch.

### Funnel

**Awareness → Understanding → Trust → Intent → Qualification → Conversation → Follow-up → Outcome**

- Awareness: useful content, referrals, search, partner distribution, and social channels.
- Understanding: homepage narrative, solutions, venture examples, and clear explanations.
- Trust: transparent operating model, accurate capability status, privacy/legal pages, and evidence-backed examples.
- Intent: primary CTA matched to the visitor's intent (build, grow, collaborate, or ask a question).
- Qualification: collect only the minimum information needed to route the request.
- Conversation: one primary concierge/chat path, plus a clear direct contact fallback.
- Follow-up: record consent, source, request category, owner, next action, and status in an approved system.
- Outcome: report qualified conversations and completed engagements; do not treat impressions or clicks as revenue.

### CTA and measurement rules

- Use one primary CTA per major section and a clear secondary action only where it helps.
- Each CTA must lead to a working destination; no dead links, fake buttons, or placeholder forms.
- Use distinct intent categories for Build, Grow, Collaborate, and General inquiry.
- Measure, where technically and legally supported: source/medium, landing page, CTA clicks, form starts, valid submissions, qualified inquiries, response time, meetings, proposals, and accepted work.
- Do not add analytics trackers or external pixels until privacy, consent, retention, and provider terms are reviewed.
- Do not publish fabricated metrics, testimonials, customer logos, case studies, or conversion claims.

## 5. Current website implementation snapshot (2026-11-24)

| Area | Observed status | Limitation / next gate |
|---|---|---|
| Repository app | Existing React/Vite/Hono venture studio workspace is the implementation source; the public landing route was updated locally with the approved narrative and brand direction | Local checks and browser QA must pass before any release; no deployment was performed |
| UiChemy project | Project ID `6b05dffa73c998b4e11b5507` supplied; attach/edit path unavailable to the current project identity | Do not claim the earlier page/section findings as verified in this repository; do not duplicate |
| Design system | Semantic tokens, buttons, cards, spacing, header, public narrative and focus states updated in source | Visual browser review still required |
| Responsive checks | Static checks ran at 390px, 768px, and 1440px; no text/fixed-width overflow reported | This is not a complete browser/device QA |
| Accessibility | Repository baseline found inconsistent focus treatment and low-emphasis text utilities; shared form/table semantics were improved locally | Re-run contrast and assistive-technology checks before publication |
| Template content | No UiChemy template content was modified or claimed verified; repository landing copy now avoids template claims | Replace/verify external-builder content only through its supported authenticated path |
| Custom embed | No supported UiChemy custom-code/embed capability had been identified in the inspected tool set | Chat widget installation path remains unresolved |
| Domain | Intended domain: `maelvyn.biz.id` | DNS/domain changes not authorized by this register |
| Publication | Not published by the documented workflow | No claim that the public site is live |

## 6. Provider and tool register

Status labels are scoped to the MAELVYN website/workflow. A connected account or saved configuration does not equal production integration.

| Provider / tool | Intended role | Current evidence/status | Next action / control |
|---|---|---|---|
| GitHub — [Maelvyn repository](https://github.com/Sparkmind-obp-off/Maelvyn) | Canonical decisions, specs, code, evidence, work log | Repository exists; default branch `main`; local baseline was `077454d` before this task; connector verification later reported an invalid token | Keep canonical decisions and dated evidence here; re-authenticate before pushing the reviewed commit |
| UiChemy | Existing external website-builder source | Project discovered but unavailable to current attach identity; no edit or sync verified | Continue only through a supported authenticated path; do not duplicate the site |
| BestSaaSWebDesigns | Design research and reference catalog | Read-only catalog queried; reference candidates recorded above | Use as inspiration only; cite reference URLs and document design decisions |
| Flows | Primary website concierge/chat candidate | Instance and design saved; install check previously reported chat code absent from homepage | Obtain supported embed route; test end-to-end before claiming installed |
| Flint | Alternative website builder | Account check found no existing MAELVYN site | Do not create a duplicate; hold unless a distinct use case is approved |
| Floot | Full-stack app builder | Account check found no MAELVYN project | Hold; only consider for a distinct backend/app with export, cost, and ownership review |
| Framer | Design/prototype reference | Existing project link recorded in prior work | Reference only unless explicitly selected as a separate deliverable |
| Brilliant Design | Visual prototype/reference | Existing playground link recorded in prior work | Reference only; not the production website |
| Webflow | Alternative website platform | Connected account checked; no MAELVYN site found in prior check | Hold; no migration or duplicate |
| Asyntai | Alternative chatbot | Previously evaluated; not installed; chatbot activation is not authorized in this task | Avoid parallel chatbots; keep it out of the current release |
| MAELVYN Connect REST/MCP | Private registry and proposal integration layer | Implemented locally in source; REST routes and tests are present; local MCP bridge is read-only by default and not connected to ChatGPT or any live external assistant | Configure and test only through an approved authenticated origin; no external connection claim |
| External LLM/API providers | Chatbot/agent intelligence | No production key or paid usage authorized in this workflow | Do not activate paid keys, usage, subscriptions, or credits without explicit approval |

### Integration evidence contract

For every additional provider, record:

- Exact provider, product, capability, and account/workspace scope.
- Purpose and the MAELVYN workflow it serves.
- Status: DISCOVERED, EVALUATING, CONNECTED, CONFIGURED, TESTED, VERIFIED LIVE, BLOCKED, or DEPRECATED.
- Evidence date, environment, and verification method.
- Data sent/received, privacy classification, and retention.
- Authentication method (never record secret values).
- Free-tier/trial/paid status, quotas, credit expiry, per-run cost, and hard spending limit.
- Commercial-use rights, exportability, lock-in, fallback, and failure behavior.
- Human approval boundary and disable/exit procedure.

A plugin appearing in ChatGPT, a marketplace, or a research result is **DISCOVERED**, not CONNECTED. A connector connection is not **VERIFIED LIVE** until the MAELVYN application successfully completes a tested workflow in its target environment.

## 7. Release gates

Do not publish the website or connect the custom domain until:

- [ ] Brand, navigation, page purpose, and CTA destinations are reviewed in the rendered site.
- [ ] Contrast findings are resolved and checked again.
- [ ] Every meaningful image has accurate alt text; decorative images are correctly treated as decorative.
- [ ] Template placeholders and irrelevant template-specific content are removed.
- [ ] Contact form submits successfully, validates input, protects against spam, and has a privacy notice/consent appropriate to its data.
- [ ] Chat is either installed and tested end-to-end or clearly omitted with a working contact fallback.
- [ ] Mobile, tablet, and desktop browser QA is completed.
- [ ] Privacy policy, terms, cookie/analytics behavior, and contact disclosures are reviewed and no longer marked draft where required.
- [ ] Domain, DNS, deployment target, and rollback plan are explicitly approved.
- [ ] Final release evidence, commit SHA, environment, and smoke-test results are recorded in GitHub.

## 8. Change and work-log rule

Every meaningful MAELVYN task must leave a durable record in this repository:

1. Issue/brief or dated work-log entry with goal and acceptance criteria.
2. Provider/tool used and why it was selected.
3. Files, pages, settings, or external resources changed.
4. What was actually tested and the result.
5. Remaining blockers, costs, risks, and approvals needed.
6. Commit SHA and next action.

For work performed in external builders, record the external project identifier, page/section names, saved state, and verification evidence. Never claim that a builder change is synchronized to GitHub unless the actual export/sync has been verified.

For independent ventures, preserve their own repositories and ownership boundaries. MAELVYN may maintain a portfolio index of public project links and status summaries, but must not silently become the source of truth for another venture's code, secrets, customer data, or legal records.

## 9. Explicit non-authorizations

This document does not authorize paid plans, credit use, API keys, subscriptions, external data transfers, public deployment, domain/DNS changes, chatbot activation, analytics tracking, or changes to independent venture ownership. Obtain explicit approval for each consequential action.
