import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DataTable, Section, useRunner } from '../components/kit'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Approval = { id: string; venture_name: string | null; request_type: string; title: string; rationale: string; status: string; required_approvals: number; approvals: number; expires_at: string; requested_by: string; my_vote: string | null; my_conflict: number | null; can_vote: boolean; can_withdraw: boolean; closed_reason: string | null; payload: Record<string, unknown> }
type Member = { person_id: string; display_name: string; role: string; venture_assignments: number; last_activity: string | null; review_date: string | null }

export default function GovernancePage() {
  const { wid } = useParams()
  const [status, setStatus] = useState('submitted')
  const ap = useLoad((a) => a.get<{ role: string; approvals: Approval[] }>(`/workspaces/${wid}/approvals?status=${status}`), [wid, status])
  const dec = useLoad((a) => a.get<{ decisions: Record<string, unknown>[] }>(`/workspaces/${wid}/decisions`), [wid])
  const isAdmin = ap.data?.role === 'workspace_admin'
  const ar = useLoad((a) => isAdmin ? a.get<{ members: Member[]; reviews: Record<string, unknown>[] }>(`/workspaces/${wid}/access-review`) : Promise.resolve(null), [wid, isAdmin])
  const reload = async () => { await Promise.all([ap.reload(), dec.reload(), ar.reload()]) }
  const r = useRunner(reload)
  const [findings, setFindings] = useState<Record<string, string>>({})

  const vote = (id: string, decision: string) => {
    const rationale = decision === 'approve' ? (window.prompt('Catatan persetujuan (opsional):') ?? '') : r.ask('Alasan penolakan (wajib):')
    if (rationale === null) return
    void r.run(() => ap.api.post(`/approvals/${id}/votes`, { decision, rationale: rationale || undefined }))
  }
  if (ap.loading && !ap.data) return <Loading />
  return (
    <div className="space-y-8">
      <PageHeader title="Governance" subtitle="Hal-hal yang dicadangkan (charter, tahap, anggaran, kontribusi, perjanjian, kepemilikan, pelepasan aset) hanya berlaku setelah approval manusia. Pengaju dan subjek tidak dapat memberi suara; deklarasi konflik mengecualikan pemberi suara; satu penolakan menolak permintaan." />
      <ErrorBox error={ap.error} /><r.ErrorView />
      <Section title="Kotak approval" actions={
        <select aria-label="Filter status" className="input w-48 py-1" value={status} onChange={(e) => setStatus(e.target.value)}>{['submitted', 'approved', 'rejected', 'superseded', 'cancelled', 'all'].map((s) => <option key={s}>{s}</option>)}</select>}>
        <ul className="space-y-3">{ap.data?.approvals.map((a) => (
          <li key={a.id} className="card space-y-2 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2"><Badge value={a.status} /><span className="text-white">{a.title}</span><span className="text-xs text-slate-500">{a.request_type}{a.venture_name ? ` · ${a.venture_name}` : ''}</span>
              <span className="ml-auto text-xs text-slate-400">{a.approvals}/{a.required_approvals} setuju · kedaluwarsa {fmtDate(a.expires_at)}</span></div>
            <p className="text-slate-300">{a.rationale}</p>
            <p className="text-xs text-slate-500">Diajukan oleh {a.requested_by}{a.my_vote ? ` · suara Anda: ${a.my_vote}` : ''}{a.my_conflict ? ' · Anda mendeklarasikan konflik' : ''}{a.closed_reason ? ` · ${a.closed_reason}` : ''}</p>
            {a.status === 'submitted' && <div className="flex flex-wrap gap-2">
              {a.can_vote && <><button className="btn-primary py-1" disabled={r.busy} onClick={() => vote(a.id, 'approve')}>Setujui</button>
                <button className="btn-danger py-1" disabled={r.busy} onClick={() => vote(a.id, 'reject')}>Tolak</button>
                <button className="btn-ghost py-1" disabled={r.busy} onClick={() => vote(a.id, 'abstain')}>Abstain</button></>}
              {!a.my_conflict && !a.can_withdraw && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => { const d = r.ask('Jelaskan konflik kepentingan Anda:'); if (d) void r.run(() => ap.api.post(`/approvals/${a.id}/conflicts`, { description: d })) }}>Deklarasikan konflik</button>}
              {a.can_withdraw && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => { const d = r.ask('Alasan penarikan:'); if (d) void r.run(() => ap.api.post(`/approvals/${a.id}/withdraw`, { reason: d })) }}>Tarik permintaan</button>}
              {!a.can_vote && !a.can_withdraw && <span className="text-xs text-slate-500">Anda tidak memenuhi syarat untuk memberi suara pada permintaan ini.</span>}
            </div>}
          </li>))}{ap.data?.approvals.length === 0 && <li className="text-sm text-slate-500">Tidak ada permintaan dengan status ini.</li>}</ul>
      </Section>

      <Section title="Register keputusan">
        <DataTable rows={dec.data?.decisions ?? []} cols={[{ key: 'decided_at', label: 'Waktu' }, { key: 'title', label: 'Judul' }, { key: 'decision_type', label: 'Jenis' }, { key: 'venture_name', label: 'Venture' }, { key: 'outcome', label: 'Hasil' }, { key: 'summary', label: 'Ringkasan' },
          { key: 'authority', label: 'Otoritas', render: (x) => { const au = x.authority as { required_approvals: number; votes: { decision: string }[] }; return <span className="text-xs text-slate-400">{au.votes?.length ?? 0} suara / butuh {au.required_approvals}</span> } }]} empty="Belum ada keputusan." />
      </Section>

      {isAdmin && ar.data && (
        <Section title="Access review">
          <p className="text-xs text-slate-500">Tinjau setiap akses aktif: pertahankan, kurangi, atau cabut. Perubahan aktual dilakukan di halaman Anggota; hasil review dicatat append-only.</p>
          <DataTable rows={ar.data.members as unknown as Record<string, unknown>[]} cols={[{ key: 'display_name', label: 'Anggota' }, { key: 'role', label: 'Peran' }, { key: 'venture_assignments', label: 'Penugasan' }, { key: 'last_activity', label: 'Aktivitas terakhir', render: (x) => fmtDate(x.last_activity) }, { key: 'review_date', label: 'Tanggal review' },
            { key: 'outcome', label: 'Hasil', render: (x) => <select aria-label={`Hasil review ${x.display_name}`} className="input py-1" value={findings[String(x.person_id)] ?? 'keep'} onChange={(e) => setFindings({ ...findings, [String(x.person_id)]: e.target.value })}>{['keep', 'reduce', 'remove'].map((o) => <option key={o}>{o}</option>)}</select> }]} />
          <button className="btn-primary" disabled={r.busy} onClick={() => { const notes = window.prompt('Catatan review (opsional):') ?? undefined; void r.run(() => ap.api.post(`/workspaces/${wid}/access-reviews`, { findings: ar.data!.members.map((m) => ({ person_id: m.person_id, outcome: findings[m.person_id] ?? 'keep' })), notes: notes || undefined })) }}>Catat access review</button>
          <DataTable rows={ar.data.reviews} cols={[{ key: 'completed_at', label: 'Selesai' }, { key: 'reviewer', label: 'Reviewer' }, { key: 'findings_json', label: 'Temuan', render: (x) => { const f = JSON.parse(String(x.findings_json)) as { outcome: string }[]; return `${f.length} anggota · ${f.filter((y) => y.outcome !== 'keep').length} perlu tindakan` } }, { key: 'notes', label: 'Catatan' }]} empty="Belum ada access review." />
        </Section>
      )}
    </div>
  )
}
