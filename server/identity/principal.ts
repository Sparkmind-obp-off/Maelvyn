import type { Env, Principal } from '../env'
import { newId, nowIso } from '../lib/http'
import type { VerifiedIdentity } from './clerk'

/**
 * Maps an external identity (provider + subject) to an internal person.
 * First sign-in provisions a person record only; it grants no memberships.
 */
export async function resolvePrincipal(
  env: Env, identity: VerifiedIdentity, lookupName: (subject: string) => Promise<string | null>,
): Promise<Principal> {
  const row = await env.DB.prepare(
    `SELECT p.id, p.display_name, p.status FROM identity_links l JOIN people p ON p.id = l.person_id
     WHERE l.provider = ? AND l.provider_subject = ?`,
  ).bind(identity.provider, identity.subject).first<{ id: string; display_name: string; status: string }>()
  if (row) return { personId: row.id, subject: identity.subject, displayName: row.display_name }

  const personId = newId('per')
  const ts = nowIso()
  const name = (await lookupName(identity.subject)) ?? `Dev user ${identity.subject.slice(-6)}`
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO people (id, display_name, contact_email, status, created_at, updated_at) VALUES (?, ?, NULL, 'active', ?, ?)`)
      .bind(personId, name, ts, ts),
    env.DB.prepare(`INSERT OR IGNORE INTO identity_links (id, person_id, provider, provider_subject, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(newId('idl'), personId, identity.provider, identity.subject, ts),
  ])
  // Re-read in case of a concurrent first login race.
  const final = await env.DB.prepare(
    `SELECT p.id, p.display_name FROM identity_links l JOIN people p ON p.id = l.person_id WHERE l.provider = ? AND l.provider_subject = ?`,
  ).bind(identity.provider, identity.subject).first<{ id: string; display_name: string }>()
  return { personId: final!.id, subject: identity.subject, displayName: final!.display_name }
}
