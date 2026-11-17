import { ensureOk, ProviderError, timedFetch, type ProviderAdapter } from './types'

/** Tavily Search — https://docs.tavily.com/documentation/api-reference/endpoint/search (verified 2026-11-17). */
export const tavily: ProviderAdapter = {
  id: 'tavily',
  capabilities: ['search.web'],
  external: true,
  isConfigured: (env) => !!env.TAVILY_API_KEY,
  async healthCheck(env, ctx) {
    if (!env.TAVILY_API_KEY) return { state: 'UNVERIFIED', detail: 'TAVILY_API_KEY not configured.' }
    // GET /usage is a read-only account endpoint (no search credits consumed).
    const res = await timedFetch('tavily', 'https://api.tavily.com/usage', { headers: { Authorization: `Bearer ${env.TAVILY_API_KEY}` } }, ctx)
    if (!res.ok) return { state: 'ERROR', detail: `Usage check failed (HTTP ${res.status}).` }
    const j = (await res.json()) as { account?: { current_plan?: string; plan_usage?: number; plan_limit?: number | null } }
    const used = j.account?.plan_usage ?? 0
    const limit = j.account?.plan_limit ?? null
    const remaining = limit === null ? null : Math.max(0, limit - used)
    const state = remaining === 0 ? 'EXHAUSTED' : remaining !== null && remaining < 50 ? 'LIMITED' : 'AVAILABLE'
    return { state, detail: `Plan: ${j.account?.current_plan ?? 'unknown'}`, quota: { used, limit, remaining } }
  },
  estimate: () => 1, // search_depth=basic costs 1 API credit
  async search(env, input, ctx) {
    if (!env.TAVILY_API_KEY) throw new ProviderError('tavily', 'not_configured', 'Tavily is not configured')
    const res = await timedFetch('tavily', 'https://api.tavily.com/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TAVILY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input.query, search_depth: 'basic', max_results: input.maxResults, include_answer: false, include_raw_content: false, include_images: false }),
    }, ctx)
    await ensureOk('tavily', res)
    const j = (await res.json()) as { results?: Array<{ url?: unknown; title?: unknown; content?: unknown; score?: unknown }>; request_id?: string }
    if (!Array.isArray(j.results)) throw new ProviderError('tavily', 'invalid_output', 'Tavily response missing results')
    return {
      synthetic: false,
      providerRequestId: typeof j.request_id === 'string' ? j.request_id : undefined,
      hits: j.results.map((r) => ({
        url: String(r.url ?? ''), title: String(r.title ?? ''), snippet: String(r.content ?? ''),
        score: typeof r.score === 'number' ? r.score : null,
      })),
    }
  },
}
