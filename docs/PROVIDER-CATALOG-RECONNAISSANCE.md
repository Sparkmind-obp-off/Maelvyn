# MAELVYN — Provider Catalog Reconnaissance

**Date:** 2026-11-20  
**Status:** Catalog inspected; no paid provider calls authorized  
**Source:** Connected GetAnyAPI catalog via Composio  
**Connection:** `getanyapi` — active; alias `maelvyn-provider-catalog`

## 1. Executive findings

The connected catalog exposes **489 API operations** across 11 categories:

| Category | Operations |
|---|---:|
| Social | 204 |
| Data | 104 |
| Search | 71 |
| Shop | 63 |
| Video | 21 |
| Travel | 10 |
| Music | 7 |
| Finance | 6 |
| Ads | 1 |
| Maps | 1 |
| Reddit | 1 |
| **Total** | **489** |

This is a useful market-intelligence and data-extraction catalog. It is not a complete inventory of official publishing, payment, checkout, marketplace-seller, AI generation, or workflow APIs. Most entries are read/search/extract operations. Do not treat a catalog entry as an official platform API or as proof of seller-side write access.

The connected account reported a balance of **USD 0.12** during the connection check. No paid catalog API calls were executed in this reconnaissance. The balance is not a free-tier entitlement and must not be spent without an explicit per-task budget approval.

## 2. Useful capability candidates

The following are candidate read/intelligence operations. They are not yet MAELVYN Worker integrations and must be checked against current docs, terms, rights, quotas and cost before use.

### Research and web intelligence
- `google.search`, `google.search_100`
- `brave.search`, `bing.search`, `duckduckgo.search`
- `google.trends`, `google.news`, `google.scholar`
- `semrush.keywords`, `semrush.overview`
- `seo.keyword_overview`, `seo.keyword_suggestions`, `seo.competitors_domain`, `seo.ranked_keywords`
- `web.crawl`
- Ahrefs backlink, keyword and traffic operations

### Indonesia / social-commerce intelligence
- `tiktok_shop.search`, `tiktok_shop.product`, `tiktok_shop.shop_products`, `tiktok_shop.categories`, `tiktok_shop.product_reviews`, `tiktok_shop.search_suggestions`
- `facebook.marketplace`, `facebook.marketplace_item`
- Instagram public profile, hashtag, post, reel and transcript operations
- TikTok public profile, video, hashtag and ad-library operations
- YouTube channel, video, shorts and public metadata operations
- Meta Ad Library search and ad-detail operations

These entries are useful for product discovery, competitive intelligence, content research and demand validation. They do not establish permission to scrape private information, bypass access controls, or automate seller accounts.

### Global marketplace and freelance intelligence
- `etsy.search`, `etsy.product`, `etsy.shop`, `etsy.shop_listings`
- `fiverr.search`
- `upwork.jobs`
- `ebay.search`, `ebay.sold_listings`
- `amazon.search`, `amazon.product`, `amazon.bestsellers`
- `shopify.search`, `shopify.products`, `shopify.store`

These are primarily discovery and read-side operations. They do not provide proof of creating seller listings, publishing gigs, accepting orders or managing payouts.

### Creative and media research
- `pexels.search_photos`, `unsplash.search_photos`, `google.images`, `google.videos`
- `tiktok.top_ads_search`, `tiktok.video_transcript_full`
- Instagram/TikTok/YouTube public-media metadata and transcript operations

The reviewed results do **not** establish a dependable image/video/audio generation or editing API suitable for MAELVYN production. Generation providers must be inventoried separately through their official integrations and account plans.

## 3. Pricing and free-tier interpretation

The catalog includes pricing metadata such as:
- `pricing.from_offer.base_usd`
- `pricing.from_offer.max_per_1k_usd`
- `pricing.failover_max_usd`
- `try_eligible`
- `try_max_items`

Do not infer that `base_usd = 0` means unlimited free usage. Do not infer that `try_eligible = true` means zero-cost execution. A fallback/failover lane can have a non-zero price, and introductory offers can change. Before enabling any operation, capture the exact current price, billing unit, included trial quantity, reset/expiry, failover behavior, and maximum possible charge.

**Current policy:** provider execution remains disabled unless the venture owner approves an explicit per-task and monthly cost ceiling. Do not use the reported USD 0.12 balance for test calls without approval.

## 4. Platform capability boundaries

| Platform family | Catalog evidence | What it does not prove |
|---|---|---|
| TikTok Shop | Product search, details, store products, reviews, creator showcase | Seller onboarding, product listing creation, order management, fulfillment, payouts |
| Instagram / Facebook | Public content, account metadata, ads, Marketplace read-side search | Official publishing rights, seller listing writes, customer messaging rights |
| Shopee / Tokopedia | No verified seller-side operation found in this search batch | Official API availability or eligibility must be checked separately |
| Etsy | Public listing/shop search and lookup | Seller listing creation, order management or payouts |
| Fiverr | Gig search and listing extraction | Creating or managing a seller gig |
| Upwork | Job search | Seller profile, proposal submission or contract management |
| Shopify | Public store/product lookup | An owned MAELVYN Shopify store or write permission |
| AI generation | No suitable generation capability established in this catalog review | Image/video/audio generation or commercial output rights |

## 5. Integration status model

Every provider operation in MAELVYN must be tracked through distinct states:

`DISCOVERED → DOCS_VERIFIED → TERMS_VERIFIED → COST_VERIFIED → CONNECTION_VERIFIED → ADAPTER_IMPLEMENTED → TESTED → APPROVED → ENABLED`

An operation can remain useful as a research reference while disabled for production. The registry must distinguish:
- catalog source (Composio / GetAnyAPI / official provider);
- official API vs third-party aggregator;
- read vs write vs generation capability;
- connected account vs MAELVYN Worker credential;
- free/included allowance vs paid metered call;
- draft preparation vs external publication;
- commercial output rights vs technical access.

## 6. Next integration work

1. Add the full capability/provider metadata model to MAELVYN's provider registry.
2. Add provider connection and secret-reference management without storing credential values in D1, Git or logs.
3. Implement capability routing, quota checks, cost reservation, idempotency, audit and provider kill switches.
4. Verify official APIs and seller eligibility for Shopee, Tokopedia, TikTok Shop and other target channels separately.
5. Inventory true creative-generation providers and their free plans/credits and commercial terms.
6. Build a draft-first distribution adapter; enable publishing only after account ownership, official support, terms and explicit approval.
7. Preserve a manual/assisted channel path where official write APIs are unavailable.

## 7. No paid side effects

This reconnaissance performed catalog browsing and search only. It did not:
- run any catalog API operation against a target platform;
- publish social content;
- create marketplace listings or gigs;
- create orders or payments;
- use another venture's creative account;
- change MAELVYN production infrastructure.
