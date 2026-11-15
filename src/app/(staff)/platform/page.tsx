'use client'
import { useData } from '@/lib/hooks'
import { DataTable, PageHead, StatCard } from '@/components/ui'
import { fdate, fmt } from '@/lib/format'

export default function Platform() {
  const { data: r } = useData<any>('/api/platform/reports')
  const { data: log } = useData<any[]>('/api/platform/activity')
  return (
    <div>
      <PageHead title="Platform" sub="Everything across every owner." />
      <div className="grid g4" style={{ marginBottom: 22 }}>
        <StatCard value={r?.owners ?? 0} label="Store owners" /><StatCard value={r?.stores ?? 0} label="Stores" />
        <StatCard value={fmt(r?.revenueMinor ?? 0)} label="Sales, last 30 days" /><StatCard value={r?.flagged ?? 0} label="Flagged orders now" />
      </div>
      <h2 className="t" style={{ fontSize: 30 }}>Recent activity</h2>
      <DataTable rows={log ?? []} columns={[{ key: 'at', label: 'When', render: l => fdate(l.at) }, { key: 'action', label: 'Action', render: l => l.action.replace(/_/g, ' ') }, { key: 'targetType', label: 'On' }, { key: 'targetId', label: 'Target' }]} />
    </div>
  )
}
