import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

const ROLES = ['workspace_admin', 'governance_approver', 'venture_operator', 'finance_operator', 'viewer']
type Member = { person_id: string; display_name: string; role: string; status: string; created_at: string }
type Invitation = { id: string; role: string; venture_name: string | null; note: string | null; status: string; expires_at: string; accepted_by: string | null; created_at: string }
type Resp = { role: string; me: string; members: Member[]; invitations: Invitation[] }
type Venture = { id: string; name: string }

export default function MembersPage() {
  const { wid } = useParams()
  const m = useLoad((a) => a.get<Resp>(`/workspaces/${wid}/members`), [wid])
  const vs = useLoad((a) => a.get<{ ventures: Venture[] }>(`/workspaces/${wid}/ventures`), [wid])
  const [form, setForm] = useState({ role: 'viewer', venture_id: '', note: '', expires_in_days: 7 })
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
      const r = await m.api.post<{ token: string }>(`/workspaces/${wid}/invitations`, { role: form.role, venture_id: form.venture_id || undefined, note: form.note || undefined, expires_in_days: form.expires_in_days })
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
      <PageHeader title="Anggota" subtitle="Keanggotaan hanya aktif setelah undangan diterima sendiri oleh orang yang diundang. Keanggotaan bukan kepemilikan dan tidak memberi hak ekonomi apa pun." />
      <ErrorBox error={err} />
      <section aria-labelledby="members-h">
        <h2 id="members-h" className="mb-3 font-medium text-white">Anggota aktif ({m.data!.members.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-3">Nama</th><th className="p-3">Peran</th><th className="p-3">Sejak</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>{m.data!.members.map((x) => {
            const self = x.person_id === m.data!.me
            return (
              <tr key={x.person_id} className="border-t border-slate-800">
                <td className="p-3">{x.display_name}{self && <span className="ml-2 text-xs text-slate-500">(Anda)</span>}</td>
                <td className="p-3">{isAdmin && !self
                  ? <select aria-label={`Peran ${x.display_name}`} className="input w-48 py-1" value={x.role} disabled={busy} onChange={(e) => changeRole(x.person_id, e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                  : <Badge value={x.role} />}</td>
                <td className="p-3 text-slate-400">{fmtDate(x.created_at)}</td>
                <td className="p-3">{(isAdmin || self) && <button className="btn-danger py-1" disabled={busy} onClick={() => offboard(x.person_id, self)}>{self ? 'Keluar' : 'Offboard'}</button>}</td>
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
            <div><label className="label" htmlFor="inv-v">Akses venture (opsional)</label>
              <select id="inv-v" className="input" value={form.venture_id} onChange={(e) => setForm({ ...form, venture_id: e.target.value })}>
                <option value="">— tidak ada —</option>{vs.data?.ventures.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            <div><label className="label" htmlFor="inv-note">Catatan</label><input id="inv-note" className="input" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
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
                {i.venture_name && <span className="text-slate-400">venture: {i.venture_name}</span>}
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
