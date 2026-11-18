import { useParams } from 'react-router-dom'
import { ActionForm, DataTable, Section, useRunner } from '../components/kit'
import { Badge, ErrorBox, Loading } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Party = { person_id: string; party_role: string; signature_status: string; display_name?: string }
type Agreement = { id: string; title: string; version: string; agreement_type: string; status: string; summary: string; parties: Party[] }
type Member = { person_id: string; display_name: string }
const CONFIRM = 'I have read this agreement and record my own decision'

export default function VentureRights() {
  const { wid, vid } = useParams()
  const ct = useLoad((a) => a.get<{ contributions: Record<string, unknown>[] }>(`/ventures/${vid}/contributions`), [vid])
  const ag = useLoad((a) => a.get<{ agreements: Agreement[] }>(`/ventures/${vid}/agreements`), [vid])
  const ow = useLoad((a) => a.get<{ interests: Record<string, unknown>[]; effective_basis_points: number; note: string }>(`/ventures/${vid}/ownership`), [vid])
  const ip = useLoad((a) => a.get<{ ip_assets: Record<string, unknown>[] }>(`/ventures/${vid}/ip`), [vid])
  const mem = useLoad((a) => a.get<{ me: string; members: Member[] }>(`/workspaces/${wid}/members`), [wid])
  const reload = async () => { await Promise.all([ct.reload(), ag.reload(), ow.reload(), ip.reload()]) }
  const r = useRunner(reload)
  if (ct.loading && !ct.data) return <Loading />
  if (ct.error) return <ErrorBox error={ct.error} />
  const me = mem.data?.me
  const people = (mem.data?.members ?? []).map((m) => ({ value: m.person_id, label: m.display_name }))
  const agOpts = (ag.data?.agreements ?? []).map((a) => ({ value: a.id, label: `${a.title} v${a.version} (${a.status})` }))
  const submit = (path: string, label: string) => { const why = r.ask(label); if (why) void r.run(() => ct.api.post(path, { rationale: why })) }
  return (
    <div className="space-y-8">
      <r.ErrorView />
      <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">Participation by Choice. Ownership by Agreement. Kontribusi tidak otomatis menjadi kepemilikan. Kepemilikan hanya efektif jika didukung perjanjian yang sudah dieksekusi dan disetujui minimal dua approver yang bukan pengaju maupun pemegang. Tidak ada pembagian default.</p>

      <Section title="Kontribusi">
        <DataTable rows={ct.data!.contributions} cols={[{ key: 'contributor', label: 'Kontributor' }, { key: 'contribution_type', label: 'Jenis' }, { key: 'legal_character', label: 'Karakter hukum' }, { key: 'description', label: 'Deskripsi' },
          { key: 'agreed_value_minor', label: 'Nilai', render: (x) => x.agreed_value_minor != null ? `${x.currency} ${Number(x.agreed_value_minor).toLocaleString('id-ID')} (${x.valuation_method})` : '—' }, { key: 'status', label: 'Status' },
          { key: 'act', label: '', render: (x) => x.status === 'proposed' && <span className="flex gap-2">
            <button className="btn-ghost py-1" disabled={r.busy} onClick={() => submit(`/contributions/${x.id}/submit`, 'Alasan pengajuan penerimaan kontribusi:')}>Ajukan</button>
            {x.contributor_person_id === me && <button className="btn-danger py-1" disabled={r.busy} onClick={() => void r.run(() => ct.api.post(`/contributions/${x.id}/withdraw`))}>Tarik</button>}</span> }]} />
        <ActionForm title="Catat kontribusi" fields={[
          { name: 'contribution_type', label: 'Jenis', type: 'select', options: ['cash', 'labor', 'skill', 'technology', 'ip', 'network', 'equipment', 'inventory', 'loan', 'service', 'other'] },
          { name: 'legal_character', label: 'Karakter hukum', type: 'select', options: ['capital', 'loan', 'service_fee', 'reimbursement', 'license', 'sale', 'in_kind_use', 'gift', 'other'] },
          { name: 'description', label: 'Deskripsi', type: 'textarea', required: true },
          { name: 'currency', label: 'Mata uang (jika bernilai)', placeholder: 'IDR' }, { name: 'agreed_value_minor', label: 'Nilai disepakati', type: 'number' },
          { name: 'valuation_method', label: 'Metode valuasi (wajib jika bernilai)', wide: true },
        ]} submit={(b) => ct.api.post(`/ventures/${vid}/contributions`, b)} onDone={reload} />
      </Section>

      <Section title="Perjanjian">
        <ul className="space-y-2">{ag.data?.agreements.map((a) => {
          const mine = a.parties.find((p) => p.person_id === me)
          return (
            <li key={a.id} className="card p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><span className="text-white">{a.title}</span><span className="text-xs text-slate-500">v{a.version} · {a.agreement_type}</span><Badge value={a.status} />
                <span className="ml-auto flex gap-2">
                  {mine?.signature_status === 'pending' && ['draft', 'under_review'].includes(a.status) && <>
                    <button className="btn-primary py-1" disabled={r.busy} onClick={() => { if (window.confirm(`${CONFIRM}?\n\nTanda tangan Anda sendiri dicatat sebagai keputusan pribadi.`)) void r.run(() => ag.api.post(`/agreements/${a.id}/sign`, { decision: 'signed', confirmation: CONFIRM })) }}>Tanda tangani</button>
                    <button className="btn-danger py-1" disabled={r.busy} onClick={() => { if (window.confirm('Tolak perjanjian ini?')) void r.run(() => ag.api.post(`/agreements/${a.id}/sign`, { decision: 'declined', confirmation: CONFIRM })) }}>Tolak</button></>}
                  {a.status === 'draft' && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => submit(`/agreements/${a.id}/submit`, 'Alasan pengajuan eksekusi:')}>Ajukan eksekusi</button>}
                </span></div>
              <p className="mt-1 text-slate-300">{a.summary}</p>
              <p className="mt-1 text-xs text-slate-500">Pihak: {a.parties.map((p) => `${p.display_name ?? p.person_id} (${p.party_role}: ${p.signature_status})`).join(' · ')}</p>
            </li>)
        })}{ag.data?.agreements.length === 0 && <li className="text-sm text-slate-500">Belum ada perjanjian.</li>}</ul>
        <ActionForm title="Draft perjanjian (satu pihak tambahan)" note="MAELVYN tidak membuat dokumen hukum dan tidak menandatangani atas nama siapa pun. Ringkasan di sini merujuk pada dokumen yang ditinjau di luar sistem." fields={[
          { name: 'agreement_type', label: 'Jenis', type: 'select', options: ['participation', 'contribution', 'ownership', 'ip_license', 'loan', 'service', 'asset_transfer', 'other'] },
          { name: 'title', label: 'Judul', required: true }, { name: 'version', label: 'Versi', defaultValue: '1.0', required: true },
          { name: 'party_person_id', label: 'Pihak', type: 'select', options: people }, { name: 'party_role', label: 'Peran pihak', defaultValue: 'party', required: true },
          { name: 'include_me', label: 'Saya juga menjadi pihak', type: 'checkbox', defaultValue: true },
          { name: 'summary', label: 'Ringkasan', type: 'textarea', required: true },
        ]} submit={(b) => {
          const parties = [{ person_id: String(b.party_person_id), party_role: String(b.party_role) }]
          if (b.include_me && me && me !== b.party_person_id) parties.push({ person_id: me, party_role: 'operator' })
          return ag.api.post(`/ventures/${vid}/agreements`, { agreement_type: b.agreement_type, title: b.title, version: b.version, summary: b.summary, parties })
        }} onDone={reload} />
      </Section>

      <Section title="Register kepemilikan">
        <p className="text-sm text-slate-300">Total efektif: <strong>{((ow.data?.effective_basis_points ?? 0) / 100).toFixed(2)}%</strong> <span className="text-xs text-slate-500">{ow.data?.note}</span></p>
        <DataTable rows={ow.data?.interests ?? []} cols={[{ key: 'holder', label: 'Pemegang' }, { key: 'interest_type', label: 'Jenis' }, { key: 'pct', label: '%', render: (x) => x.percentage_basis_points != null ? (Number(x.percentage_basis_points) / 100).toFixed(2) + '%' : String(x.quantity ?? '—') },
          { key: 'agreement_title', label: 'Perjanjian' }, { key: 'agreement_status', label: 'Status perjanjian' }, { key: 'status', label: 'Status' },
          { key: 'act', label: '', render: (x) => x.status === 'proposed' && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => submit(`/ownership/${x.id}/submit`, 'Alasan (butuh ≥2 approver):')}>Ajukan</button> }]} empty="Belum ada kepemilikan tercatat." />
        {agOpts.length > 0 && <ActionForm title="Usulkan kepemilikan" fields={[
          { name: 'holder_person_id', label: 'Pemegang', type: 'select', options: people }, { name: 'agreement_id', label: 'Perjanjian pendukung', type: 'select', options: agOpts },
          { name: 'interest_type', label: 'Jenis', type: 'select', options: ['equity', 'unit', 'revenue_share', 'profit_share', 'other'] },
          { name: 'percentage_basis_points', label: 'Basis poin (100 = 1%)', type: 'number' }, { name: 'quantity', label: 'Kuantitas (alternatif)' }, { name: 'notes', label: 'Catatan' },
        ]} submit={(b) => ow.api.post(`/ventures/${vid}/ownership`, b)} onDone={reload} />}
      </Section>

      <Section title="Register IP">
        <DataTable rows={ip.data?.ip_assets ?? []} cols={[{ key: 'title', label: 'Judul' }, { key: 'ip_type', label: 'Jenis' }, { key: 'provenance', label: 'Asal' }, { key: 'owner_description', label: 'Pemilik' }, { key: 'status', label: 'Status' }]} />
        <ActionForm title="Catat aset IP" fields={[
          { name: 'title', label: 'Judul', required: true }, { name: 'ip_type', label: 'Jenis', type: 'select', options: ['code', 'brand', 'content', 'design', 'data', 'invention', 'other'] },
          { name: 'provenance', label: 'Asal', type: 'select', options: ['created_in_venture', 'contributed', 'licensed_in', 'pre_existing_excluded'] },
          { name: 'owner_description', label: 'Pemilik hukum', required: true }, { name: 'agreement_id', label: 'Perjanjian (wajib untuk contributed/licensed)', type: 'select', options: [{ value: '', label: '— tidak ada —' }, ...agOpts] },
          { name: 'license_terms', label: 'Ketentuan lisensi' },
        ]} submit={(b) => ip.api.post(`/ventures/${vid}/ip`, b)} onDone={reload} />
      </Section>
    </div>
  )
}
