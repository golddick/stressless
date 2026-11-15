'use client'
import Link from 'next/link'
import { useData } from '@/lib/hooks'
import { StatusPill } from '@/components/ui'
import { fdate, fmt } from '@/lib/format'

export default function Orders() {
  const { data: orders } = useData<any[]>('/api/orders')
  return (
    <div>
      <h1 className="t">Your orders</h1>
      <div className="grid">
        {orders?.map(o => (
          <Link key={o.id} className="glass card" href={`/orders/${o.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div><b>{o.store}</b><div className="mute" style={{ fontSize: 13 }}>{fdate(o.createdAt)}</div></div>
            <div style={{ textAlign: 'right' }}><div>{fmt(o.totalMinor)}</div><StatusPill status={o.status} /></div>
          </Link>
        ))}
        {orders && !orders.length && <p className="mute">No orders yet.</p>}
      </div>
    </div>
  )
}
