'use client'
import { useMemo, useState } from 'react'
import { useData } from '@/lib/hooks'
import { DataTable, PageHead, StatCard, StatusPill } from '@/components/ui'
import { fmt } from '@/lib/format'

export default function PlatformReports() {
  const [days, setDays] = useState(30)
  const query = useMemo(() => ({ days }), [days])
  const { data: r } = useData<any>('/api/platform/reports', query)
  return (
    <div>
      <PageHead title="Platform reports" sub="Sales and order volume by business.">
        <select className="input" value={days} onChange={e => setDays(+e.target.value)} aria-label="Range"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
      </PageHead>
      <div className="grid g3" style={{ marginBottom: 20 }}><StatCard value={fmt(r?.subtotalMinor ?? 0)} label="Total sales (excl. tax)" /><StatCard value={r?.orders ?? 0} label="Paid orders" /><StatCard value={r?.stores ?? 0} label="Stores" /></div>
      <DataTable rows={(r?.perOwner ?? []).map((o: any) => ({ ...o, id: o.ownerId }))} columns={[
        { key: 'business', label: 'Business' }, { key: 'orders', label: 'Orders' },
        { key: 'subtotalMinor', label: 'Subtotal', render: o => fmt(o.subtotalMinor) },
        { key: 'taxMinor', label: 'Tax', render: o => fmt(o.taxMinor) },
        { key: 'revenueMinor', label: 'Total sales', render: o => fmt(o.revenueMinor) },
        { key: 'status', label: 'Status', render: o => <StatusPill status={o.status} /> }]} />
    </div>
  )
}
