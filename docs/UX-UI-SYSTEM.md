# MAELVYN — UI/UX & Design System

**Version:** 1.0  
**Status:** Proposed design specification

## Brand direction
MAELVYN — Shared Venture Studio. Calm, confident, precise, collaborative, premium but restrained. Use readable typography, generous spacing, neutral surfaces, clear status semantics, and strong data hierarchy. Avoid gamified finance, speculative valuation charts, public leaderboards, and exaggerated wealth language.

## Application shell
Desktop: left navigation rail, workspace switcher, top bar with context/search/notifications/profile, main content with title and primary action, optional contextual panel.  
Mobile: compact header and bottom/slide-out navigation; tables become labeled stacked rows or scrollable tables; sensitive actions remain deliberate.

## Home dashboard
- Portfolio snapshot by lifecycle, not speculative valuation.
- My work and assigned responsibilities.
- Decisions waiting for me, with deadline and consequence.
- Recent activity and actionable risk alerts.
- Quick actions: add opportunity, update venture, submit expense, request approval.
Only show aggregate money totals to authorized viewers with explicit accounting definitions.

## Core page patterns
**Opportunity board:** Draft, Researching, Validating, Selected, Parked, Rejected. Cards show problem, customer, evidence confidence, owner, next test, updated date. AI score never decides alone.

**Venture workspace:** Overview, Charter, Milestones, Team & Roles, Contributions & Rights, Finance, Assets, Documents, Risks, Activity. Header shows lifecycle, accountable operator, permitted budget, next review, risk.

**Approval inbox:** requester, decision, amount/scope, venture, deadline, conflicts, evidence completeness, consequences. High-impact approvals require detail review and reason; avoid one-click approval for debt, ownership, contract, or distribution.

**Finance:** separate cash received, expenses, liabilities, reserves, and distributable surplus. Label actual/forecast/draft, show currency and period, drill down to evidence.

**People & agreements:** separate access role from legal relationship and ownership. A role badge never implies equity.

**Asset register:** description, rights basis, custodian, venture use, condition, utilization, maintenance, evidence. Possession is not proof of ownership.

## Design tokens
Use semantic tokens for canvas/surface, primary/secondary/muted text, borders/focus, neutral/info/success/warning/danger status, primary/secondary/destructive actions. Spacing base 4px (4, 8, 12, 16, 24, 32, 48, 64). Use consistent small/medium/large radii and legible UI sans typography. Status always includes text or icon; never color alone.

## Forms and interaction
Group related fields; explain sensitive fields; show required/optional; validate server-side; preserve values after recoverable errors; explain scope and expiry; autosave drafts with visible state; require explicit confirmation for irreversible actions. Never let hidden automation set ownership, payment amounts, or approvals.

## Accessibility and responsiveness
Target WCAG 2.2 AA: keyboard navigation, visible focus, semantic labels/headings, sufficient contrast, non-color status cues, screen-reader announcements, reduced motion, narrow-screen support, accessible tables.

## Content style
Default interface language: plain Indonesian. Explain legal/financial terms. Prefer “Perlu persetujuan”, “Usulan kontribusi”, “Dana diterima”, “Perkiraan”, “Tercatat”, and “Hak kepemilikan (berdasarkan perjanjian)” over ambiguous English labels.

## Empty/error/loading states
Every module needs clear empty, loading, permission-denied, conflict, retry, and partial-failure states. Do not leak restricted record existence.

## UX acceptance checklist
New invitee understands and can decline; opportunity draft cannot create venture; contributor distinguishes role/contribution/compensation/ownership; approver sees impact; finance distinguishes cash/profit/liability/reserve/forecast; access denial does not leak data; every high-impact action is confirmed and audited.

## Commerce UI extension

Add the following role-aware surfaces when the commerce MVP is implemented:
- Marketplace discovery and category navigation.
- Venture storefront and product detail.
- Seller/venture product catalogue.
- Order and fulfillment workspace.
- Payment/reconciliation status.
- Customer support and refund queue.
- Partner attribution and commission view.
- Commerce analytics by venture and channel.

Always display the responsible seller, currency, offer terms, fulfillment expectation, and support route before checkout. Distinguish pending payment, paid, fulfilled, refunded, disputed, and cancelled states. Do not expose another venture's customer, order, financial, or partner data in shared dashboards.


---

## Brand-aligned design system upgrade — 2026-11-24

### Design intent

The MAELVYN product UI is an **Operate** surface: users must understand portfolio state, make governed decisions, and complete operational tasks. Preserve the existing restrained dark interface as the current implementation baseline; do not replace it with a marketing-site aesthetic.

### Brand alignment

- Brand: MAELVYN.
- Positioning: Venture Studio & Commerce Ecosystem.
- Tagline: Building Ventures. Creating Value. Growing Together.
- Primary brand color: `#00AFEC`.
- Product descriptor: Agentic Shared Venture Studio OS.
- Brand expression: modern, premium, clean, precise, human-centered, collaborative.
- The public-facing website may use a more expressive presentation, while authenticated workspaces prioritize clarity, trust, data density, and accessibility.

### Token governance

Use semantic tokens rather than raw color values in new UI work. The current implementation uses Tailwind slate surfaces and sky accents in `web/src/index.css`; this is the incumbent visual evidence, not a fully governed token system.

| Token | Intent | Current / proposed use |
|---|---|---|
| `color.brand.primary` | MAELVYN identity | `#00AFEC`; accents, links, focus, selected states |
| `color.surface.canvas` | App background | Existing deep slate baseline |
| `color.surface.panel` | Cards and panels | Existing slate panel baseline |
| `color.text.primary` | Main content | High-contrast neutral |
| `color.text.muted` | Supporting content | Muted neutral; retain readable contrast |
| `color.border.default` | Structure | Neutral border |
| `color.status.success/warning/danger/info` | State semantics | Never communicate state by color alone |

The semantic token names are approved; a complete light/dark numeric palette remains a design-system task. Do not use the bright brand cyan as small body text on a white surface unless measured contrast passes.

### Typography and layout

- Retain the current system sans-serif stack until a licensed, self-hosted font is explicitly selected.
- Use a consistent type scale and semantic heading order.
- Keep 4px spacing rhythm and responsive content widths.
- Prefer clear page titles, contextual descriptions, one primary action, and secondary actions grouped by task.
- Tables must have captions/labels, readable overflow behavior, and a useful mobile alternative.
- Keep financial data labeled by currency, period, and actual/forecast/draft state.

### Interaction and accessibility requirements

- Every form control has a persistent visible label and programmatic association.
- Errors identify the affected field and explain recovery; success and async states are announced to assistive technology.
- Keyboard focus is visible and never obscured.
- Touch targets aim for 44×44 CSS px; WCAG 2.2 AA minimums remain the baseline.
- Respect `prefers-reduced-motion`; motion must not be required to understand a state.
- Do not rely on color alone for roles, risk, finance, approval, or lifecycle status.
- Destructive, financial, ownership, legal, and production actions require explicit review and confirmation.

### Current code-level observations

The checked-in UI uses dark slate surfaces, sky accents, shared form/table components, and responsive Tailwind utility classes. The CSS currently contains component-level hard-coded colors rather than a complete semantic token layer. The generic table provides horizontal overflow but does not by itself prove an accessible mobile table experience. These are enhancement targets, not claims that a full browser/assistive-technology audit has passed.

See [BRAND-DESIGN-SYSTEM.md](BRAND-DESIGN-SYSTEM.md) for the identity token baseline and [DOCUMENTATION-GOVERNANCE-AND-STATUS.md](DOCUMENTATION-GOVERNANCE-AND-STATUS.md) for the documentation source-of-truth rules.
