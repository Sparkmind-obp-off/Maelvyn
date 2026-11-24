import { useState, type ReactNode } from 'react'
import { ApiRequestError } from '../lib/api'
import { Badge, ErrorBox, fmtDate } from './ui'

export type Field = {
  name: string; label: string; type?: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox'
  options?: (string | { value: string; label: string })[]; required?: boolean; placeholder?: string; defaultValue?: string | number | boolean; wide?: boolean; help?: string
}
type Values = Record<string, string | number | boolean>
const initial = (fields: Field[]): Values => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? (f.type === 'checkbox' ? false : f.type === 'select' ? (typeof f.options?.[0] === 'string' ? f.options[0] : f.options?.[0]?.value ?? '') : '')]))

export function toBody(fields: Field[], v: Values) {
  const out: Record<string, unknown> = {}
  for (const f of fields) { const x = v[f.name]; if (x === '' || x === undefined) continue; out[f.name] = f.type === 'number' ? Number(x) : x }
  return out
}

export function ActionForm({ title, fields, submit, cta = 'Simpan', note, onDone }: {
  title: string; fields: Field[]; submit: (body: Record<string, unknown>, raw: Values) => Promise<unknown>; cta?: string; note?: ReactNode; onDone?: (r: unknown) => void
}) {
  const [v, setV] = useState<Values>(() => initial(fields)); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiRequestError | null>(null); const [okMsg, setOk] = useState(false)
  async function onSubmit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(null); setOk(false); try { const r = await submit(toBody(fields, v), v); setV(initial(fields)); setOk(true); onDone?.(r) } catch (x) { setErr(x instanceof ApiRequestError ? x : new ApiRequestError(0, { code: 'CLIENT', message: String(x) })) } finally { setBusy(false) } }
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <form onSubmit={onSubmit} className="card grid gap-3 sm:grid-cols-2" aria-labelledby={`f-${id}`}>
    <h3 id={`f-${id}`} className="font-medium text-white sm:col-span-2">{title}</h3>
    {note && <p id={`${id}-note`} className="text-xs text-slate-400 sm:col-span-2">{note}</p>}
    {fields.map((f) => { const fid = `${id}-${f.name}`; const helpId = f.help ? `${fid}-help` : undefined; const set = (x: string | number | boolean) => setV((o) => ({ ...o, [f.name]: x })); const val = v[f.name]; const describedBy = [helpId].filter(Boolean).join(' ') || undefined; const common = { id: fid, 'aria-describedby': describedBy, 'aria-required': f.required || undefined, required: f.required, placeholder: f.placeholder, value: String(val), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(e.target.value) }
      return <div key={f.name} className={f.wide || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
        {f.type === 'checkbox' ? <label className="flex items-center gap-2 text-sm text-slate-300"><input id={fid} type="checkbox" checked={!!val} aria-required={f.required || undefined} onChange={(e) => set(e.target.checked)} /> {f.label}{f.required && <span aria-hidden="true"> *</span>}</label> : <label className="label" htmlFor={fid}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>}
        {f.type === 'textarea' && <textarea {...common} rows={3} />}
        {f.type === 'select' && <select {...common}>{f.options!.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select>}
        {(!f.type || f.type === 'text' || f.type === 'number' || f.type === 'date') && <input {...common} type={f.type ?? 'text'} />}
        {f.help && <p id={helpId} className="mt-1 text-xs text-slate-500">{f.help}</p>}
      </div>
    })}
    <div className="flex items-center gap-3 sm:col-span-2"><button type="submit" className="btn-primary" disabled={busy} aria-busy={busy}>{busy ? 'Memproses…' : cta}</button>{okMsg && <span className="text-xs text-emerald-300" role="status" aria-live="polite">Tersimpan.</span>}</div>
    <div className="sm:col-span-2"><ErrorBox error={err} /></div>
  </form>
}

export type Col<R> = { key: string; label: string; render?: (r: R) => ReactNode }
export function DataTable<R extends Record<string, unknown>>({ rows, cols, empty = 'Belum ada data.', caption }: { rows: R[]; cols: Col<R>[]; empty?: string; caption?: string }) {
  const cell = (r: R, c: Col<R>) => { const x = r[c.key]; if (c.render) return c.render(r); if (x === null || x === undefined || x === '') return <span className="text-slate-600">—</span>; if (/(^|_)(status|outcome|stage|role|decision|severity|classification)$/.test(c.key)) return <Badge value={String(x)} />; if (/_at$/.test(c.key)) return fmtDate(x); if (/_minor$/.test(c.key)) return fmtMoney(Number(x)); return String(x) }
  return <div className="overflow-x-auto rounded-xl border border-slate-800" tabIndex={0} aria-label={caption ?? 'Data table'}><table className="w-full min-w-[680px] text-left text-sm"><>{caption && <caption className="sr-only">{caption}</caption>}<thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr>{cols.map((c) => <th key={c.key} scope="col" className="p-3">{c.label}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={String(r.id ?? i)} className="border-t border-slate-800 align-top">{cols.map((c) => <td key={c.key} className="p-3">{cell(r, c)}</td>)}</tr>)}{rows.length === 0 && <tr><td colSpan={cols.length} className="p-3 text-slate-500">{empty}</td></tr>}</tbody></></table></div>
}
export const fmtMoney = (minor: number, currency?: string) => `${currency ? currency + ' ' : ''}${minor.toLocaleString('id-ID')}`
export function useRunner(reload: () => Promise<unknown> | void) { const [err, setErr] = useState<ApiRequestError | null>(null); const [busy, setBusy] = useState(false); async function run(fn: () => Promise<unknown>) { setBusy(true); setErr(null); try { await fn(); await reload() } catch (e) { setErr(e instanceof ApiRequestError ? e : new ApiRequestError(0, { code: 'CLIENT', message: String(e) })) } finally { setBusy(false) } } const ask = (label: string, min = 3) => { const r = window.prompt(label); return r && r.trim().length >= min ? r.trim() : null }; return { err, busy, run, ask, ErrorView: () => <ErrorBox error={err} /> } }
export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) { const id = 's-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-'); return <section aria-labelledby={id} className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id={id} className="text-lg font-semibold text-white">{title}</h2>{actions}</div>{children}</section> }
