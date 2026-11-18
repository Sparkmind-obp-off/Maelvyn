import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

const ROLES = ['governance_approver', 'venture_operator', 'finance_operator', 'viewer']
type Member = { person_id: string; display_name: string; role: string; status: string; created_at: string; venture_assignments: number }
type Invitation = { id: string; role: string; invitee_email: string | null; reason: string | null; owner_authorized: number; review_date: string | null; status: string; expires_at: string; accepted_by: string | null; created_at: string }
type Resp = { role: string; me: string; members: Member[]; invitations: Invitation[] }

export default function MembersPage() {
  const { wid } = useParams()
  const m = useLoad((a) => a.get<Resp>(`/workspaces/${wid}/members`), [wid])
  const [form, setForm] = useState({ role: 'viewer', invitee_email: '', reason: '', review_date: '', expires_in_days: 7, owner_authorization: false })
  const [link, setLink] = useState<string | null>(null)
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const [busy, setBusy] = useState(false)
  const isAdmin = m.data?.role === 'workspace_admin'

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setErr(null)
    try { await fn(); await m.reload() } catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }
  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    await run(async () => {
      const r = await m.api.post<{ token: string }>(`/workspaces/${wid}/invitations`, { role: form.role, invitee_email: form.invitee_email, reason: form.reason, review_date: form.review_date || undefined, expires_in_days: form.expires_in_days, owner_authorization: form.owner_authorization || undefined })
      setLink(`${window.location.origin}/invite#${r.token}`)
    })
  }
  const changeRole = (pid: string, role: string) => {
    const reason = window.prompt('Alasan perubahan peran (wajib, dicatat di audit):')
    if (reason && reason.trim().length >= 3) void run(() => m.api.put(`/workspaces/${wid}/members/${pid}`, { role, reason }))
  }
  const offboard = (pid: string, self: boolean) => {
    const reason = window.prompt(self ? 'Alasan keluar dari workspace:' : 'Alasan offboarding anggota (dicatat di audit):')
    if (reason && reason.trim().length >= 3) void run(() => m.api.post(`/workspaces/${wid}/members/${pid}/offboard`, { reason }))
  }

  if (m.loading && !m.data) return <Loading />
  if (m.error) return <ErrorBox error={m.error} />
  return (
    <div className="space-y-8">
      <PageHeader title="Anggota" subtitle="Hanya Platform Owner yang mengelola keanggotaan. Undangan terikat pada email terverifikasi, harus diterima sendiri, tidak pernah memberi workspace_admin, dan tidak memberi akses venture (itu penugasan terpisah). Keanggotaan bukan kepemilikan." />
      <ErrorBox error={err} />
      <section aria-labelledby="members-h">
        <h2 id="members-h" className="mb-3 font-medium text-white">Anggota aktif ({m.data!.members.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-3">Nama</th><th className="p-3">Peran</th><th className="p-3">Sejak / penugasan</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>{m.data!.members.map((x) => {
            const self = x.person_id === m.data!.me
            return (
              <tr key={x.person_id} className="border-t border-slate-800">
                <td className="p-3">{x.display_name}{self && <span className="ml-2 text-xs text-slate-500">(Anda)</span>}</td>
                <td className="p-3">{isAdmin && !self && x.role !== 'workspace_admin'
                  ? <select aria-label={`Peran ${x.display_name}`} className="input w-48 py-1" value={x.role} disabled={busy} onChange={(e) => changeRole(x.person_id, e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                  : <Badge value={x.role} />}</td>
                <td className="p-3 text-slate-400">{fmtDate(x.created_at)} · {x.venture_assignments} penugasan</td>
                <td className="p-3">{(isAdmin || self) && x.role !== 'workspace_admin' && <button className="btn-danger py-1" disabled={busy} onClick={() => offboard(x.person_id, self)}>{self ? 'Keluar' : 'Offboard'}</button>}</td>
              </tr>
            )
          })}</tbody>
        </table></div>
      </section>

      {isAdmin && (
        <>
          <form onSubmit={createInvite} className="card grid max-w-3xl gap-3 sm:grid-cols-2" aria-labelledby="invite-h">
            <h2 id="invite-h" className="font-medium text-white sm:col-span-2">Buat undangan</h2>
            <div><label className="label" htmlFor="inv-role">Peran</label>
              <select id="inv-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
            <div><label className="label" htmlFor="inv-email">Email terverifikasi penerima *</label><input id="inv-email" type="email" required className="input" value={form.invitee_email} onChange={(e) => setForm({ ...form, invitee_email: e.target.value })} /></div>
            <div><label className="label" htmlFor="inv-reason">Alasan akses *</label><input id="inv-reason" required minLength={3} maxLength={300} className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div><label className="label" htmlFor="inv-review">Tanggal review akses</label><input id="inv-review" type="date" className="input" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2"><input type="checkbox" checked={form.owner_authorization} onChange={(e) => setForm({ ...form, owner_authorization: e.target.checked })} /> Otorisasi eksplisit Owner (wajib untuk akun berkebijakan ACCOUNT_ONLY)</label>
            <div><label className="label" htmlFor="inv-exp">Berlaku (hari)</label><input id="inv-exp" type="number" min={1} max={14} className="input" value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: Number(e.target.value) })} /></div>
            <div className="sm:col-span-2"><button className="btn-primary" disabled={busy}>Buat tautan undangan</button></div>
            {link && (
              <div className="rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm sm:col-span-2">
                <p className="mb-2 text-amber-200">Salin sekarang — tautan ini hanya ditampilkan sekali dan sekali pakai. Kirim sendiri lewat saluran pribadi; MAELVYN tidak mengirim pesan apa pun.</p>
                <div className="flex gap-2"><input readOnly aria-label="Tautan undangan" className="input font-mono text-xs" value={link} onFocus={(e) => e.currentTarget.select()} />
                  <button type="button" className="btn-ghost" onClick={() => navigator.clipboard?.writeText(link)}>Salin</button></div>
              </div>
            )}
          </form>
          <section aria-labelledby="invs-h">
            <h2 id="invs-h" className="mb-3 font-medium text-white">Riwayat undangan</h2>
            <ul className="space-y-2 text-sm">{m.data!.invitations.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
                <Badge value={i.status === 'pending' && i.expires_at < new Date().toISOString() ? 'expired' : i.status} /><Badge value={i.role} />
                <span className="text-slate-300">{i.invitee_email}</span>{i.reason && <span className="text-slate-400">— {i.reason}</span>}{i.owner_authorized ? <Badge value="owner_authorized" /> : null}
                <span className="text-xs text-slate-500">dibuat {fmtDate(i.created_at)} · kedaluwarsa {fmtDate(i.expires_at)}{i.accepted_by ? ` · diterima oleh ${i.accepted_by}` : ''}</span>
                {i.status === 'pending' && <button className="btn-ghost py-1" disabled={busy} onClick={() => run(() => m.api.post(`/workspaces/${wid}/invitations/${i.id}/revoke`))}>Cabut</button>}
              </li>
            ))}{m.data!.invitations.length === 0 && <li className="text-slate-500">Belum ada undangan.</li>}</ul>
          </section>
        </>
      )}
    </div>
  )
}
