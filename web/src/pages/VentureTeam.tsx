import { useParams } from 'react-router-dom'
import { ActionForm, DataTable, Section, useRunner } from '../components/kit'
import { ErrorBox, Loading } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Assignment = Record<string, unknown> & { id: string; person_id: string; status: string }

export default function VentureTeam() {
  const { wid, vid } = useParams()
  const a = useLoad((x) => x.get<{ assignments: Assignment[] }>(`/ventures/${vid}/assignments`), [vid])
  const mem = useLoad((x) => x.get<{ me: string; members: { person_id: string; display_name: string; role: string }[] }>(`/workspaces/${wid}/members`), [wid])
  const r = useRunner(a.reload)
  if (a.loading && !a.data) return <Loading />
  if (a.error) return <ErrorBox error={a.error} />
  const me = mem.data?.me
  return (
    <div className="space-y-6">
      <r.ErrorView />
      <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">Akses venture terpisah dari keanggotaan workspace. Penugasan untuk orang lain berstatus <em>proposed</em> sampai orang tersebut menerimanya sendiri (halaman "Saya"). Menugaskan diri sendiri langsung aktif dan tercatat di audit.</p>
      <Section title="Penugasan venture">
        <DataTable rows={a.data!.assignments} cols={[{ key: 'display_name', label: 'Orang' }, { key: 'role_label', label: 'Peran' }, { key: 'scope_description', label: 'Lingkup' }, { key: 'reason', label: 'Alasan' }, { key: 'proposed_by', label: 'Diusulkan oleh' }, { key: 'status', label: 'Status' }, { key: 'accepted_at', label: 'Diterima' },
          { key: 'act', label: '', render: (x) => x.status !== 'ended' && <button className="btn-danger py-1" disabled={r.busy} onClick={() => { const why = r.ask(x.person_id === me ? 'Alasan mengakhiri penugasan Anda:' : 'Alasan mengakhiri penugasan:'); if (why) void r.run(() => a.api.post(`/ventures/${vid}/assignments/${x.id}/end`, { reason: why })) }}>Akhiri</button> }]} />
      </Section>
      <ActionForm title="Usulkan penugasan" fields={[
        { name: 'person_id', label: 'Anggota workspace', type: 'select', options: (mem.data?.members ?? []).map((m) => ({ value: m.person_id, label: `${m.display_name} (${m.role})` })) },
        { name: 'role_label', label: 'Label peran', defaultValue: 'contributor', required: true, help: 'huruf kecil, mis. contributor, operator, analyst' },
        { name: 'scope_description', label: 'Lingkup', wide: true }, { name: 'reason', label: 'Alasan', required: true, wide: true },
      ]} submit={(b) => a.api.post(`/ventures/${vid}/assignments`, b)} onDone={() => void a.reload()} />
    </div>
  )
}
