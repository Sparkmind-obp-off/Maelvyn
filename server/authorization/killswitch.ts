import type { Env } from '../env'
import { AppError } from '../lib/http'

/** Checks system, workspace, agent and provider kill switches. Engaged = execution refused. */
export async function assertNotKilled(env: Env, workspaceId: string, keys: string[]) {
  if (env.SYSTEM_KILL_SWITCH === 'true') throw new AppError('KILL_SWITCH_ENGAGED', 'System kill switch is engaged.', { switch: 'system' })
  const all = ['all', ...keys]
  const placeholders = all.map(() => '?').join(',')
  const row = await env.DB.prepare(
    `SELECT switch_key FROM kill_switches WHERE workspace_id = ? AND engaged = 1 AND switch_key IN (${placeholders}) LIMIT 1`,
  ).bind(workspaceId, ...all).first<{ switch_key: string }>()
  if (row) throw new AppError('KILL_SWITCH_ENGAGED', `Kill switch '${row.switch_key}' is engaged.`, { switch: row.switch_key })
}
