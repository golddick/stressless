'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData, useSupport } from '@/lib/hooks'
import { DataTable, PageHead, StatCard, StatusPill } from '@/components/ui'
import { fdate, fmt, isoDaysAgo } from '@/lib/format'

export default function Dashboard() {
  const router = useRouter(), { href } = useSupport()
  const q = useMemo(() => ({ from: isoDaysAgo(1) }), [])
  const { data: sum } = useData<any>('/api/admin/reports/summary', q, { poll: 10000 })
  const { data: orders } = useData<any[]>('/api/admin/orders', { limit: 8 }, { poll: 10000 }) // live orders
  return (
    <div className='admin-dashboard'>
      <PageHead title="Today" sub="Live view of your stores. Updates every few seconds." />
      <div className="grid g4" style={{ marginBottom: 22 }}>
        <StatCard value={fmt(sum?.allTimeSubtotalMinor ?? 0)} label="Total sales (excl. tax)" />
        <StatCard value={sum?.orders ?? 0} label="Paid orders today" />
        <StatCard value={sum?.flagged ?? 0} label="Flagged orders" />
        <StatCard value={sum?.lowStock ?? 0} label="Low-stock products" />
      </div>
      <h2 className="t" style={{ fontSize: 30 }}>Latest orders</h2>
      <DataTable rows={orders ?? []} onRow={o => router.push(href(`/admin/orders/${o.id}`))} columns={[
        { key: 'createdAt', label: 'When', render: o => fdate(o.createdAt) }, { key: 'store', label: 'Store' },
        { key: 'customer', label: 'Customer', render: o => o.customer || o.email },
        { key: 'subtotalMinor', label: 'Subtotal', render: o => fmt(o.subtotalMinor) },
        { key: 'taxMinor', label: 'Tax', render: o => fmt(o.taxMinor) },
        { key: 'totalMinor', label: 'Total', render: o => fmt(o.totalMinor) },
        { key: 'status', label: 'Status', render: o => <StatusPill status={o.status} /> }]} />
    </div>
  )
}
