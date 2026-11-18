import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, ErrorBox, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Ws = { id: string; name: string; slug: string; role: string; status: string; is_synthetic: number }
type Session = {
  principal: { display_name: string; email: string | null; email_verified: boolean }
  platform_role: string | null; owner_bound: boolean; can_claim_owner: boolean; account_status: string
  account_policy: { policy: string; reason: string } | null; pending_venture_assignments: number; unread_notifications: number
}

export default function WorkspacesPage() {
  const s = useLoad((a) => a.get<Session>('/session'), [])
  const { data, error, loading, api, reload } = useLoad((a) => a.get<{ workspaces: Ws[] }>('/workspaces'), [])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<ApiRequestError | null>(null)
  const nav = useNavigate()
  const isOwner = s.data?.platform_role === 'platform_owner'

  async function act(fn: () => Promise<unknown>) {
    setBusy(true); setFormErr(null)
    try { await fn() } catch (err) { setFormErr(err as ApiRequestError) } finally { setBusy(false) }
  }
  const create = (e: React.FormEvent) => { e.preventDefault(); void act(async () => { const r = await api.post<{ workspace: Ws }>('/workspaces', { name }); nav(`/w/${r.workspace.id}`) }) }
  const claim = () => void act(async () => { await api.post('/platform/owner/claim'); await Promise.all([s.reload(), reload()]) })

  return (
    <div className="space-y-8">
      <PageHeader title="Workspace" subtitle="Identitas akun, peran platform, dan akses yang di-scope dilaporkan terpisah. Membuat akun tidak pernah memberi keanggotaan." />
      {s.data && (
        <section aria-labelledby="acct-h" className="card space-y-2 text-sm">
          <h2 id="acct-h" className="font-medium text-white">Status akun</h2>
          <p className="text-slate-300">{s.data.principal.display_name} · {s.data.principal.email ?? 'email belum tersedia'} {s.data.principal.email_verified ? <Badge value="verified" /> : <Badge value="UNVERIFIED" />}</p>
          <p className="flex flex-wrap items-center gap-2"><Badge value={s.data.account_status} />{s.data.platform_role && <Badge value={s.data.platform_role} />}{s.data.account_policy && <Badge value={s.data.account_policy.policy} />}</p>
          {s.data.account_status === 'ACCOUNT_ONLY' && <p className="text-slate-400">Akun Anda belum memiliki keanggotaan workspace atau penugasan venture. Akses hanya diberikan lewat undangan eksplisit dari Platform Owner yang Anda terima sendiri.</p>}
          {(s.data.pending_venture_assignments > 0 || s.data.unread_notifications > 0) && <p><Link to="/me" className="text-sky-300 hover:underline">{s.data.pending_venture_assignments} penugasan menunggu · {s.data.unread_notifications} notifikasi belum dibaca →</Link></p>}
          {s.data.can_claim_owner && (
            <div className="rounded-lg border border-sky-800 bg-sky-950/40 p-3">
              <p className="mb-2 text-sky-200">Email primer terverifikasi Anda cocok dengan Platform Owner yang ditetapkan dan belum ada Owner yang terikat. Klaim akan memverifikasi ulang email Anda di server Clerk dan mengikat subject ID Anda secara permanen.</p>
              <button className="btn-primary" disabled={busy} onClick={claim}>Klaim peran Platform Owner</button>
            </div>
          )}
          {isOwner && <p><Link to="/platform" className="text-sky-300 hover:underline">Buka konsol Platform (direktori akun, audit, permintaan data) →</Link></p>}
        </section>
      )}
      <ErrorBox error={error ?? s.error} />
      {loading ? <Loading /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.workspaces.map((w) => (
            <Link key={w.id} to={`/w/${w.id}`} className="card block hover:border-sky-700">
              <div className="flex items-center justify-between"><h2 className="font-medium text-white">{w.name}</h2><Badge value={w.role} /></div>
              <p className="mt-1 text-xs text-slate-500">{w.slug} · {w.is_synthetic ? 'synthetic' : 'real'} · {w.status}</p>
            </Link>
          ))}
          {data?.workspaces.length === 0 && <p className="text-sm text-slate-400">Anda belum menjadi anggota workspace mana pun.</p>}
        </div>
      )}
      <ErrorBox error={formErr} />
      {isOwner && (
        <form onSubmit={create} className="card max-w-lg space-y-3" aria-labelledby="create-ws">
          <h2 id="create-ws" className="font-medium text-white">Buat workspace sintetis (khusus Platform Owner)</h2>
          <label className="label" htmlFor="ws-name">Nama</label>
          <input id="ws-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Studio Sandbox" minLength={3} maxLength={80} required />
          <button className="btn-primary" disabled={busy}>{busy ? 'Membuat…' : 'Buat workspace'}</button>
          <p className="text-xs text-slate-500">Membuat workspace tidak membentuk entitas, kemitraan, atau kepemilikan apa pun.</p>
        </form>
      )}
    </div>
  )
}
