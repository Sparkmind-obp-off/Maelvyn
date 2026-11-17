import { z } from 'zod'
import type { Env } from '../env'

export type Capability = 'search.web' | 'extract.page' | 'actor.run' | 'inference.text'
export type ProviderId = 'mock-search' | 'tavily' | 'firecrawl' | 'apify' | 'scrapely' | 'workers-ai'

/** Provider states per docs/FINAL-STACK-DECISION.md §6. */
export type ProviderState = 'UNVERIFIED' | 'AVAILABLE' | 'LIMITED' | 'EXHAUSTED' | 'DISABLED' | 'REVIEW_REQUIRED' | 'FALLBACK_ACTIVE' | 'ERROR'

export type ErrorClass = 'auth' | 'quota_exhausted' | 'rate_limited' | 'invalid_request' | 'upstream_unavailable' | 'timeout' | 'invalid_output' | 'not_configured' | 'unknown'

export class ProviderError extends Error {
  constructor(public providerId: ProviderId, public errorClass: ErrorClass, message: string, public httpStatus?: number) {
    super(message)
  }
}

export const SearchInput = z.object({ query: z.string().min(3).max(400), maxResults: z.number().int().min(1).max(10) })
export type SearchInput = z.infer<typeof SearchInput>
export type SearchHit = { url: string; title: string; snippet: string; score: number | null }
export type SearchOutput = { hits: SearchHit[]; synthetic: boolean; providerRequestId?: string }

export const ExtractInput = z.object({ url: z.string().url() })
export type ExtractInput = z.infer<typeof ExtractInput>
export type ExtractOutput = { url: string; title: string; excerpt: string }

export const ActorRunInput = z.object({ actorId: z.string().min(1).max(200), input: z.record(z.string(), z.unknown()), maxTotalChargeUsd: z.number().positive().max(5) })
export type ActorRunInput = z.infer<typeof ActorRunInput>
export type ActorRunOutput = { runId: string; status: string; datasetId?: string }

export type HealthResult = { state: ProviderState; detail: string; quota?: { used?: number; limit?: number | null; remaining?: number | null } }

export type CallContext = { idempotencyKey: string; timeoutMs: number; fetchImpl?: typeof fetch }

/** Canonical adapter contract (docs/FINAL-STACK-DECISION.md §5). */
export interface ProviderAdapter {
  id: ProviderId
  capabilities: Capability[]
  external: boolean
  isConfigured(env: Env): boolean
  healthCheck(env: Env, ctx: CallContext): Promise<HealthResult>
  /** Estimated credits for one call; used for budget reservation before execution. */
  estimate(capability: Capability, input: unknown): number
  search?(env: Env, input: SearchInput, ctx: CallContext): Promise<SearchOutput>
  extract?(env: Env, input: ExtractInput, ctx: CallContext): Promise<ExtractOutput>
  runActor?(env: Env, input: ActorRunInput, ctx: CallContext): Promise<ActorRunOutput>
}

export function classifyHttp(status: number): ErrorClass {
  if (status === 401 || status === 403) return 'auth'
  if (status === 402 || status === 432 || status === 433) return 'quota_exhausted'
  if (status === 429) return 'rate_limited'
  if (status === 408 || status === 504) return 'timeout'
  if (status >= 400 && status < 500) return 'invalid_request'
  return 'upstream_unavailable'
}

/** fetch with bounded timeout; never logs headers (credentials). */
export async function timedFetch(id: ProviderId, url: string, init: RequestInit, ctx: CallContext): Promise<Response> {
  const f = ctx.fetchImpl ?? fetch
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ctx.timeoutMs)
  try {
    return await f(url, { ...init, signal: ac.signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new ProviderError(id, 'timeout', `${id} request timed out`)
    throw new ProviderError(id, 'upstream_unavailable', `${id} request failed`)
  } finally {
    clearTimeout(t)
  }
}

export async function ensureOk(id: ProviderId, res: Response): Promise<void> {
  if (res.ok) return
  throw new ProviderError(id, classifyHttp(res.status), `${id} returned HTTP ${res.status}`, res.status)
}
