'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { useData } from '@/lib/hooks'
import { errMsg } from '@/lib/format'

export default function ChooseStore() {
  const cart = useCart(), router = useRouter()
  const { data: stores } = useData<any[]>('/api/stores/public')
  const [error, setError] = useState('')
  useEffect(() => { cart.load().then(has => { if (has) router.replace('/scan') }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function pick(id: string) { try { await cart.start({ storeId: id }); router.push('/scan') } catch (e) { setError(errMsg(e)) } }
  return (
    <div>
      <h1 className="t">Choose your store</h1>
      <p className="sub">Best way to start: scan the QR code at the store entrance with your camera. Or pick the store from the list.</p>
      {error && <p className="err">{error}</p>}
      <div className="grid">
        {stores?.map(s => (
          <div key={s.id} className="glass card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div><b>{s.name}</b><div className="mute" style={{ fontSize: 14 }}>{s.address} · {s.hours}</div></div>
            <button className="btn p sm" onClick={() => pick(s.id)}>Start</button>
          </div>
        ))}
        {stores && !stores.length && <p className="mute">No stores are open yet.</p>}
      </div>
    </div>
  )
}
