import { describe, expect, it } from 'vitest'
import { apify, scrapely } from '../server/providers/actors'
import { firecrawl } from '../server/providers/firecrawl'
import { mockSearch } from '../server/providers/mock'
import { ADAPTERS } from '../server/providers/registry'
import { tavily } from '../server/providers/tavily'
import { classifyHttp, ProviderError } from '../server/providers/types'
import { workersAi } from '../server/providers/workersai'
import type { Env } from '../server/env'
import { json } from './helpers'

const env = { TAVILY_API_KEY: 'tvly-x', FIRECRAWL_API_KEY: 'fc-x', APIFY_TOKEN: 'apify_api_x', SCRAPELY_API_KEY: 'scrapely_x' } as unknown as Env
const empty = {} as unknown as Env
type Captured = { url: string; init: RequestInit }
function capture(resp: Response) {
  const calls: Captured[] = []
  const f = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return resp.clone() }) as unknown as typeof fetch
  return { calls, ctx: { idempotencyKey: 'idem-1', timeoutMs: 1000, fetchImpl: f } }
}

describe('provider registry contract', () => {
  it('registers all five mandatory adapters plus the mock', () => {
    expect(Object.keys(ADAPTERS).sort()).toEqual(['apify', 'firecrawl', 'mock-search', 'scrapely', 'tavily', 'workers-ai'])
    for (const a of Object.values(ADAPTERS)) {
      expect(typeof a.healthCheck).toBe('function')
      expect(typeof a.estimate).toBe('function')
      expect(a.capabilities.length).toBeGreaterThan(0)
    }
  })
  it('every external adapter reports UNVERIFIED (not configured) without credentials and makes no call', async () => {
    for (const a of [tavily, firecrawl, apify, scrapely, workersAi]) {
      const { calls, ctx } = capture(json({}))
      expect(a.isConfigured(empty)).toBe(false)
      const h = await a.healthCheck(empty, ctx)
      expect(h.state).toBe('UNVERIFIED')
      expect(calls).toHaveLength(0)
    }
  })
  it('classifies HTTP errors', () => {
    expect(classifyHttp(401)).toBe('auth')
    expect(classifyHttp(402)).toBe('quota_exhausted')
    expect(classifyHttp(429)).toBe('rate_limited')
    expect(classifyHttp(400)).toBe('invalid_request')
    expect(classifyHttp(503)).toBe('upstream_unavailable')
  })
})

describe('mock search', () => {
  it('returns clearly labelled synthetic hits on a reserved TLD', async () => {
    const out = await mockSearch.search!(empty, { query: 'synthetic topic', maxResults: 3 }, { idempotencyKey: 'x', timeoutMs: 10 })
    expect(out.synthetic).toBe(true)
    expect(out.hits).toHaveLength(3)
    for (const h of out.hits) { expect(h.url).toContain('.example.invalid'); expect(h.title).toContain('[SYNTHETIC]') }
  })
})

describe('tavily adapter', () => {
  it('posts a basic search with bearer auth and normalizes results', async () => {
    const { calls, ctx } = capture(json({ query: 'q', results: [{ url: 'https://a.test/x', title: 'A', content: 'Body', score: 0.7 }], request_id: 'r1' }))
    const out = await tavily.search!(env, { query: 'q test', maxResults: 2 }, ctx)
    expect(calls[0]!.url).toBe('https://api.tavily.com/search')
    expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe('Bearer tvly-x')
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ search_depth: 'basic', max_results: 2, include_raw_content: false })
    expect(out).toMatchObject({ synthetic: false, providerRequestId: 'r1', hits: [{ url: 'https://a.test/x', title: 'A', snippet: 'Body', score: 0.7 }] })
    expect(tavily.estimate('search.web', null)).toBe(1)
  })
  it('maps quota errors to typed ProviderError', async () => {
    const { ctx } = capture(json({ detail: 'limit' }, 432))
    await expect(tavily.search!(env, { query: 'q test', maxResults: 1 }, ctx)).rejects.toMatchObject({ errorClass: 'quota_exhausted' })
  })
  it('health uses the read-only /usage endpoint and computes remaining quota', async () => {
    const { calls, ctx } = capture(json({ account: { current_plan: 'Researcher', plan_usage: 10, plan_limit: 1000 } }))
    const h = await tavily.healthCheck(env, ctx)
    expect(calls[0]!.url).toBe('https://api.tavily.com/usage')
    expect(h).toMatchObject({ state: 'AVAILABLE', quota: { remaining: 990 } })
  })
  it('rejects malformed output', async () => {
    const { ctx } = capture(json({ nope: true }))
    await expect(tavily.search!(env, { query: 'q test', maxResults: 1 }, ctx)).rejects.toBeInstanceOf(ProviderError)
  })
})

describe('firecrawl adapter', () => {
  it('scrapes markdown via v2 and normalizes', async () => {
    const { calls, ctx } = capture(json({ success: true, data: { markdown: '# Hello', metadata: { title: 'T' } } }))
    const out = await firecrawl.extract!(env, { url: 'https://a.test/x' }, ctx)
    expect(calls[0]!.url).toBe('https://api.firecrawl.dev/v2/scrape')
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ url: 'https://a.test/x', formats: ['markdown'], onlyMainContent: true })
    expect(out).toEqual({ url: 'https://a.test/x', title: 'T', excerpt: '# Hello' })
  })
  it('health reads remaining credits', async () => {
    const { calls, ctx } = capture(json({ success: true, data: { remainingCredits: 3, planCredits: 1000 } }))
    const h = await firecrawl.healthCheck(env, ctx)
    expect(calls[0]!.url).toBe('https://api.firecrawl.dev/v2/team/credit-usage')
    expect(h.state).toBe('LIMITED')
  })
})

describe('actor adapters (apify, scrape.ly)', () => {
  it.each([[apify, 'https://api.apify.com'], [scrapely, 'https://api.scrape.ly']])('%s: health uses free /v2/users/me and stays REVIEW_REQUIRED', async (a, base) => {
    const { calls, ctx } = capture(json({ data: { plan: { id: 'FREE' } } }))
    const h = await a.healthCheck(env, ctx)
    expect(calls[0]!.url).toBe(`${base}/v2/users/me`)
    expect(h.state).toBe('REVIEW_REQUIRED')
  })
  it.each([[apify, 'https://api.apify.com'], [scrapely, 'https://api.scrape.ly']])('%s: run sends input body, charge cap and Idempotency-Key', async (a, base) => {
    const { calls, ctx } = capture(json({ data: { id: 'run1', status: 'READY', defaultDatasetId: 'ds1' } }, 201))
    const out = await a.runActor!(env, { actorId: 'user/actor', input: { q: 1 }, maxTotalChargeUsd: 0.5 }, ctx)
    expect(calls[0]!.url).toBe(`${base}/v2/acts/user~actor/runs?maxTotalChargeUsd=0.5`)
    expect((calls[0]!.init.headers as Record<string, string>)['Idempotency-Key']).toBe('idem-1')
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ q: 1 })
    expect(out).toEqual({ runId: 'run1', status: 'READY', datasetId: 'ds1' })
  })
})
