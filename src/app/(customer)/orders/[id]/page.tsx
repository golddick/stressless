'use client'
import { use } from 'react'
import Link from 'next/link'
import { useData } from '@/lib/hooks'
import { StatusPill } from '@/components/ui'
import { fdate, fmt } from '@/lib/format'

export default function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: o } = useData<any>(`/api/orders/${id}`)
  if (!o) return null
  return (
    <div>
      <h1 className="t">Receipt</h1><p className="sub">{o.store} · {fdate(o.createdAt)}</p>
      <div className="glass card">
        {o.items.map((i: any) => <div key={i.id} className="row"><span>{i.name} × {i.quantity}</span><span>{fmt(i.unitPriceMinor * i.quantity)}</span></div>)}
        <div className="row mute"><span>Subtotal</span><span>{fmt(o.subtotalMinor)}</span></div>
        <div className="row mute"><span>Tax</span><span>{fmt(o.taxMinor)}</span></div>
        <div className="row"><b>Total</b><b className="serif" style={{ fontSize: 28 }}>{fmt(o.totalMinor)}</b></div>
        <div className="row"><span className="mute">Order {o.id}</span><StatusPill status={o.status} /></div>
        {o.exitToken && <Link className="btn p block" style={{ marginTop: 14 }} href={`/exit-pass/${o.id}`}>Show exit pass</Link>}
      </div>
    </div>
  )
}
