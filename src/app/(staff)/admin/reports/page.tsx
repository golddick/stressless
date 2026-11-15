'use client'
import { useMemo, useState } from 'react'
import { useData, useStoreSelect } from '@/lib/hooks'
import { DataTable, PageHead, StatCard } from '@/components/ui'
import { fmt, isoDaysAgo } from '@/lib/format'

export default function Reports() {
  const { stores } = useStoreSelect()
  const [from, setFrom] = useState(isoDaysAgo(30)), [to, setTo] = useState(isoDaysAgo(-1)), [storeId, setStoreId] = useState('')
  const query = useMemo(() => ({ from, to, storeId }), [from, to, storeId])
  const { data: r } = useData<any>('/api/admin/reports/summary', query)
  const max = Math.max(1, ...(r?.daily ?? []).map((d: any) => d.revenueMinor))
  return (
    <div>
      <PageHead title="Reports" sub="Sales, top products, flagged orders and verification rates." />
      <div className="toolbar">
        <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} aria-label="From" /><input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} aria-label="To" />
        <select className="input" value={storeId} onChange={e => setStoreId(e.target.value)} aria-label="Store"><option value="">All stores</option>{stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>
      {r && <>
        <div className="grid g4" style={{ marginBottom: 20 }}>
          <StatCard value={fmt(r.revenueMinor)} label="Sales (incl. tax)" /><StatCard value={r.orders} label="Paid orders" />
          <StatCard value={`${(r.verification.flagRate * 100).toFixed(1)}%`} label="Flag rate at the exit" /><StatCard value={r.refunded} label="Refunded orders" />
        </div>
        <div className="glass card" style={{ marginBottom: 20 }}><h3 style={{ margin: '0 0 14px' }}>Daily sales</h3>
          <div className="bar">{r.daily.map((d: any) => <i key={d.day} style={{ height: `${Math.max(4, (d.revenueMinor / max) * 100)}%` }} title={`${d.day}: ${fmt(d.revenueMinor)}`} />)}</div>
          {!r.daily.length && <p className="mute">No paid orders in this range.</p>}</div>
        <h3>Top products</h3>
        <DataTable rows={r.top.map((t: any) => ({ ...t, id: t.name }))} columns={[{ key: 'name', label: 'Product' }, { key: 'units', label: 'Units' }, { key: 'revenueMinor', label: 'Revenue', render: t => fmt(t.revenueMinor) }]} />
        <p className="mute" style={{ marginTop: 14 }}>Checked at exit: {r.verification.checked} · Flagged: {r.verification.flagged} · Low-stock products: {r.lowStock}</p>
      </>}
    </div>
  )
}
