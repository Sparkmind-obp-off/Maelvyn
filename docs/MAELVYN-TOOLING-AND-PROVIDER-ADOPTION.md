# MAELVYN — Tooling & Provider Adoption Register

**Status:** Research-backed adoption policy  
**Reviewed:** 21 November 2026

## 1. Principle

Tools are replaceable providers, not the business itself. MAELVYN owns the customer relationship, offer, workflow contract, QA standard, provenance, cost model, and accepted deliverable. A provider may execute one bounded capability behind an adapter.

A tool is not considered production-ready merely because an account is connected or a connector appears in a catalog.

## 2. Current integration evidence

| Tool / platform | Current role | Adoption state | Control |
|---|---|---|---|
| Tavily | Web search and extraction/research | Connected research capability; existing provider adapter | Use for bounded discovery; record source URL and retrieval time |
| Firecrawl | Web scraping, extraction, crawl, structured page research | Connector capability discovered; paid operations must be budgeted | No paid crawl/search without per-task cost approval; use only when it adds coverage beyond Tavily |
| Composio | Connector discovery, account connections, tool execution | Connected orchestration bridge | Treat tool schemas and account scopes as contracts; do not grant broad write permissions by default |
| Apify | Actor-based data extraction and automation | Candidate provider; paid compute | Specific Actor allowlist and cost cap required before execution |
| Scrape.ly | Actor/search extraction | Candidate provider; paid per-result operations | Specific operation and result cap required |
| Cloudflare Workers AI | Potential inference/runtime provider | Candidate; binding and pricing need verification | No inference route until binding, model, price, and usage limit are recorded |
| Tidio / Lyro | Customer chat/helpdesk and AI support | Optional customer-service product; not MAELVYN's agentic OS | Start with free sandbox only; no customer data until privacy and retention review |
| Buffer | Social scheduling | Connected channel capability reported for MAELVYN account | Draft-first; publish only with explicit human approval |
| Shopify | Storefront/commerce connector | Account and seller scope not yet verified | Do not assume connected store or write capability |
| Gumroad | Digital product sales | Seller identity not verified as MAELVYN | No product publishing until legal seller and account ownership are verified |
| Etsy / Fiverr | Discovery/market research | Buyer-side discovery, not seller-side publishing | Never represent these as seller listing APIs |
| CapCut / browser automation | Creative editing through user-authenticated browser | Assisted/manual | Human session and approval; do not claim stable public API |
| Runway / Orshot | Creative production tools | Separate workspace context previously associated with another venture | Do not cross-use credentials, assets, or credits without explicit authorization |

## 3. Tidio evaluation

Official pricing page: https://www.tidio.com/pricing

The official pricing page reviewed on 21 November 2026 states:
- Free plan: USD 0/month, 50 billable human conversations/month, up to 10 seats, 100 Flows visitors reached, and 50 Lyro AI conversations as a one-time allocation.
- Starter displayed at USD 24.17/month when billed annually, with 100 billable conversations and 50 one-time Lyro conversations.
- Growth displayed from USD 49.17/month when billed annually.
- Lyro AI Agent add-on displayed from USD 32.50/month for 50 conversations.
- Flows displayed from USD 24.17/month for 2,000 visitors reached.
- A 7-day trial is offered without a credit card; after trial the account downgrades to Free unless upgraded.
- A billable conversation is counted when a human agent replies or initiates; Lyro conversations have a separate quota.

**Recommendation:** Tidio can be tested as a customer-facing chat/helpdesk layer, but it is not a required MAELVYN core dependency. The free quota is useful for a small pilot, not a dependable high-volume support operation. Do not buy paid Lyro or Flows until customer volume and support cost justify it. Do not feed customer personal data into Tidio until the privacy notice, processor terms, retention, access controls, and cross-border transfer assessment are reviewed.

## 4. Provider onboarding checklist

Before a provider becomes eligible for live production:
- [ ] Exact provider, product, plan, capability, and endpoint identified.
- [ ] Official documentation and current terms reviewed.
- [ ] Price model, free quota, overage, and billing trigger recorded.
- [ ] Commercial-use rights, data retention, and training policy checked.
- [ ] Data classification and permitted payload defined.
- [ ] Credential stored as a server-side secret; only secret reference stored in D1.
- [ ] Provider health, timeout, retry, idempotency, and failure behavior tested.
- [ ] Workspace/venture allowlist and kill switch configured.
- [ ] Per-task and daily budget cap approved.
- [ ] Output QA and provenance requirements defined.
- [ ] Human approval required for external side effects.

## 5. Research tool routing

Use Tavily for broad discovery and source extraction where its result is sufficient. Use Firecrawl when page-level extraction, crawling, screenshots, or structured extraction is specifically needed. Do not duplicate a Tavily search with a Firecrawl search unless the expected incremental evidence justifies the cost.

The current Composio connection audit showed GitHub active and Tavily active. Firecrawl search pricing previously surfaced at approximately USD 0.007 per query and basic scrape at approximately USD 0.003 per page in the connected catalog. These are observed catalog prices, not a guarantee of current billing. Paid Firecrawl calls remain disabled pending explicit task-level budget approval.

## 6. Integration state vocabulary

- `research_only`: discovery and read-only evaluation only.
- `assisted_manual`: operator performs the external action with human review.
- `draft_integration`: integration can create drafts but cannot publish/charge/fulfill.
- `write_enabled`: scoped write operations are technically available after approval.
- `live`: tested, monitored, budgeted, rights-cleared production capability.

Never infer `write_enabled` or `live` from a public API, a connected account, or an integration listing.
