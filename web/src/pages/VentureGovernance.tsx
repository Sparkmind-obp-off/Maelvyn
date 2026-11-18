import { useParams } from 'react-router-dom'
import { ActionForm, DataTable, Section, useRunner, type Field } from '../components/kit'
import { Badge, ErrorBox, fmtDate, Loading } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Charter = { id: string; version: number; status: string; content: Record<string, string>; created_at: string }
type Lifecycle = { stage: string; status: string; options: { to_stage: string; gate_failures: string[] }[]; history: Record<string, unknown>[] }

const CHARTER_FIELDS: Field[] = ([
  ['problem', 'Masalah (min. 10 karakter)'], ['customer', 'Pelanggan'], ['offer', 'Penawaran'], ['value_proposition', 'Proposisi nilai'],
  ['evidence_and_assumptions', 'Bukti & asumsi'], ['business_model', 'Model bisnis'], ['scope_and_exclusions', 'Lingkup & pengecualian'],
  ['milestones_and_metrics', 'Milestone & metrik'], ['accountable_operator', 'Operator yang akuntabel'], ['contributors_and_roles', 'Kontributor & peran'],
  ['contribution_and_ip_treatment', 'Perlakuan kontribusi & IP'], ['budget_and_spending_controls', 'Anggaran & kontrol belanja'],
  ['risks_and_compliance', 'Risiko & kepatuhan'], ['exit_pause_conditions', 'Kondisi exit/jeda'],
] as [string, string][]).map(([name, label]) => ({ name, label, type: 'textarea' as const, required: true }))
CHARTER_FIELDS.push({ name: 'review_date', label: 'Tanggal review', type: 'date', required: true })

export default function VentureGovernance() {
  const { vid } = useParams()
  const ch = useLoad((a) => a.get<{ charters: Charter[] }>(`/ventures/${vid}/charters`), [vid])
  const lc = useLoad((a) => a.get<Lifecycle>(`/ventures/${vid}/lifecycle`), [vid])
  const reload = async () => { await Promise.all([ch.reload(), lc.reload()]) }
  const r = useRunner(reload)
  if ((ch.loading && !ch.data) || (lc.loading && !lc.data)) return <Loading />
  const draft = ch.data?.charters.find((c) => c.status === 'draft')
  const open = ch.data?.charters.some((c) => ['draft', 'submitted'].includes(c.status))
  return (
    <div className="space-y-8">
      <ErrorBox error={ch.error ?? lc.error} /><r.ErrorView />
      <Section title="Lifecycle & stage gate">
        <p className="text-sm text-slate-300">Tahap saat ini: <Badge value={lc.data?.stage} /> <Badge value={lc.data?.status} /></p>
        <p className="text-xs text-slate-500">Perpindahan tahap selalu melalui approval manusia. build/launch/operate/scale membutuhkan charter & anggaran yang disetujui; launch+ juga butuh bukti nyata (brief live yang diterima atau eksperimen selesai) dan tidak ada risiko kritis terbuka.</p>
        <ul className="grid gap-2 sm:grid-cols-2">{lc.data?.options.map((o) => (
          <li key={o.to_stage} className="card flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between"><span className="text-sm text-white">→ {o.to_stage}</span>
              <button className="btn-ghost py-1" disabled={r.busy || o.gate_failures.length > 0} onClick={() => { const why = r.ask(`Alasan pindah ke ${o.to_stage}:`); if (why) void r.run(() => lc.api.post(`/ventures/${vid}/stage-requests`, { to_stage: o.to_stage, rationale: why })) }}>Ajukan</button></div>
            {o.gate_failures.length > 0 && <ul className="list-disc pl-5 text-xs text-orange-300">{o.gate_failures.map((g) => <li key={g}>{g}</li>)}</ul>}
          </li>))}</ul>
        <DataTable rows={lc.data?.history ?? []} cols={[{ key: 'from_stage', label: 'Dari' }, { key: 'to_stage', label: 'Ke' }, { key: 'changed_at', label: 'Waktu' }, { key: 'approval_request_id', label: 'Approval' }]} empty="Belum ada perpindahan tahap." />
      </Section>

      <Section title="Charter venture">
        {ch.data?.charters.map((c) => (
          <details key={c.id} className="card" open={c.status === 'draft' || c.status === 'submitted'}>
            <summary className="cursor-pointer text-sm text-white">Versi {c.version} <Badge value={c.status} /> <span className="text-xs text-slate-500">{fmtDate(c.created_at)}</span></summary>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(c.content).map(([k, v]) => <div key={k}><dt className="text-xs uppercase text-slate-500">{k.replace(/_/g, ' ')}</dt><dd className="whitespace-pre-wrap text-slate-200">{v}</dd></div>)}</dl>
            {c.status === 'draft' && <button className="btn-primary mt-3" disabled={r.busy} onClick={() => { const why = r.ask('Alasan pengajuan approval charter:'); if (why) void r.run(() => ch.api.post(`/charters/${c.id}/submit`, { rationale: why })) }}>Ajukan untuk approval</button>}
          </details>
        ))}
        {!open && <ActionForm title="Draft charter baru" fields={CHARTER_FIELDS} cta="Simpan draft" note="Charter tidak berlaku sebelum disetujui oleh approver yang berwenang (bukan pengaju)." submit={(b) => ch.api.post(`/ventures/${vid}/charters`, b)} onDone={reload} />}
        {draft && <p className="text-xs text-slate-500">Draft v{draft.version} sedang terbuka — ajukan atau tunggu keputusan sebelum membuat versi baru.</p>}
      </Section>
    </div>
  )
}
