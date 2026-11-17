import { apify, scrapely } from './actors'
import { firecrawl } from './firecrawl'
import { mockSearch } from './mock'
import { tavily } from './tavily'
import type { ProviderAdapter, ProviderId } from './types'
import { workersAi } from './workersai'

export const ADAPTERS: Record<ProviderId, ProviderAdapter> = {
  'mock-search': mockSearch, tavily, firecrawl, apify, scrapely, 'workers-ai': workersAi,
}

export function getAdapter(id: string): ProviderAdapter | undefined {
  return (ADAPTERS as Record<string, ProviderAdapter | undefined>)[id]
}
