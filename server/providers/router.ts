import type { Env } from '../env'
import { AppError, nowIso, todayUtc } from '../lib/http'
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
  if (!Number.isSafeInteger(estimate) || estimate <= 0) throw new AppError('BUDGET_EXCEEDED', 'No valid provider credit estimate.')
  if (estimate > p.remainingTaskBudget) throw new AppError('BUDGET_EXCEEDED', 'Task credit budget would be exceeded.', { provider: id, estimate, remaining: p.remainingTaskBudget })
  if (estimate > s.per_task_credit_cap) throw new AppError('BUDGET_EXCEEDED', `Per-task credit cap for ${id} would be exceeded.`, { provider: id })
  const used = await creditsUsedToday(env, p.workspaceId, id)
  if (used + estimate > s.daily_credit_cap) throw new AppError('BUDGET_EXCEEDED', `Daily credit cap for ${id} reached.`, { provider: id, used, cap: s.daily_credit_cap })
  return { adapter, estimate, setting: s }
}

/** Atomic daily admission: concurrent requests cannot both spend the last credit.
 * Unsettled reservations are charged conservatively for their UTC day; never retry automatically.
 */
export async function reserveResearchCall(env: Env, route: RouteDecision, p: {
  workspaceId: string; ventureId: string; taskId: string; capability: 'search.web' | 'extract.page'
}): Promise<{ id: string; date: string } | null> {
  if (!route.adapter.external) return null
  const id = `${p.taskId}:${p.capability}`
  const now = nowIso()
  const date = now.slice(0, 10)
  const result = await env.DB.prepare(`
    INSERT INTO provider_call_reservations
      (id, workspace_id, task_id, provider_id, capability, estimated_credits, usage_date, created_at)
    SELECT ?, t.workspace_id, t.id, s.provider_id, ?, ?, ?, ?
      FROM tasks t JOIN workspace_provider_settings s ON s.workspace_id = t.workspace_id
     WHERE t.id = ? AND t.workspace_id = ? AND t.venture_id = ? AND t.status = 'running'
       AND s.provider_id = ? AND s.live_enabled = 1 AND s.per_task_credit_cap >= ?
       AND s.daily_credit_cap >= ? +
         (SELECT COALESCE(SUM(COALESCE(u.actual_credits, u.estimated_credits)), 0)
            FROM provider_usage u WHERE u.workspace_id = s.workspace_id AND u.provider_id = s.provider_id
             AND u.usage_date = ? AND u.outcome <> 'denied') +
         (SELECT COALESCE(SUM(r.estimated_credits), 0) FROM provider_call_reservations r
           WHERE r.workspace_id = s.workspace_id AND r.provider_id = s.provider_id AND r.usage_date = ?
             AND NOT EXISTS (SELECT 1 FROM provider_usage u WHERE u.id = r.id))
    ON CONFLICT(task_id, capability) DO NOTHING`)
    .bind(id, p.capability, route.estimate, date, now, p.taskId, p.workspaceId, p.ventureId,
      route.adapter.id, route.estimate, route.estimate, date, date).run()
  if (result.meta.changes !== 1) throw new AppError('BUDGET_EXCEEDED', 'Provider call reservation denied by current scope, cap, or prior attempt.')
  return { id, date }
}
