import type { Context } from 'hono'
import type { z } from 'zod'
import type { AppEnv, Principal } from '../env'
import { AppError } from './http'

export async function parseJson<T extends z.ZodType>(c: Context<AppEnv>, schema: T): Promise<z.infer<T>> {
  let body: unknown
  try { body = await c.req.json() } catch { throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON.') }
  const r = schema.safeParse(body)
  if (!r.success) throw new AppError('VALIDATION_ERROR', 'Request validation failed.', { issues: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) })
  return r.data
}

export const principalOf = (c: Context<AppEnv>): Principal => {
  const p = c.get('principal')
  if (!p) throw new AppError('UNAUTHENTICATED', 'Authentication required.')
  return p
}
