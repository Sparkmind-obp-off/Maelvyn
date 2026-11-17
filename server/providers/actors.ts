import { ensureOk, ProviderError, timedFetch, type ProviderAdapter, type ProviderId } from './types'
import type { Env } from '../env'

/**
 * Apify and Scrape.ly share the Actor run model (POST /v2/acts/{actorId}/runs, body = input object,
 * Authorization: Bearer). Runs are CHARGED, so the router refuses them unless the workspace has
 * live + paid execution enabled AND the Actor is on the explicit allowlist. Health checks use the
 * free GET /v2/users/me identity endpoint only.
 * Docs: https://docs.apify.com/api/v2 · https://scrape.ly/docs/api-overview (verified 2026-11-17)
 */
function actorAdapter(id: ProviderId, base: string, key: (env: Env) => string | undefined): ProviderAdapter {
  return {
    id,
    capabilities: ['actor.run'],
    external: true,
    isConfigured: (env) => !!key(env),
    async healthCheck(env, ctx) {
      const k = key(env)
      if (!k) return { state: 'UNVERIFIED', detail: 'Credential not configured.' }
      const res = await timedFetch(id, `${base}/v2/users/me`, { headers: { Authorization: `Bearer ${k}` } }, ctx)
      if (!res.ok) return { state: 'ERROR', detail: `Identity check failed (HTTP ${res.status}).` }
      const j = (await res.json()) as { data?: { plan?: { id?: string } } }
      return { state: 'REVIEW_REQUIRED', detail: `Credential valid (plan: ${j.data?.plan?.id ?? 'unknown'}). Actor runs require an approved Actor allowlist and budget.` }
    },
    estimate: () => 1,
    async runActor(env, input, ctx) {
      const k = key(env)
      if (!k) throw new ProviderError(id, 'not_configured', `${id} is not configured`)
      const actor = encodeURIComponent(input.actorId.replace('/', '~'))
      const url = `${base}/v2/acts/${actor}/runs?maxTotalChargeUsd=${input.maxTotalChargeUsd}`
      const res = await timedFetch(id, url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${k}`, 'Content-Type': 'application/json', 'Idempotency-Key': ctx.idempotencyKey },
        body: JSON.stringify(input.input),
      }, ctx)
      await ensureOk(id, res)
      const j = (await res.json()) as { data?: { id?: string; status?: string; defaultDatasetId?: string } }
      if (!j.data?.id) throw new ProviderError(id, 'invalid_output', `${id} run response missing id`)
      return { runId: j.data.id, status: String(j.data.status ?? 'UNKNOWN'), datasetId: j.data.defaultDatasetId }
    },
  }
}

export const apify = actorAdapter('apify', 'https://api.apify.com', (env) => env.APIFY_TOKEN)
export const scrapely = actorAdapter('scrapely', 'https://api.scrape.ly', (env) => env.SCRAPELY_API_KEY)
