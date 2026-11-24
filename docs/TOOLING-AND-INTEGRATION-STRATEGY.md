# MAELVYN — Tooling & Integration Strategy

**Version:** 1.0.0  
**Date:** 2026-11-24  
**Status:** Evaluation framework; no new integrations or paid use authorized.

## 1. Policy

MAELVYN remains provider-neutral at the integration boundary. A tool is not integrated merely because it appears in a planning conversation, plugin directory, or this document. Before connection, verify its current capabilities, data handling, auth, commercial rights, cost/credit model, rate limits, export path, and failure behavior.

Existing application baseline remains React/TypeScript/Vite, Cloudflare Pages/Workers, Hono, D1, and private R2. Do not migrate infrastructure because another builder offers a faster demo.

## 2. Tool classes and intended fit

| Tool | Potential role | MAELVYN treatment | Gate |
|---|---|---|---|
| You.com | Search/research discovery and source retrieval | Optional research adapter candidate | Verify official MCP/API, auth, quotas, data terms, source provenance |
| WebMCP | Browser-facing tool discovery/interaction | Protocol/tooling candidate; exact integration target must be confirmed | Verify current standard, supported browser/runtime, permission model |
| Browser Use | Controlled browser automation for user-directed workflows | Optional execution adapter | Human authorization, isolated session, action log, no credential exposure |
| Firecrawl | Web crawling and page extraction | Research provider adapter already represented in code; live use still credential/cost gated | Per-run approval, domain policy, provenance, budget cap |
| Tavily | Search/research provider | Adapter represented in code; live use credential/cost gated | Query budget, source quality, retention, fallback |
| Floot | App builder / hosted full-stack workflow | Prototype/evaluation option, not current production baseline | Exportability, runtime ownership, pricing, data portability, lock-in review |
| FluxBuilder | Mobile app generation for commerce ecosystems | Later mobile distribution candidate; not MVP dependency | Native feature parity, supported commerce backend, build/release costs |
| Hyper | Live agent/product demonstration | Optional sales/demo surface | No access to private venture/customer data without explicit scope and consent |
| ShapeUI | UX/UI shaping before interface implementation | Design workflow aid; not a runtime dependency | Confirmed brief before code changes |
| UIAudit | Technical UI audit | Quality-review workflow | Evidence-based findings; no fabricated score |
| UI UX Designer | Design-system, accessibility, and component guidance | Design workflow aid | Verify output against code, WCAG, and brand tokens |
| Brand Strategist / brand tooling | Brand strategy and identity artifacts | Brand documentation aid | Approved decisions must be transferred to canonical repository docs |

## 3. Integration contract

Every production adapter must define:
1. Provider and capability identifier.
2. Owner, environment, and permitted venture/workspace scopes.
3. Auth mechanism and secret storage location.
4. Data classification and permitted payload fields.
5. Commercial terms, quotas, credits, and hard cost ceiling.
6. Idempotency, timeout, retry, cancellation, and failure handling.
7. Provenance and audit fields.
8. Human approval requirements and kill switch.
9. Export/portability and provider-exit procedure.
10. Tests using synthetic data.

No provider receives blanket cross-venture access. Child agents inherit equal or narrower scopes than the parent task. Provider fallback must never silently incur a second paid execution.

## 4. Cost and authorization rules

- Free tier, trial, and paid credits must be distinguished precisely.
- No credit-consuming research or generation without explicit approval of the proposed run and maximum cost.
- No automatic reload, subscription, or paid upgrade.
- Prefer public/free data and local tests where adequate.
- Record cost per run and cost per accepted outcome.
- A tool's advertised free tier is not assumed to include commercial use.

## 5. Evaluation scorecard

Evaluate on:
- Capability fit and output quality.
- Source provenance and reproducibility.
- Security, privacy, and permission boundaries.
- Commercial usage rights.
- Transparent pricing and predictable quotas.
- Latency, reliability, and recovery.
- API/MCP stability and testability.
- Data portability and provider independence.
- Incremental value over the existing stack.

## 6. Current status

This document does not assert that the listed tools are connected to MAELVYN, configured in its runtime, or authorized for paid use. The current code's provider registry and adapters are documented in the repository; use code, environment configuration, and dated live evidence to determine what is actually operational.
