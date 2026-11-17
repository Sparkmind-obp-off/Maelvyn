import type { ProviderAdapter, SearchHit } from './types'

/**
 * Deterministic synthetic search. Every hit is explicitly labelled SYNTHETIC and points to
 * the reserved example.invalid TLD so it can never be mistaken for live evidence.
 */
export const mockSearch: ProviderAdapter = {
  id: 'mock-search',
  capabilities: ['search.web'],
  external: false,
  isConfigured: () => true,
  async healthCheck() { return { state: 'AVAILABLE', detail: 'Synthetic provider; no network, no cost.' } },
  estimate: () => 0,
  async search(_env, input) {
    const topic = input.query.slice(0, 80)
    const angles = ['customer problem', 'existing alternatives', 'pricing signals', 'regulatory constraints', 'distribution channels']
    const hits: SearchHit[] = angles.slice(0, input.maxResults).map((a, i) => ({
      url: `https://synthetic-${i + 1}.example.invalid/${encodeURIComponent(a.replace(/ /g, '-'))}`,
      title: `[SYNTHETIC] ${a} — ${topic}`,
      snippet: `[SYNTHETIC TEST DATA] Placeholder note about ${a} for "${topic}". This is not real evidence and must not be used for decisions.`,
      score: Number((0.9 - i * 0.1).toFixed(2)),
    }))
    return { hits, synthetic: true }
  },
}
