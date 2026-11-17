import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { Env } from '../env'
import { AppError } from '../lib/http'

export type VerifiedIdentity = { provider: 'clerk'; subject: string; sessionId?: string }
export type TokenVerifier = (token: string, env: Env) => Promise<VerifiedIdentity>

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

/**
 * Verifies a Clerk session JWT server-side (networkless after JWKS fetch):
 * signature (RS256 via JWKS), issuer, exp/nbf, and `azp` against the authorized-party allowlist.
 * A valid Clerk session only proves identity — it grants NO workspace/venture access by itself.
 */
export const verifyClerkToken: TokenVerifier = async (token, env) => {
  if (!env.CLERK_ISSUER || !env.CLERK_JWKS_URL) {
    throw new AppError('UNAUTHENTICATED', 'Identity provider is not configured.')
  }
  if (env.APP_ENV === 'production' && env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
    // Guard: Clerk Development keys must never back a production environment.
    throw new AppError('UNAUTHENTICATED', 'Development identity keys are not permitted in production.')
  }
  let jwks = jwksCache.get(env.CLERK_JWKS_URL)
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(env.CLERK_JWKS_URL))
    jwksCache.set(env.CLERK_JWKS_URL, jwks)
  }
  let payload: JWTPayload
  try {
    ;({ payload } = await jwtVerify(token, jwks, { issuer: env.CLERK_ISSUER, algorithms: ['RS256'], clockTolerance: 5 }))
  } catch {
    throw new AppError('UNAUTHENTICATED', 'Session token is invalid or expired.')
  }
  const azp = typeof payload.azp === 'string' ? payload.azp : undefined
  const allowed = (env.CLERK_AUTHORIZED_PARTIES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (azp && allowed.length > 0 && !allowed.includes(azp)) {
    throw new AppError('UNAUTHENTICATED', 'Session token was issued for an unauthorized origin.')
  }
  if (!payload.sub) throw new AppError('UNAUTHENTICATED', 'Session token has no subject.')
  return { provider: 'clerk', subject: payload.sub, sessionId: typeof payload.sid === 'string' ? payload.sid : undefined }
}

/** Optional display-name lookup via Clerk Backend API. Stores no email (data minimisation). */
export async function fetchClerkDisplayName(env: Env, subject: string): Promise<string | null> {
  if (!env.CLERK_SECRET_KEY) return null
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(subject)}`, {
      headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` },
    })
    if (!res.ok) return null
    const u = (await res.json()) as { first_name?: string | null; last_name?: string | null; username?: string | null }
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || ''
    return name ? name.slice(0, 80) : null
  } catch { return null }
}
