# MAELVYN UI/UX Audit — 2026-11-24

## Scope and source-of-truth decision

This audit covers the existing MAELVYN repository at `https://github.com/Sparkmind-obp-off/Maelvyn`, branch `main`, and the rendered canonical origin `https://maelvyn.biz.id/`. The supplied UiChemy project ID `6b05dffa73c998b4e11b5507` could not be attached to the current Webdev project identity, so it was not edited and no duplicate site was created.

The repository is the authenticated venture studio operating workspace. It is not the eight-page/37-section marketing-site source described in the earlier UiChemy register. The earlier UiChemy page count, missing image alt fields, contact-form template copy, and its nine contrast findings therefore cannot be claimed as verified in this repository. They remain external builder follow-ups until the project can be opened through a supported authenticated edit path.

## Baseline evidence

The repository was clean at `077454d166c5f1125bcd190cea0c1f28dcbb505e`. `npm run typecheck`, `npm run lint`, `npm run test` (94 tests across 9 files), and `npm run build` passed before the UI changes. Browser checks on the canonical origin at 1440×900, 768×1024, and 390×844 found no horizontal overflow and one decorative favicon with an empty alt attribute. Authenticated workspace pages were not exercised without a login session.

The current landing page used system sans fonts, raw Tailwind slate/sky utilities, a dense dark dashboard treatment, no public section navigation, and no semantic MAELVYN brand token layer. Low-emphasis `text-slate-500` copy was present in shared primitives and could fall below the intended contrast target depending on the background. Focus treatment was inconsistent, and the shared form primitive lacked a consistent async status region and explicit field help associations.

## Implemented direction

The existing app shell remains intact. The UI update adds the approved MAELVYN positioning, tagline, cyan `#00AFEC`, navy `#071B33`, white text, Manrope/Inter-compatible local font stacks, editorial Swiss-style spacing, stronger focus rings, a skip link, responsive horizontal subnavigation, clearer public information architecture, and restrained motion with a reduced-motion fallback. The landing page now explains the operating model, working loop, venture boundaries, and Connect capability without fabricated metrics, testimonials, logos, customer claims, investment language, or guaranteed outcomes.

Shared forms now expose persistent labels, help associations, required semantics, live completion status, and busy button text. Shared tables use scoped column headers and retain bounded horizontal overflow within their own container. The header and navigation are keyboard-friendly and the public CTA destinations remain real repository/workspace routes.

## Validation boundary

Rendered browser checks are repeated locally after implementation using Chromium at desktop, tablet, and mobile breakpoints. They validate DOM content, absence of horizontal page overflow, public navigation destinations, image alt state, and visible focus behavior. They do not establish WCAG conformance or replace screen-reader testing. UiChemy-specific visual findings remain unverified until its project is available through a supported authenticated path.
