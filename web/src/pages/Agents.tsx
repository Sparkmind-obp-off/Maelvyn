import { Badge, ErrorBox, Loading, PageHeader } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Agent = { id: string; display_name: string; purpose: string; specialist_role: string; status: string; version: string; autonomy_level: string; tool_allowlist: string[]; data_classes: string[]; max_task_credits: number }

export default function AgentsPage() {
  const { data, error, loading } = useLoad((a) => a.get<{ agents: Agent[] }>('/agents'), [])
  if (loading && !data) return <Loading />
  return (
    <div>
      <PageHeader title="Registry agen" subtitle="Hanya agen terdaftar yang dapat dijalankan. Agen tidak dapat memperluas izinnya sendiri atau menyetujui hasilnya sendiri." />
      <ErrorBox error={error} />
      <div className="grid gap-4 md:grid-cols-2">
        {data?.agents.map((a) => (
          <article key={a.id} className="card space-y-2">
            <div className="flex items-center justify-between"><h2 className="font-medium text-white">{a.display_name}</h2><Badge value={a.status} /></div>
            <p className="text-sm text-slate-400">{a.purpose}</p>
            <dl className="grid grid-cols-2 gap-1 text-xs text-slate-400">
              <dt>Versi</dt><dd className="font-mono text-slate-200">{a.id}@{a.version}</dd>
              <dt>Peran spesialis</dt><dd className="text-slate-200">{a.specialist_role}</dd>
              <dt>Otonomi</dt><dd className="text-slate-200">{a.autonomy_level} (Prepare — draft saja)</dd>
              <dt>Tool allowlist</dt><dd className="text-slate-200">{a.tool_allowlist.join(', ')}</dd>
              <dt>Kelas data</dt><dd className="text-slate-200">{a.data_classes.join(', ')}</dd>
              <dt>Maks kredit/tugas</dt><dd className="text-slate-200">{a.max_task_credits}</dd>
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
