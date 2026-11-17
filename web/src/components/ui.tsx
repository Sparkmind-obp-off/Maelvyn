import type { ReactNode } from 'react'
import type { ApiRequestError } from '../lib/api'

export function ErrorBox({ error }: { error: ApiRequestError | null }) {
  if (!error) return null
  return (
    <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-200">
      <strong className="font-semibold">{error.error.code}</strong>: {error.error.message}
      {error.error.request_id && <span className="mt-1 block text-xs text-rose-300/70">request_id: {error.error.request_id}</span>}
    </div>
  )
}

export function Loading() {
  return <p className="text-sm text-slate-400" aria-live="polite">Memuat…</p>
}

const TONES: Record<string, string> = {
  accepted: 'bg-emerald-900/60 text-emerald-200', succeeded: 'bg-emerald-900/60 text-emerald-200', AVAILABLE: 'bg-emerald-900/60 text-emerald-200', ready: 'bg-emerald-900/60 text-emerald-200',
  awaiting_review: 'bg-amber-900/60 text-amber-200', running: 'bg-sky-900/60 text-sky-200', draft: 'bg-slate-800 text-slate-300', REVIEW_REQUIRED: 'bg-amber-900/60 text-amber-200', LIMITED: 'bg-amber-900/60 text-amber-200',
  rejected: 'bg-rose-900/60 text-rose-200', failed: 'bg-rose-900/60 text-rose-200', blocked: 'bg-orange-900/60 text-orange-200', denied: 'bg-orange-900/60 text-orange-200', ERROR: 'bg-rose-900/60 text-rose-200', EXHAUSTED: 'bg-rose-900/60 text-rose-200',
  UNVERIFIED: 'bg-slate-800 text-slate-300', pending: 'bg-amber-900/60 text-amber-200', revoked: 'bg-rose-900/60 text-rose-200', expired: 'bg-slate-800 text-slate-400', workspace_admin: 'bg-sky-900/60 text-sky-200', skipped: 'bg-slate-800 text-slate-300', synthetic: 'bg-violet-900/60 text-violet-200', live: 'bg-sky-900/60 text-sky-200',
}

export function Badge({ value }: { value: string | null | undefined }) {
  const v = value ?? 'unknown'
  return <span className={`badge ${TONES[v] ?? 'bg-slate-800 text-slate-300'}`}>{v}</span>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </header>
  )
}

export function fmtDate(s: unknown) {
  if (typeof s !== 'string') return '—'
  return new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
