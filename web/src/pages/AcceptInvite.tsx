import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBox, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useApi } from '../lib/hooks'

/** Token is read from the URL fragment (never sent to servers in logs/referrers) and only used on explicit click. */
export default function AcceptInvitePage() {
  const api = useApi()
  const [token] = useState(() => window.location.hash.replace(/^#/, ''))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const [done, setDone] = useState<{ workspace: { id: string; name: string }; role: string } | null>(null)

  async function accept() {
    setBusy(true); setErr(null)
    try {
      const r = await api.post<{ workspace: { id: string; name: string }; role: string }>('/invitations/accept', { token })
      history.replaceState(null, '', '/invite')
      setDone(r)
    } catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Undangan workspace" />
      {done ? (
        <div className="card space-y-3">
          <p className="text-slate-200">Anda sekarang anggota <strong>{done.workspace.name}</strong> sebagai <code>{done.role}</code>.</p>
          <Link className="btn-primary" to={`/w/${done.workspace.id}`}>Buka workspace</Link>
        </div>
      ) : (
        <div className="card space-y-4">
          {!token && <p className="text-amber-300">Tautan undangan tidak berisi token.</p>}
          <p className="text-sm text-slate-300">Menerima undangan adalah keputusan sukarela Anda. Ini hanya memberi akses kerja sesuai peran — <strong>bukan</strong> kepemilikan, investasi, kemitraan, atau komitmen keuangan. Anda bisa keluar kapan saja.</p>
          <ErrorBox error={err} />
          <button className="btn-primary" disabled={!token || busy} onClick={accept}>{busy ? 'Memproses…' : 'Saya setuju, terima undangan'}</button>
        </div>
      )}
    </div>
  )
}
