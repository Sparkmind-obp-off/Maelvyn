# MAELVYN upgrade plan

## Implementation

Reuse the existing React 19/Vite/Tailwind frontend and Hono/Cloudflare API. The frontend work keeps the current router and authenticated workspace routes while introducing semantic MAELVYN tokens in `web/src/index.css`, a responsive accessible shell in `web/src/App.tsx`, a truthful narrative landing page in `web/src/pages/Landing.tsx`, and stronger shared form/table feedback in `web/src/components/kit.tsx` and `web/src/components/ui.tsx`.

MAELVYN Connect is additive. The existing Clerk authentication middleware and authorization policy remain the trust boundary. `server/connect/routes.ts` exposes scoped registry projections and records only human-reviewable status proposals. `migrations/0010_connect.sql` stores append-only proposals. `connect/mcp-server.mjs` is a local stdio adapter with environment-only credentials and an explicit write gate. No provider execution, automatic task mutation, public endpoint, payment capability, or external data transfer is added.

## Project structure

- `web/src/App.tsx`: app shell, public navigation, workspace and venture subnavigation, route protection.
- `web/src/pages/Landing.tsx`: public brand narrative and truthful CTAs.
- `web/src/index.css`: palette, typography, focus, motion, responsive primitives.
- `web/src/components/kit.tsx`, `web/src/components/ui.tsx`: shared form, table, error, loading, and status primitives.
- `server/connect/routes.ts`: authenticated Connect manifest, registry, proposals, and audit integration.
- `migrations/0010_connect.sql`: Connect proposal persistence and no-delete safeguard.
- `connect/mcp-server.mjs`: local MCP bridge; no committed credentials.
- `tests/connect.test.ts`: focused authorization, projection, and audit tests.
- `docs/MAELVYN-CONNECT.md` and dated audit/work-log files: contract and evidence.

## Design

**Movement:** restrained Swiss editorial product system (0.06); **dark technical dashboard** (0.05); **bright commerce editorial** (0.04). Chosen movement: restrained Swiss editorial product system.

Core principles are precise hierarchy, quiet confidence, generous whitespace, and explicit boundaries. Navy provides a calm operating canvas, while cyan is reserved for action and evidence. Manrope carries display hierarchy; Inter carries dense interface copy. Signature elements are a cyan rule, compact index labels, and layered cards with restrained borders. Motion is short and functional, with `prefers-reduced-motion` removing nonessential transitions. The brand voice is direct and evidence-aware: “Building Ventures. Creating Value. Growing Together.” and “Work moves forward when the next decision is clear.”

MAELVYN is a venture studio and commerce ecosystem for coordinated venture work that preserves independent ownership, IP, data, and operating boundaries. It is precise, calm, and accountable. The wordmark remains text-led with the existing favicon mark rather than introducing an unverified new logo asset. Signature color: `#00AFEC`.
