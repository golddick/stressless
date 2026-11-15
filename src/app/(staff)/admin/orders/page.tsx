'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData, useSupport } from '@/lib/hooks'
import { DataTable, PageHead, StatusPill } from '@/components/ui'
import { fdate, fmt } from '@/lib/format'

const STATUSES = ['pending_payment', 'paid', 'verified', 'flagged', 'completed', 'refunded', 'abandoned']

export default function Orders() {
  const router = useRouter(), { href } = useSupport()
  const [status, setStatus] = useState(''), [q, setQ] = useState('')
  const query = useMemo(() => ({ status, q }), [status, q])
  const { data: orders } = useData<any[]>('/api/admin/orders', query, { poll: 10000 })
  return (
    <div>
      <PageHead title="Orders" sub="Filter, open an order, review flags, refund or void." />
      <div className="toolbar">
        <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search order or customer" aria-label="Search" />
        <select className="input" value={status} onChange={e => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
      </div>
      <DataTable rows={orders ?? []} onRow={o => router.push(href(`/admin/orders/${o.id}`))} columns={[
        { key: 'createdAt', label: 'When', render: o => fdate(o.createdAt) }, { key: 'id', label: 'Order' }, { key: 'store', label: 'Store' },
        { key: 'customer', label: 'Customer', render: o => o.customer || o.email },
        { key: 'subtotalMinor', label: 'Subtotal', render: o => fmt(o.subtotalMinor) },
        { key: 'taxMinor', label: 'Tax', render: o => fmt(o.taxMinor) },
        { key: 'totalMinor', label: 'Total paid', render: o => fmt(o.totalMinor) },
        { key: 'status', label: 'Status', render: o => <StatusPill status={o.status} /> }]} />
    </div>
  )
}
