import { Link } from 'react-router-dom'
import { ActionForm, DataTable, Section, useRunner } from '../components/kit'
import { ErrorBox, Loading, PageHeader } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Rows = Record<string, unknown>[]

export default function MePage() {
  const n = useLoad((a) => a.get<{ notifications: Rows }>('/me/notifications'), [])
  const as = useLoad((a) => a.get<{ assignments: Rows }>('/me/assignments'), [])
  const dr = useLoad((a) => a.get<{ requests: Rows }>('/me/data-requests'), [])
  const reload = async () => { await Promise.all([n.reload(), as.reload(), dr.reload()]) }
  const r = useRunner(reload)
  async function exportData() {
    const d = await n.api.get<unknown>('/me/export')
    const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `maelvyn-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url)
  }
  if (n.loading && !n.data) return <Loading />
  const unread = (n.data?.notifications ?? []).filter((x) => !x.read_at)
  return (
    <div className="space-y-8">
      <PageHeader title="Saya" subtitle="Notifikasi hanya di dalam aplikasi (tidak ada email/SMS keluar). Penugasan venture baru berlaku setelah Anda menerimanya." />
      <ErrorBox error={n.error} /><r.ErrorView />
      <Section title="Penugasan venture">
        <DataTable rows={as.data?.assignments ?? []} cols={[{ key: 'venture_name', label: 'Venture', render: (x) => <Link className="text-sky-300 hover:underline" to={`/w/${x.workspace_id}/v/${x.venture_id}`}>{String(x.venture_name)}</Link> }, { key: 'role_label', label: 'Peran' }, { key: 'scope_description', label: 'Lingkup' }, { key: 'reason', label: 'Alasan' }, { key: 'proposed_by', label: 'Diusulkan oleh' }, { key: 'status', label: 'Status' },
          { key: 'act', label: '', render: (x) => x.status === 'proposed' && <span className="flex gap-2">
            <button className="btn-primary py-1" disabled={r.busy} onClick={() => void r.run(() => as.api.post(`/me/assignments/${x.id}/respond`, { decision: 'accept' }))}>Terima</button>
            <button className="btn-ghost py-1" disabled={r.busy} onClick={() => void r.run(() => as.api.post(`/me/assignments/${x.id}/respond`, { decision: 'decline' }))}>Tolak</button></span> }]} empty="Tidak ada penugasan." />
      </Section>
      <Section title={`Notifikasi (${unread.length} belum dibaca)`} actions={unread.length > 0 && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => void r.run(() => n.api.post('/me/notifications/read', { all: true }))}>Tandai semua dibaca</button>}>
        <DataTable rows={n.data?.notifications ?? []} cols={[{ key: 'created_at', label: 'Waktu' }, { key: 'kind', label: 'Jenis' }, { key: 'title', label: 'Judul', render: (x) => x.link ? <Link className="text-sky-300 hover:underline" to={String(x.link)}>{String(x.title)}</Link> : String(x.title) }, { key: 'read_at', label: 'Dibaca' }]} empty="Tidak ada notifikasi." />
      </Section>
      <Section title="Data pribadi">
        <button className="btn-ghost" onClick={() => void r.run(exportData)}>Unduh ekspor data saya (JSON)</button>
        <DataTable rows={dr.data?.requests ?? []} cols={[{ key: 'request_type', label: 'Jenis' }, { key: 'note', label: 'Catatan' }, { key: 'status', label: 'Status' }, { key: 'resolution', label: 'Resolusi' }, { key: 'created_at', label: 'Dibuat' }]} empty="Belum ada permintaan." />
        <ActionForm title="Ajukan permintaan data" note="Ditinjau oleh Platform Owner. Penghapusan tunduk pada kewajiban pencatatan (audit & ledger bersifat append-only)." fields={[{ name: 'request_type', label: 'Jenis', type: 'select', options: ['export', 'correction', 'deletion'] }, { name: 'note', label: 'Catatan', type: 'textarea' }]} submit={(b) => dr.api.post('/me/data-requests', b)} onDone={reload} />
      </Section>
    </div>
  )
}
