import { ensureOk, ProviderError, timedFetch, type ProviderAdapter } from './types'

/** Firecrawl v2 — https://docs.firecrawl.dev/api-reference/endpoint/scrape (verified 2026-11-17). */
export const firecrawl: ProviderAdapter = {
  id: 'firecrawl',
  capabilities: ['extract.page'],
  external: true,
  isConfigured: (env) => !!env.FIRECRAWL_API_KEY,
  async healthCheck(env, ctx) {
    if (!env.FIRECRAWL_API_KEY) return { state: 'UNVERIFIED', detail: 'FIRECRAWL_API_KEY not configured.' }
    const res = await timedFetch('firecrawl', 'https://api.firecrawl.dev/v2/team/credit-usage', { headers: { Authorization: `Bearer ${env.FIRECRAWL_API_KEY}` } }, ctx)
    if (!res.ok) return { state: 'ERROR', detail: `Credit check failed (HTTP ${res.status}).` }
    const j = (await res.json()) as { data?: { remainingCredits?: number; planCredits?: number } }
    const remaining = j.data?.remainingCredits ?? null
    const state = remaining === 0 ? 'EXHAUSTED' : remaining !== null && remaining < 50 ? 'LIMITED' : 'AVAILABLE'
    return { state, detail: 'Team credit usage read.', quota: { remaining, limit: j.data?.planCredits ?? null } }
  },
  estimate: () => 1, // scrape = 1 credit per page
  async extract(env, input, ctx) {
    if (!env.FIRECRAWL_API_KEY) throw new ProviderError('firecrawl', 'not_configured', 'Firecrawl is not configured')
    const res = await timedFetch('firecrawl', 'https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input.url, formats: ['markdown'], onlyMainContent: true }),
    }, ctx)
    await ensureOk('firecrawl', res)
    const j = (await res.json()) as { success?: boolean; data?: { markdown?: unknown; metadata?: { title?: unknown } } }
    if (!j.success || !j.data) throw new ProviderError('firecrawl', 'invalid_output', 'Firecrawl response missing data')
    return { url: input.url, title: String(j.data.metadata?.title ?? ''), excerpt: String(j.data.markdown ?? '') }
  },
}
