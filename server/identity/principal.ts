import type { Env, Principal } from '../env'
import { newId, nowIso } from '../lib/http'
import type { IdentityProfile, ProfileLookup, VerifiedIdentity } from './clerk'

type PersonRow = { id: string; display_name: string; contact_email: string | null; email_verified: number }

/**
 * Maps a verified external identity to an internal ACCOUNT. First sign-in creates the account record only:
 * it never creates a platform role, workspace membership or venture assignment.
 */
export async function resolvePrincipal(env: Env, identity: VerifiedIdentity, lookup: ProfileLookup): Promise<Principal> {
  const sel = () => env.DB.prepare(
    `SELECT p.id, p.display_name, p.contact_email, p.email_verified FROM identity_links l JOIN people p ON p.id = l.person_id WHERE l.provider = ? AND l.provider_subject = ?`,
  ).bind(identity.provider, identity.subject).first<PersonRow>()
  let row = await sel()
  if (row) {
    if (!row.contact_email) {
      const prof = await lookup(identity.subject)
      if (prof?.primaryEmail) row = await applyProfile(env, row.id, prof) ?? row
    }
    return toPrincipal(row, identity.subject)
  }
  const prof = await lookup(identity.subject)
  const ts = nowIso()
  const personId = newId('per')
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO people (id, display_name, contact_email, email_verified, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
      .bind(personId, prof?.displayName ?? `User ${identity.subject.slice(-6)}`, prof?.primaryEmail ?? null, prof?.emailVerified ? 1 : 0, ts, ts),
    env.DB.prepare(`INSERT OR IGNORE INTO identity_links (id, person_id, provider, provider_subject, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(newId('idl'), personId, identity.provider, identity.subject, ts),
  ])
  row = await sel()
  return toPrincipal(row!, identity.subject)
}

function toPrincipal(r: PersonRow, subject: string): Principal {
  return { personId: r.id, subject, displayName: r.display_name, email: r.contact_email, emailVerified: r.email_verified === 1 }
}

export async function applyProfile(env: Env, personId: string, prof: IdentityProfile): Promise<PersonRow | null> {
  await env.DB.prepare(`UPDATE people SET contact_email = ?, email_verified = ?, display_name = COALESCE(?, display_name), updated_at = ? WHERE id = ?`)
    .bind(prof.primaryEmail, prof.emailVerified ? 1 : 0, prof.displayName, nowIso(), personId).run()
  return env.DB.prepare(`SELECT id, display_name, contact_email, email_verified FROM people WHERE id = ?`).bind(personId).first<PersonRow>()
}
