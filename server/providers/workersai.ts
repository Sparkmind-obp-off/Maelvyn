import type { ProviderAdapter } from './types'

/**
 * Cloudflare Workers AI adapter contract. No AI binding is attached in this environment
 * (binding + model capability registry + spend approval are required first), so the adapter
 * reports UNVERIFIED and exposes no executable capability. Research briefs are produced by a
 * deterministic extractive generator instead — never by silently routing to paid inference.
 */
export const workersAi: ProviderAdapter = {
  id: 'workers-ai',
  capabilities: ['inference.text'],
  external: true,
  isConfigured: () => false,
  async healthCheck() { return { state: 'UNVERIFIED', detail: 'No Workers AI binding configured; model availability and spend not approved.' } },
  estimate: () => 0,
}
