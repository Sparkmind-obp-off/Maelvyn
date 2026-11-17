import { ClerkProvider } from '@clerk/clerk-react'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

type PublicConfig = { environment: string; clerk_publishable_key: string | null; identity_instance: string; data_policy: string }

function Boot() {
  const [cfg, setCfg] = useState<PublicConfig | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/v1/config').then((r) => r.json()).then(setCfg).catch(() => setErr('Tidak dapat memuat konfigurasi.'))
  }, [])
  if (err) return <p className="p-8 text-rose-300">{err}</p>
  if (!cfg) return <p className="p-8 text-slate-400">Memuat MAELVYN…</p>
  if (!cfg.clerk_publishable_key) return <p className="p-8 text-amber-300">Identity provider belum dikonfigurasi.</p>
  return (
    <ClerkProvider publishableKey={cfg.clerk_publishable_key} afterSignOutUrl="/">
      <BrowserRouter>
        <App environment={cfg.environment} identityInstance={cfg.identity_instance} dataPolicy={cfg.data_policy} />
      </BrowserRouter>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Boot /></StrictMode>)
