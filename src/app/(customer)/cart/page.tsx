'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { fmt } from '@/lib/format'

export default function CartPage() {
  const { cart, store, load, setQty } = useCart(), router = useRouter()
  useEffect(() => { load().then(ok => { if (!ok) router.replace('/store') }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <h1 className="t">Your cart</h1>
      <p className="sub">{store?.name}</p>
      {cart?.items.length ? (
        <div className="glass card">
          {cart.items.map(i => (
            <div key={i.productId} className="row" style={{ alignItems: 'center' }}>
              <div><div>{i.name}{i.ageRestricted && <span className="pill warn" style={{ marginLeft: 8 }}>18+</span>}</div><div className="mute" style={{ fontSize: 13 }}>{fmt(i.unitPriceMinor)} each</div></div>
              <div className="qty">
                <button aria-label="Fewer" onClick={() => setQty(i.productId, i.quantity - 1)}>−</button><span>{i.quantity}</span><button aria-label="More" onClick={() => setQty(i.productId, i.quantity + 1)}>+</button>
              </div>
            </div>
          ))}
          <div className="row mute"><span>Subtotal</span><span>{fmt(cart.subtotalMinor)}</span></div>
          <div className="row mute"><span>Tax</span><span>{fmt(cart.taxMinor)}</span></div>
          <div className="row"><b>Total</b><b className="serif" style={{ fontSize: 30 }}>{fmt(cart.totalMinor)}</b></div>
          <Link className="btn p block" style={{ marginTop: 14 }} href="/pay">Continue to payment</Link>
        </div>
      ) : <div className="glass card"><p className="mute">Your cart is empty. Scan an item to add it.</p></div>}
      <Link className="btn g block" style={{ marginTop: 12 }} href="/scan">Keep scanning</Link>
    </div>
  )
}
