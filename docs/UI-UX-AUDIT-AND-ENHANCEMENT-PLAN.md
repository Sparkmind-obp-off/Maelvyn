# MAELVYN — UI/UX Audit & Enhancement Plan

**Version:** 1.0.0  
**Date:** 2026-11-24  
**Status:** Static source review; full browser, keyboard, screen-reader, and performance audit not yet completed.

## 1. Scope

Review the existing React/Vite application as an authenticated operating workspace. Its primary job is to help authorized users manage ventures, governance, finance, rights, operations, research, and evidence. It is not a generic SaaS dashboard or marketing landing page.

## 2. Evidence inspected

- `web/src/App.tsx`
- `web/src/index.css`
- `web/src/components/kit.tsx`
- `web/src/components/ui.tsx`
- `web/src/pages/*`
- `docs/UX-UI-SYSTEM.md`
- `docs/BRAND-DESIGN-SYSTEM.md`

This is a bounded static review. No browser screenshots, live assistive-technology session, contrast measurement, or performance profile was captured in this pass.

## 3. Verified observations

### Strengths
- React app has distinct workspace and venture routes.
- Navigation uses semantic `nav` elements with labels.
- Shared form/table primitives reduce UI duplication.
- Forms associate visible labels with inputs in the shared kit.
- Errors are rendered inline rather than relying exclusively on blocking alerts.
- Tables provide an overflow container and optional accessible caption.
- Environment banner warns against placing real participant/financial/secrets data in non-production environments.
- Product navigation and venture modules reflect the actual governance/finance/rights/operations domain.

### Enhancement targets
- `web/src/index.css` relies on Tailwind slate/sky utility colors; a complete semantic design-token layer is not yet evident.
- Focus treatment is not fully standardized across buttons, navigation, and custom controls.
- Generic table horizontal overflow is not equivalent to a mobile-optimized information hierarchy.
- Dense workspace navigation should be checked at narrow widths, 200% zoom, and with long translated labels.
- Generic form primitives need consistent required-field semantics, field-level error association, disabled/loading feedback, and async announcements.
- Dark-mode behavior is the current implementation; a light theme is not documented as shipped.
- Visual hierarchy and page-level consistency require screenshot review across major routes and states.

## 4. Severity framework

| Priority | Definition |
|---|---|
| P0 | User cannot complete a critical task or a security boundary is visually misleading |
| P1 | WCAG AA failure, major responsive failure, or material task friction |
| P2 | Inconsistent pattern or moderate usability/performance issue |
| P3 | Cosmetic refinement without meaningful task impact |

No final score is assigned in this static pass. A score requires the full technical audit and verified measurements.

## 5. Recommended work sequence

1. **P1 — Semantic tokens:** define and implement brand, neutral, text, border, focus, and status tokens; preserve the current visual identity.
2. **P1 — Keyboard and focus:** test every route and interactive control; standardize visible focus and focus restoration.
3. **P1 — Responsive information design:** test workspace/venture navigation, tables, approval screens, and finance views at mobile/tablet/desktop and 200% zoom.
4. **P1 — Forms and feedback:** field-level error mapping, required-state semantics, live status announcements, and retry-safe busy states.
5. **P2 — Page consistency:** shared page header, context/breadcrumb pattern, primary action placement, empty states, and permission-denied states.
6. **P2 — Theme completeness:** only add light theme after contrast and component parity are specified.
7. **P3 — Motion and polish:** restrained transitions, reduced-motion alternatives, and consistent micro-interactions.

## 6. Acceptance checks

- All tasks are keyboard reachable and have visible focus.
- No focus trap or hidden focus on route changes.
- Text and controls meet WCAG 2.2 AA contrast.
- 200% text scaling and narrow viewport reflow preserve content and task completion.
- Screen-reader labels, table captions, error associations, and async status announcements are verified.
- No horizontal page overflow at supported viewport sizes.
- Motion respects reduced-motion preference.
- Financial, legal, rights, approval, and production actions are clear and deliberate.
- Visual review covers desktop and mobile in a single bounded pass, followed by one correction/confirmation pass.

## 7. Change boundary

This audit plan does not authorize a redesign or frontend code changes. Use `docs/UX-UI-SYSTEM.md` and `docs/BRAND-DESIGN-SYSTEM.md` as the design authority. Record findings before implementing fixes; do not claim WCAG conformance until rendered testing is complete.
