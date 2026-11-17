import type { Env } from '../env'
import { AppError, todayUtc } from '../lib/http'
import { getAdapter } from './registry'
import type { Capability, ProviderAdapter } from './types'

export type ProviderSetting = {
  provider_id: string; live_enabled: number; paid_execution_allowed: number
  daily_credit_cap: number; per_task_credit_cap: number; actor_allowlist_json: string
}

export type RouteDecision = { adapter: ProviderAdapter; estimate: number; setting: ProviderSetting | null }

export async function loadSettings(env: Env, workspaceId: string): Promise<Map<string, ProviderSetting>> {
  const rows = (await env.DB.prepare(`SELECT * FROM workspace_provider_settings WHERE workspace_id = ?`).bind(workspaceId).all<ProviderSetting>()).results
  return new Map(rows.map((r) => [r.provider_id, r]))
}

export async function creditsUsedToday(env: Env, workspaceId: string, providerId: string): Promise<number> {
  const r = await env.DB.prepare(
    `SELECT COALESCE(SUM(COALESCE(actual_credits, estimated_credits)),0) AS used FROM provider_usage WHERE workspace_id = ? AND provider_id = ? AND usage_date = ? AND outcome <> 'denied'`,
  ).bind(workspaceId, providerId, todayUtc()).first<{ used: number }>()
  return r?.used ?? 0
}

/**
 * Routing order (docs/FINAL-STACK-DECISION.md §6): capability → allowlist → registered state &
 * credentials → workspace activation → per-task/daily budget. No automatic fallback to another
 * provider: if the preferred approved route is unavailable we STOP with a typed error.
 */
export async function routeProvider(env: Env, p: {
  workspaceId: string; capability: Capability; mode: 'synthetic' | 'live'; agentAllowlist: Capability[]
  remainingTaskBudget: number; preferred?: string[]
}): Promise<RouteDecision> {
  if (!p.agentAllowlist.includes(p.capability)) throw new AppError('FORBIDDEN', `Agent is not allowed to use capability ${p.capability}.`)
  if (p.mode === 'synthetic') {
    if (p.capability !== 'search.web') throw new AppError('PROVIDER_NOT_CONFIGURED', `No synthetic provider for ${p.capability}.`)
    return { adapter: getAdapter('mock-search')!, estimate: 0, setting: null }
  }
  const settings = await loadSettings(env, p.workspaceId)
  const candidates = (p.preferred ?? (p.capability === 'search.web' ? ['tavily'] : p.capability === 'extract.page' ? ['firecrawl'] : []))
  if (candidates.length === 0) throw new AppError('PROVIDER_NOT_CONFIGURED', `No live provider route for ${p.capability}.`)
  const id = candidates[0]!
  const adapter = getAdapter(id)
  if (!adapter || !adapter.capabilities.includes(p.capability)) throw new AppError('PROVIDER_NOT_CONFIGURED', `Provider ${id} does not support ${p.capability}.`)
  if (!adapter.isConfigured(env)) throw new AppError('PROVIDER_NOT_CONFIGURED', `Provider ${id} has no server-side credential configured.`, { provider: id })
  const s = settings.get(id) ?? null
  if (!s || s.live_enabled !== 1) throw new AppError('PROVIDER_DISABLED', `Live execution for ${id} is disabled in this workspace. A workspace admin must enable it with a credit cap.`, { provider: id })
  if (p.capability === 'actor.run' && s.paid_execution_allowed !== 1) throw new AppError('APPROVAL_REQUIRED', `Paid Actor execution on ${id} is not approved.`, { provider: id })
  const estimate = adapter.estimate(p.capability, null)
  if (estimate > p.remainingTaskBudget) throw new AppError('BUDGET_EXCEEDED', 'Task credit budget would be exceeded.', { provider: id, estimate, remaining: p.remainingTaskBudget })
  if (estimate > s.per_task_credit_cap) throw new AppError('BUDGET_EXCEEDED', `Per-task credit cap for ${id} would be exceeded.`, { provider: id })
  const used = await creditsUsedToday(env, p.workspaceId, id)
  if (used + estimate > s.daily_credit_cap) throw new AppError('BUDGET_EXCEEDED', `Daily credit cap for ${id} reached.`, { provider: id, used, cap: s.daily_credit_cap })
  return { adapter, estimate, setting: s }
}
