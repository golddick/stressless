'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { api } from '@/lib/api'
import { StatusPill } from '@/components/ui'
import { errMsg, fmt } from '@/lib/format'
import { useQueryParam } from '@/lib/hooks'

export default function Pay() {
  const router = useRouter(), cart = useCart()
  const orderId = useQueryParam('orderId'), simParam = useQueryParam('sim')
  const [ready, setReady] = useState(false)
  const [age, setAge] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  const poll = useCallback(async (id: string) => {
    try {
      const o = await api(`/api/orders/${id}`); setOrder(o)
      if (['paid', 'verified', 'completed', 'flagged'].includes(o.status)) { clearInterval(timer.current); router.replace(`/exit-pass/${id}`) }
    } catch {}
  }, [router])

  useEffect(() => { const t = setTimeout(() => setReady(true), 0); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (!ready) return
    if (orderId) { poll(orderId); timer.current = setInterval(() => poll(orderId), 2500) }
    else cart.load().then(ok => { if (!ok) router.replace('/store') })
    return () => clearInterval(timer.current)
  }, [ready, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function pay() {
    setBusy(true); setError('')
    try { const r = await api('/api/checkout', { body: { ageConfirmed: age } }); window.location.href = r.authorizationUrl } catch (e) { setError(errMsg(e)); setBusy(false) }
  }
  async function simulate() {
    setBusy(true)
    try { await api('/api/dev/mock-pay', { body: { orderId } }); await poll(orderId) } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }
  const c = cart.cart
  if (orderId) return (
    <div>
      <h1 className="t">Confirming payment</h1>
      <p className="sub">We are waiting for your payment to be confirmed. This usually takes a few seconds.</p>
      <div className="glass card">
        {order && <p>Order total <b>{fmt(order.totalMinor)}</b> · <StatusPill status={order.status} /></p>}
        {simParam === '1' && (<><p className="mute">Development mode: no Paystack key is set, so you can simulate the payment webhook.</p>
          <button className="btn p block" disabled={busy} onClick={simulate}>Simulate successful payment</button></>)}
        {error && <p className="err">{error}</p>}
      </div>
    </div>
  )
  return (
    <div>
      <h1 className="t">Pay</h1><p className="sub">{cart.store?.name}</p>
      {c && (
        <div className="glass card">
          <div className="row"><span>{cart.count} items</span><span>{fmt(c.subtotalMinor)}</span></div>
          <div className="row mute"><span>Tax</span><span>{fmt(c.taxMinor)}</span></div>
          <div className="row"><b>Total</b><b className="serif" style={{ fontSize: 30 }}>{fmt(c.totalMinor)}</b></div>
          {c.hasAgeRestricted && (
            <label className="check"><input type="checkbox" checked={age} onChange={e => setAge(e.target.checked)} /><span>I confirm I am of legal age to buy the age-restricted items in my cart. Staff will check my ID at the exit.</span></label>
          )}
          {error && <p className="err">{error}</p>}
          <button className="btn p block" disabled={busy || !c.items.length || (c.hasAgeRestricted && !age)} onClick={pay}>{busy ? 'Starting payment...' : 'Pay now'}</button>
        </div>
      )}
    </div>
  )
}
