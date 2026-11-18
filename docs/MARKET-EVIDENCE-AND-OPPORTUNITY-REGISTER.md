# MAELVYN — Market Evidence & Opportunity Register

**Version:** 1.0  
**Status:** Initial evidence baseline; not a market-size report  
**Research scope:** Public Indonesian project-marketplace and seller-listing observations recorded in the MAELVYN research work  
**Last updated:** 2026-11-18

## 1. Purpose

This register preserves what has actually been observed so product and venture decisions do not rely on invented demand. It distinguishes completed transactions, active buyer intent, supply/price signals, attention signals, and unverified claims.

The register is intentionally conservative. It does not claim that the observations represent the whole Indonesian market, establish market size, or guarantee future sales.

## 2. Evidence grading

- **A — Completed transaction:** source indicates a project/order was completed and an accepted budget or transaction amount is visible.
- **B — Active buyer intent:** a buyer has published a current request with a stated need, deadline, or budget; payment is not established.
- **C — Supply/price signal:** sellers advertise comparable products/services and asking prices; actual sales are not established.
- **D — Attention signal:** views, search interest, followers, or channel activity; buyer conversion is not established.
- **E — Anecdotal/unverified:** uncorroborated claim or incomplete source.

Do not combine these classes into one “demand count”. Do not report a listing, bid, view, or posted budget as a completed sale.

## 3. A-class: completed transaction observations

### A1 — WhatsApp to Google Sheets automation

- Source: Projects.co.id project page.
- URL: https://projects.co.id/public/browse_projects/view/385c1d/sambungkan-whatsapp-ke-google-sheet
- Published: 30 September 2026.
- Work period: 7–13 October 2026.
- Status observed: Completed.
- Accepted budget observed: Rp200,000.
- Buyer problem: staff WhatsApp messages needed to be captured in Google Sheets for sales, employee meal expenses, and leave/absence records.
- Product implication: a narrowly scoped operational automation setup may be productized around a concrete workflow and measurable time/error reduction.
- Limitation: one project does not establish market size, repeat demand, or a standard price.

### A2 — Social Media Manager

- Source: Projects.co.id past project page.
- URL: https://projects.co.id/public/past_projects/view/da271d/freelance-social-media-manager
- Published: 8 March 2026.
- Work period: 1–21 April 2026.
- Status observed: Completed.
- Accepted budget observed: Rp1,500,000.
- Buyer problem: 30-day social media management.
- Buyer rating observed: 10/10.
- Product implication: recurring social media operations are a plausible service family to validate.
- Limitation: one completed project does not establish recurring retention, gross margin, or broad price acceptance.

### A3 — Video editing

- Source: Projects.co.id past project page.
- URL: https://projects.co.id/public/past_projects/view/c9491d/editing-video
- Completion observed: July 2026.
- Status observed: Completed.
- Accepted budget observed: Rp100,001.
- Buyer problem: video editing.
- Product implication: small-scope editing can be tested as a productized service or entry offer.
- Limitation: the recorded amount is a single accepted budget, not a recommended tariff or evidence of profitable delivery.

## 4. B-class: active buyer intent

### B1 — Claude setup to automate customer discovery

- Source: Projects.co.id project page.
- URL: https://projects.co.id/public/browse_projects/view/6a661d/admin-setup-claude-untuk-otomatisasi-cari-customer
- Published: 14 November 2026.
- Status at capture: Published.
- Posted budget: Rp500,000–1,000,000.
- Requested completion target: 3 days; page deadline recorded as 14 December 2026.
- Buyer problem: buyer already had Claude Pro and wanted it configured to find potential customers and send daily emails.
- Product implication: demand may exist for practical AI workflow setup, lead research, and controlled outreach configuration.
- Limitation: posted budget and published request do not prove that a worker was hired, the work was completed, or the budget was paid. Any outreach workflow must comply with privacy, anti-spam, platform terms, and human review requirements.
- Capture note: status and bids can change; recheck the live page before using it as current demand evidence.

## 5. C-class: supply and asking-price observations

### C1 — Scrape.ly Shopee listing sample

- Actor: `shelfbright/shopee-scraper`.
- Run ID: `616f14cfe8644e3bb`.
- Search terms: “jasa edit video promosi”, “jasa desain konten instagram”, “jasa kelola media sosial”.
- Records returned: 35.
- Run success: 100%.
- Observed collection cost: US$7.22 per 1,000 results plus US$0.00045 actor start; 35 records were approximately US$0.25315.
- Interpretation: supply and asking-price observations across the queried service terms.
- Critical limitation: listing records do not prove orders, sales volume, conversion, revenue, seller quality, or completed fulfillment.

Example listings captured:
- Video advertisement editing, asking price Rp34,900: https://shopee.co.id/jasa-edit-video-iklan-profesional-siap-dalam-23-jam-i.529761984.23966955055
- Social media management, asking price Rp289,000: https://shopee.co.id/kelola-sosial-media-instagram-tiktok-free-edit-foto-product-professional-murah-i.290804064.27390286975
- Instagram feed design, asking price Rp99,999: https://shopee.co.id/jasa-desain-feed-instagram-profesional-termurah-desain-konten-produk-ig-story-custom-termurah-i.237991452.49715340329

Prices are seller asking prices, not verified transaction prices. Scope, quality, revisions, quantity, delivery, and seller terms may differ substantially.

### C2 — Additional vendor/supply references

- Sayuswa, WhatsApp/Sheets automation service page: https://sayuswa.com/id/jasa-otomasi-ai-untuk-umkm
- Sijie Digital, AI workflow automation: https://www.sijiedigital.com
- Fastwork, social media management category: https://fastwork.id/social-media-management
- Sagara Ruang, social media management price guide: https://sagararuang.com/blog/panduan-jasa-social-media-management

Interpretation: providers and service categories exist in the market. These references are not completed transaction evidence.

## 6. D-class: attention and audience signals

A Nexlev Shorts channel search returned 30 channels with average relevance around 66%. This is an attention/content-ecosystem signal only. It does not prove customer demand, paid conversion, profitability, or product-market fit.

## 7. Inconclusive or excluded observations

The following must not be used as strong positive demand evidence:
- Firecrawl job searches for social media/content/video editor/marketplace admin returned zero results from the sources queried. This is inconclusive and may reflect source coverage or query limitations; it does not mean no demand exists.
- An Apify TikTok Shop actor attempt using a free cache-only mode returned no usable product records. No GMV/sales evidence was obtained.
- Scrape.ly TikTok Shop top-products actor required a paid Starter or higher plan; no run was started and no charge was incurred.
- Projects.co.id records marked No Action, canceled, rejected, or without an accepted budget are not completed transactions.
- A web scraping request from 2024, a marketplace admin request from 2022, a 2026 e-commerce accounting/tax request marked No Action, a canceled logistics app project, and a rejected data-entry project are excluded from the strong evidence set.

## 8. Initial opportunity hypotheses

| Hypothesis | Evidence basis | Confidence | Cheapest next validation |
|---|---|---|---|
| WhatsApp-to-Sheets operational automation | A1 completed + vendor supply references | Moderate for existence of paid need; low for market size | Interview 5 target operators; offer a fixed-scope paid pilot; measure setup and support hours |
| Social media operations for small businesses | A2 completed + C1/C2 supply | Moderate for existence of paid need; price/margin unknown | Define a 2-week pilot; test buyer conversion and workload before monthly retainer |
| Short-form video editing/product content | A3 completed + C1 supply | Moderate for existence of paid need; competitive pricing pressure likely | Test 3 distinct scopes with real prospects; track revisions and effective hourly margin |
| AI-assisted lead research/workflow setup | B1 active buyer intent | Early; payment not proven | Recheck project outcome and run a compliant manual concierge pilot with explicit approval |
| Digital templates/SOPs | Adjacent to observed operational pain | Low; no direct transaction evidence in this register | Publish a narrowly targeted paid pre-order or landing-page test before building a catalogue |

These are hypotheses to test, not approved ventures, promised products, or guaranteed revenue streams.

## 9. What the evidence does and does not establish

### Established by current observations
- At least three completed Indonesian marketplace projects in adjacent automation, social media, and video-editing service areas show that buyers have paid for these types of outcomes.
- One published buyer request shows current stated intent for AI-assisted customer discovery configuration.
- Sellers advertise comparable services at a wide range of asking prices.
- Collection methods and costs vary; source coverage is incomplete.

### Not established
- Total addressable market or serviceable market.
- Monthly number of buyers or completed sales.
- Conversion rates, average order value, repeat purchase, churn, or customer acquisition cost.
- Reliable price elasticity or willingness to pay for MAELVYN's own offers.
- Net margins after labor, revisions, provider costs, payment fees, taxes, refunds, and acquisition.
- Whether any particular offer can be fulfilled consistently by the current team.

## 10. Research protocol for the next cycle

For every new research run:
1. Define the exact buyer, geography, problem, and decision the research should inform.
2. Select sources based on whether they can reveal transactions, active intent, supply, or attention.
3. Record the tool, actor, query, filters, capture time, record count, deduplication, and actual cost.
4. Preserve source URLs and only collect data permitted by the source and provider terms.
5. Label every record A–E; do not upgrade its class without new evidence.
6. Manually verify a sample and record coverage/bias.
7. Separate asking price, posted budget, accepted budget, paid amount, and settlement amount.
8. Convert findings into a specific test with success and stop thresholds.
9. Recheck time-sensitive buyer requests before acting.
10. Require human approval before paid scraping, external outreach, publication, or commercial commitments.

Do not pursue 3,000 records merely to reach a volume target. Use the smallest sample that can answer the decision reliably; scale collection only when marginal value exceeds cost and the source coverage is understood.

## 11. Next validation priorities

1. Recheck B1 and identify whether it was awarded, completed, canceled, or expired.
2. Find additional A-class transactions in automation, recurring content, and video editing with clear completed status and accepted amounts.
3. Seek buyer-side evidence: interviews, paid pilots, deposits, repeat orders, and acceptance.
4. Collect competitor scope and price information, not just headline prices.
5. Calculate real delivery cost using time tracking and provider usage.
6. Launch only one or two narrow offers that can be fulfilled and reconciled end-to-end.

## 12. Decision rule

No venture or product is approved because it appears in this register. Approval requires a current opportunity brief, validated buyer problem, defined test, rights and delivery review, budget, unit-economics assumptions, owner, stop conditions, and recorded human decision.
