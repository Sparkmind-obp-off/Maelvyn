# MAELVYN — Brand Design System

**Version:** 1.0.0  
**Status:** Foundation approved; detailed visual assets and token implementation are pending.  
**Parent:** [Brand Strategy & Identity](BRAND-STRATEGY-AND-IDENTITY.md)

## 1. Design principles

- Modern, elegant, premium, clean, and simple.
- Human-centered, strategic, credible, and collaborative.
- Distinctive through precision and consistency rather than decoration.
- The brand website may persuade; the authenticated operating workspace must help users operate.
- Preserve independent venture identities and avoid visual ownership claims.

## 2. Color foundation

| Token | Value | Status | Intended use |
|---|---|---|---|
| `brand.primary` | `#00AFEC` | Approved | Brand accent, links, focus, selected states |
| `neutral.950` | `#020617` | Proposed mapping to current UI | Deep canvas |
| `neutral.900` | `#0F172A` | Proposed mapping to current UI | Panel/surface |
| `neutral.800` | `#1E293B` | Proposed mapping to current UI | Borders/elevated surface |
| `neutral.100` | `#F1F5F9` | Proposed mapping to current UI | Primary text on dark surfaces |
| `neutral.400` | `#94A3B8` | Proposed mapping to current UI | Muted text on dark surfaces |

The cyan brand color is not automatically suitable for small text on white. Validate all foreground/background combinations against WCAG 2.2 AA. Semantic success, warning, danger, and info colors must be separate from brand identity and must include text/icon cues.

## 3. Typography

Current implementation uses a system sans-serif stack. Keep that baseline until a specific font is selected, licensed, and hosted. Define:
- Display: restrained, strong hierarchy; avoid oversized marketing type in operational screens.
- Heading: clear levels with consistent weights.
- Body: readable line length and comfortable leading.
- Metadata: compact but not low-contrast or excessively small.
- Numeric: tabular figures for financial and metric tables where available.

Do not introduce a remote font dependency without evaluating privacy, performance, licensing, and offline behavior.

## 4. Layout and spacing

- Base spacing unit: 4px.
- Suggested scale: 4, 8, 12, 16, 24, 32, 48, 64px.
- Use consistent radii and restrained elevation.
- Establish readable max-widths for narrative pages and flexible widths for data-heavy workspace views.
- Keep primary actions visible and secondary actions grouped.
- On mobile, prioritize the current task and context; do not merely shrink desktop tables.

## 5. Components

Standardize the following families:
- Navigation: app header, workspace navigation, venture navigation, breadcrumbs.
- Actions: primary, secondary, quiet, destructive, loading, disabled.
- Data display: cards, tables, metric summaries, timelines, audit events.
- Inputs: text, number, date, select, checkbox, textarea, validation and helper text.
- Feedback: inline errors, success, warning, empty, loading, retry, permission denied.
- Governance: approval request, decision summary, conflict disclosure, irreversible-action confirmation.
- Finance: currency, actual/forecast/draft, liability, reserve, reconciled/unreconciled.
- Commerce: seller identity, offer status, order state, fulfillment, refund, dispute.

Each component must define anatomy, variants, keyboard behavior, responsive behavior, empty/error/loading states, and accessibility labels.

## 6. Motion and iconography

Use motion only to communicate state change, continuity, or feedback. Respect reduced-motion preferences. Use one coherent icon family and never rely on an icon without an accessible name where the control's purpose is not otherwise visible.

## 7. Accessibility

Baseline: WCAG 2.2 AA.
- Text contrast 4.5:1 for normal text and 3:1 for large text.
- Visible keyboard focus and logical focus order.
- Semantic landmarks and heading structure.
- Persistent labels and actionable validation messages.
- Touch target size at least WCAG minimum; aim for 44×44px.
- Reflow and text scaling without loss of function.
- Reduced motion and no color-only status communication.

A design specification is not proof of conformance. Test actual rendered states and assistive-technology behavior.

## 8. Governance

Tokens use semantic names, never raw color names in component contracts. Every token/component change is versioned. A venture may extend the system for its own identity but must not overwrite MAELVYN tokens. Do not copy another brand's protected logo or trade dress.

## 9. Implementation gap

The current `web/src/index.css` uses Tailwind utilities with slate/sky values and a system font stack. It does not yet implement a complete semantic token layer, a documented light theme, or a verified component accessibility matrix. The next UI pass should audit first, then migrate tokens in a bounded, testable change.
