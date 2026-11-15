'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useData, useSupport } from '@/lib/hooks'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api'
import { PageHead, StatusPill } from '@/components/ui'
import { errMsg, fdate, fmt } from '@/lib/format'

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useSession(), { href } = useSupport()
  const { data: o, refresh } = useData<any>(`/api/admin/orders/${id}`)
  const [note, setNote] = useState(''), [error, setError] = useState('')
  const readOnly = user?.role === 'super_admin'
  async function act(action: 'refund' | 'void' | 'resolve') {
    if (action === 'refund' && !confirm('Refund this order in full?')) return
    setError('')
    try { await api(`/api/admin/orders/${id}/${action}`, { body: { note: note || undefined } }); setNote(''); refresh() } catch (e) { setError(errMsg(e)) }
  }
  if (!o) return null
  return (
    <div>
      <PageHead title={`Order ${o.id.slice(-8)}`} sub={`${o.store} · ${fdate(o.createdAt)} · ${o.customer || o.email}`}>
        <Link className="btn g sm" href={href('/admin/orders')}>Back</Link>
      </PageHead>
      <div className="grid g2">
        <div className="glass card">
          <div className="row"><b>Status</b><StatusPill status={o.status} /></div>
          {o.items.map((i: any) => <div key={i.id} className="row"><span>{i.name} × {i.quantity}{i.ageRestricted && <span className="pill warn" style={{ marginLeft: 8 }}>18+</span>}</span><span>{fmt(i.unitPriceMinor * i.quantity)}</span></div>)}
          <div className="row mute"><span>Tax</span><span>{fmt(o.taxMinor)}</span></div>
          <div className="row"><b>Total</b><b>{fmt(o.totalMinor)}</b></div>
          <div className="row mute"><span>Payment</span><span>{o.payment?.status}</span></div>
          {o.hasAgeRestricted && <div className="row mute"><span>Age confirmed at checkout</span><span>{o.ageConfirmed ? 'Yes' : 'No'}</span></div>}
          {!readOnly && <>
            <label className="field" style={{ marginTop: 14 }}>Note (optional)<input value={note} onChange={e => setNote(e.target.value)} /></label>
            {error && <p className="err">{error}</p>}
            <div className="toolbar">
              {o.status === 'flagged' && <button className="btn p" onClick={() => act('resolve')}>Resolve flag</button>}
              {['paid', 'flagged', 'verified', 'completed'].includes(o.status) && <button className="btn d" onClick={() => act('refund')}>Refund</button>}
              {o.status === 'pending_payment' && <button className="btn g" onClick={() => act('void')}>Void</button>}
            </div>
          </>}
        </div>
        <div className="glass card">
          <h3 style={{ margin: '0 0 8px' }}>Exit checks</h3>
          {o.verifications.map((v: any) => <div key={v.id} className="row"><span>{v.result}{v.note && <span className="mute"> · {v.note}</span>}</span><span className="mute">{fdate(v.at)}</span></div>)}
          {!o.verifications.length && <p className="mute">Not scanned at the exit yet.</p>}
          <h3 style={{ margin: '22px 0 8px' }}>Audit trail</h3>
          {o.events.map((e: any) => <div key={e.id} className="row" style={{ fontSize: 13 }}><span>{e.type.replace(/_/g, ' ')}</span><span className="mute">{fdate(e.at)}</span></div>)}
        </div>
      </div>
    </div>
  )
}
