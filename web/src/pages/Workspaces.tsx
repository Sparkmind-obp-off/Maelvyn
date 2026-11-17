import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, ErrorBox, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Ws = { id: string; name: string; slug: string; role: string; status: string; is_synthetic: number }

export default function WorkspacesPage() {
  const { data, error, loading, api } = useLoad((a) => a.get<{ workspaces: Ws[] }>('/workspaces'), [])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<ApiRequestError | null>(null)
  const nav = useNavigate()

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setFormErr(null)
    try {
      const r = await api.post<{ workspace: Ws }>('/workspaces', { name })
      nav(`/w/${r.workspace.id}`)
    } catch (err) { setFormErr(err as ApiRequestError) } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Workspace" subtitle="Workspace pengembangan bersifat sintetis. Membuat workspace tidak membentuk entitas, kemitraan, atau kepemilikan apa pun." />
      <ErrorBox error={error} />
      {loading ? <Loading /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.workspaces.map((w) => (
            <Link key={w.id} to={`/w/${w.id}`} className="card block hover:border-sky-700">
              <div className="flex items-center justify-between"><h2 className="font-medium text-white">{w.name}</h2><Badge value={w.role} /></div>
              <p className="mt-1 text-xs text-slate-500">{w.slug} · {w.is_synthetic ? 'synthetic' : 'real'} · {w.status}</p>
            </Link>
          ))}
          {data?.workspaces.length === 0 && <p className="text-sm text-slate-400">Belum ada workspace. Anda belum menjadi anggota workspace mana pun.</p>}
        </div>
      )}
      <form onSubmit={create} className="card mt-8 max-w-lg space-y-3" aria-labelledby="create-ws">
        <h2 id="create-ws" className="font-medium text-white">Buat sandbox workspace (development)</h2>
        <label className="label" htmlFor="ws-name">Nama</label>
        <input id="ws-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Studio Sandbox" minLength={3} maxLength={80} required />
        <ErrorBox error={formErr} />
        <button className="btn-primary" disabled={busy}>{busy ? 'Membuat…' : 'Buat workspace'}</button>
      </form>
    </div>
  )
}
