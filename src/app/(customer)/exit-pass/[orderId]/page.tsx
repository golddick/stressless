'use client'
import { use } from 'react'
import Link from 'next/link'
import { useData } from '@/lib/hooks'
import { QrCode, StatusPill } from '@/components/ui'
import { fmt } from '@/lib/format'

export default function ExitPass({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const { data: order } = useData<any>(`/api/orders/${orderId}`, undefined, { poll: 4000 })
  if (!order) return null
  const done = ['verified', 'completed'].includes(order.status)
  return (
    <div style={{ textAlign: 'center' }}>
      <h1 className="t">{done ? 'You are all set' : 'Your exit pass'}</h1>
      <p className="sub" style={{ marginInline: 'auto' }}>{done ? 'Verified. Thanks for shopping with us. Your receipt is on its way.' : 'Show this code to staff at the exit. It works once.'}</p>
      <div className="glass card" style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
        {order.exitToken ? <QrCode value={order.exitToken} size={260} /> : order.status === 'flagged' && <p className="err">Staff are reviewing your order. Please wait at the exit.</p>}
        <StatusPill status={order.status} />
        <div style={{ width: '100%', textAlign: 'left' }}>
          {order.items.map((i: any) => <div key={i.id} className="row"><span>{i.name} × {i.quantity}</span><span className="mute">{fmt(i.unitPriceMinor * i.quantity)}</span></div>)}
          <div className="row"><b>Total paid</b><b>{fmt(order.totalMinor)}</b></div>
        </div>
        <Link className="btn g block" href={`/orders/${order.id}`}>View receipt</Link>
      </div>
    </div>
  )
}
