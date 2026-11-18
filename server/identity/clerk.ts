import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { Env } from '../env'
import { AppError } from '../lib/http'

export type VerifiedIdentity = { provider: 'clerk'; subject: string; sessionId?: string }
export type TokenVerifier = (token: string, env: Env) => Promise<VerifiedIdentity>
/** Server-side identity profile. Email is only trusted when the provider marks it verified. */
export type IdentityProfile = { displayName: string | null; primaryEmail: string | null; emailVerified: boolean }
export type ProfileLookup = (subject: string) => Promise<IdentityProfile | null>

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

/** Production must have a non-empty explicit authorized-party allowlist and a matching azp claim. */
export function assertAuthorizedParty(azp: string | undefined, env: Pick<Env, 'APP_ENV' | 'CLERK_AUTHORIZED_PARTIES'>): void {
  const allowed = (env.CLERK_AUTHORIZED_PARTIES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (env.APP_ENV === 'production' && (allowed.length === 0 || !azp || !allowed.includes(azp))) {
    throw new AppError('UNAUTHENTICATED', 'Session token was issued for an unauthorized origin.')
  }
  if (azp && allowed.length > 0 && !allowed.includes(azp)) {
    throw new AppError('UNAUTHENTICATED', 'Session token was issued for an unauthorized origin.')
  }
}

/**
 * Verifies a Clerk session JWT server-side: signature (RS256 via JWKS), issuer, exp/nbf, and `azp`
 * against the authorized-party allowlist. A valid session proves identity only — it grants no access.
 */
export const verifyClerkToken: TokenVerifier = async (token, env) => {
  if (!env.CLERK_ISSUER || !env.CLERK_JWKS_URL) throw new AppError('UNAUTHENTICATED', 'Identity provider is not configured.')
  if (env.APP_ENV === 'production' && env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
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
  assertAuthorizedParty(azp, env)
  if (!payload.sub) throw new AppError('UNAUTHENTICATED', 'Session token has no subject.')
  return { provider: 'clerk', subject: payload.sub, sessionId: typeof payload.sid === 'string' ? payload.sid : undefined }
}

/** Reads name + primary email (and its verification status) from the Clerk Backend API. */
export async function fetchClerkProfile(env: Env, subject: string): Promise<IdentityProfile | null> {
  if (!env.CLERK_SECRET_KEY) return null
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(subject)}`, { headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` } })
    if (!res.ok) return null
    const u = (await res.json()) as {
      first_name?: string | null; last_name?: string | null; username?: string | null; primary_email_address_id?: string | null
      email_addresses?: Array<{ id: string; email_address: string; verification?: { status?: string } | null }>
    }
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || ''
    const primary = u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
    return {
      displayName: name ? name.slice(0, 80) : null,
      primaryEmail: primary ? primary.email_address.toLowerCase() : null,
      emailVerified: primary?.verification?.status === 'verified',
    }
  } catch { return null }
}
