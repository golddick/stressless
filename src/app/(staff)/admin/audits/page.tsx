'use client'
import { useData } from '@/lib/hooks'
import { DataTable, PageHead, StatusPill } from '@/components/ui'
import { fdate } from '@/lib/format'

export default function Audits() {
  const { data: rows } = useData<any[]>('/api/admin/audits')
  return (
    <div>
      <PageHead title="Spot checks" sub="Random checks prompted at the exit. Outcomes are recorded here." />
      <DataTable rows={rows ?? []} columns={[
        { key: 'at', label: 'When', render: r => fdate(r.at) }, { key: 'store', label: 'Store' }, { key: 'staff', label: 'Checked by' },
        { key: 'orderId', label: 'Order', render: r => r.orderId?.slice(-8) ?? '-' }, { key: 'outcome', label: 'Outcome', render: r => <StatusPill status={r.outcome} /> }, { key: 'note', label: 'Note' }]} />
    </div>
  )
}
