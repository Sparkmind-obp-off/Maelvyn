import { DataTable, Section, useRunner } from '../components/kit'
import { ErrorBox, Loading, PageHeader } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Rows = Record<string, unknown>[]

export default function PlatformPage() {
  const acc = useLoad((a) => a.get<{ accounts: Rows }>('/platform/accounts'), [])
  const au = useLoad((a) => a.get<{ events: Rows; reconciliation: Rows }>('/platform/audit'), [])
  const dr = useLoad((a) => a.get<{ requests: Rows }>('/platform/data-requests'), [])
  const r = useRunner(async () => { await Promise.all([dr.reload(), au.reload()]) })
  if (acc.loading && !acc.data) return <Loading />
  if (acc.error) return <ErrorBox error={acc.error} />
  return (
    <div className="space-y-8">
      <PageHeader title="Platform (khusus Platform Owner)" subtitle="Direktori akun memisahkan identitas akun dari akses. Akun baru selalu ACCOUNT_ONLY sampai Owner memberi otorisasi eksplisit dan orang tersebut menerimanya." />
      <r.ErrorView />
      <Section title="Direktori akun">
        <DataTable rows={acc.data!.accounts} cols={[{ key: 'display_name', label: 'Nama' }, { key: 'contact_email', label: 'Email' }, { key: 'email_verified', label: 'Terverifikasi', render: (x) => x.email_verified ? 'ya' : 'tidak' },
          { key: 'classification', label: 'Klasifikasi' }, { key: 'platform_role', label: 'Peran platform' }, { key: 'account_policy', label: 'Kebijakan akun' },
          { key: 'active_memberships', label: 'Keanggotaan aktif' }, { key: 'suspended_memberships', label: 'Ditangguhkan' }, { key: 'active_assignments', label: 'Penugasan' }, { key: 'created_at', label: 'Dibuat' }]} />
      </Section>
      <Section title="Permintaan data">
        <DataTable rows={dr.data?.requests ?? []} cols={[{ key: 'display_name', label: 'Akun' }, { key: 'request_type', label: 'Jenis' }, { key: 'note', label: 'Catatan' }, { key: 'status', label: 'Status' }, { key: 'resolution', label: 'Resolusi' }, { key: 'created_at', label: 'Dibuat' },
          { key: 'act', label: '', render: (x) => x.status === 'open' && <span className="flex gap-2">
            {(['completed', 'declined'] as const).map((s) => <button key={s} className={s === 'completed' ? 'btn-primary py-1' : 'btn-ghost py-1'} disabled={r.busy} onClick={() => { const res = r.ask(`Resolusi (${s}):`); if (res) void r.run(() => dr.api.post(`/platform/data-requests/${x.id}/resolve`, { status: s, resolution: res })) }}>{s === 'completed' ? 'Selesaikan' : 'Tolak'}</button>)}</span> }]} empty="Tidak ada permintaan data." />
      </Section>
      <Section title="Rekonsiliasi keanggotaan lama (migrasi 0004)">
        <DataTable rows={au.data?.reconciliation ?? []} cols={[{ key: 'created_at', label: 'Waktu' }, { key: 'action', label: 'Aksi' }, { key: 'target_id', label: 'Target' }, { key: 'reason', label: 'Alasan' }]} empty="Tidak ada keanggotaan lama yang direkonsiliasi." />
      </Section>
      <Section title="Audit platform">
        <DataTable rows={au.data?.events ?? []} cols={[{ key: 'created_at', label: 'Waktu' }, { key: 'actor_name', label: 'Aktor' }, { key: 'action', label: 'Aksi' }, { key: 'target_type', label: 'Jenis target' }, { key: 'reason', label: 'Alasan' }]} empty="Belum ada event." />
      </Section>
    </div>
  )
}
