import type { Context } from 'hono'
import { authorizeVenture, authorizeWorkspace, type Action } from '../authorization/policy'
import type { AppEnv, Env } from '../env'
import { AppError } from './http'
import { principalOf } from './request'

/** Venture-scoped context: authorization is resolved BEFORE any venture data is read. */
export async function ventureCtx(c: Context<AppEnv>, action: Action, ventureId?: string) {
  const p = principalOf(c)
  const access = await authorizeVenture(c.env, p, String(ventureId ?? c.req.param('vid')), action, c.get('requestId'))
  return { p, access }
}

export async function workspaceCtx(c: Context<AppEnv>, action: Action, workspaceId?: string) {
  const p = principalOf(c)
  const access = await authorizeWorkspace(c.env, p, String(workspaceId ?? c.req.param('wid')), action, c.get('requestId'))
  return { p, access }
}

/** Tables addressed by id whose rows carry a venture_id. Names are code constants, never user input. */
const VENTURE_TABLES = new Set([
  'venture_charters', 'budgets', 'journal_entries', 'finance_accounts', 'contributions', 'agreements', 'ownership_interests',
  'ip_assets', 'milestones', 'work_items', 'assets', 'customers', 'offers', 'orders', 'experiments', 'venture_risks', 'memory_records',
])

/** Resolve a record's venture and authorize; unknown and unauthorized records are indistinguishable. */
export async function recordCtx(c: Context<AppEnv>, table: string, action: Action, label = 'Record', id?: string) {
  if (!VENTURE_TABLES.has(table)) throw new AppError('INTERNAL_ERROR', 'Unsupported record type.')
  const rid = String(id ?? c.req.param('id'))
  const row = await c.env.DB.prepare(`SELECT venture_id FROM ${table} WHERE id = ?`).bind(rid).first<{ venture_id: string | null }>()
  if (!row?.venture_id) throw new AppError('NOT_FOUND', `${label} not found.`)
  try {
    return { ...(await ventureCtx(c, action, row.venture_id)), id: rid }
  } catch (e) {
    if (e instanceof AppError && e.code === 'NOT_FOUND') throw new AppError('NOT_FOUND', `${label} not found.`)
    throw e
  }
}

/** True when the person is an active member of the workspace (used to validate assignees/parties). */
export async function isActiveWorkspaceMember(env: Env, workspaceId: string, personId: string) {
  return !!(await env.DB.prepare(`SELECT 1 AS ok FROM workspace_members WHERE workspace_id = ? AND person_id = ? AND status = 'active'`).bind(workspaceId, personId).first())
}

export async function isActiveVentureMember(env: Env, ventureId: string, personId: string) {
  return !!(await env.DB.prepare(`SELECT 1 AS ok FROM venture_members WHERE venture_id = ? AND person_id = ? AND status = 'active' LIMIT 1`).bind(ventureId, personId).first())
}

export const DATE = /^\d{4}-\d{2}-\d{2}$/
