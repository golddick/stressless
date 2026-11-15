'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart, type ScannedProduct } from '@/lib/cart'
import { useScanner } from '@/lib/useScanner'
import { fmt } from '@/lib/format'
import { Modal } from '@/components/ui'

export default function Scan() {
  const cart = useCart(), router = useRouter()
  const video = useRef<HTMLVideoElement>(null)
  const [manual, setManual] = useState('')
  const [selected, setSelected] = useState<{ product: ScannedProduct; availableQuantity: number } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [lookingUp, setLookingUp] = useState(false)
  const [adding, setAdding] = useState(false)
  const resumeScanner = useRef(false)
  const { start, stop, active, error } = useScanner(video, code => { void lookupBarcode(code) })

  async function lookupBarcode(barcode: string) {
    if (lookingUp || selected) return
    setLookingUp(true)
    const result = await cart.lookupBarcode(barcode)
    setLookingUp(false)
    if (result) {
      resumeScanner.current = active
      setSelected(result)
      setQuantity(1)
      setManual('')
    }
  }

  useEffect(() => { if (selected) stop() }, [selected, stop])
  useEffect(() => { cart.load().then(ok => (ok ? start() : router.replace('/store'))) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function addManual(e: React.FormEvent) { e.preventDefault(); if (manual.trim()) await lookupBarcode(manual.trim()) }

  async function addSelected() {
    if (!selected || adding) return
    setAdding(true)
    const existingQuantity = cart.cart?.items.find(i => i.productId === selected.product.id)?.quantity ?? 0
    const added = await cart.setQty(selected.product.id, existingQuantity + quantity)
    setAdding(false)
    if (added) closeProduct()
  }

  function closeProduct() {
    setSelected(null)
    if (resumeScanner.current) {
      resumeScanner.current = false
      void start()
    }
  }

  const existingQuantity = selected ? cart.cart?.items.find(i => i.productId === selected.product.id)?.quantity ?? 0 : 0
  const maxQuantity = selected ? Math.min(selected.availableQuantity, 99 - existingQuantity) : 1
  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h1 className="t" style={{ fontSize: 34, margin: 0 }}>Scan items</h1><span className="mute" style={{ fontSize: 14 }}>{cart.store?.name}</span>
      </div>
      <div className="scanbox glass"><video ref={video} playsInline muted /></div>
      {error && <p className="err">{error}</p>}
      {!active && !error && <button className="btn g block" style={{ marginTop: 12 }} onClick={start}>Turn on camera</button>}
      <form className="toolbar" style={{ marginTop: 16, flexWrap: 'nowrap' }} onSubmit={addManual}>
        <input value={manual} onChange={e => setManual(e.target.value)} className="input" style={{ flex: 1, minWidth: 0 }} inputMode="numeric" placeholder="Type a barcode instead" aria-label="Barcode" disabled={lookingUp} />
        <button className="btn g" disabled={lookingUp || !manual.trim()}>{lookingUp ? 'Looking up…' : 'Find item'}</button>
      </form>
      {cart.flash && <div className="flash glass" style={{ color: cart.flash.kind === 'ok' ? 'var(--ok)' : 'var(--bad)' }} role="status">{cart.flash.text}</div>}
      <div className="sheet glass">
        <div><div className="mute" style={{ fontSize: 13 }}>{cart.count} item{cart.count === 1 ? '' : 's'}</div><b className="serif" style={{ fontSize: 30 }}>{fmt(cart.cart?.totalMinor ?? 0)}</b></div>
        <Link className="btn p" href="/cart">Review cart</Link>
      </div>
      <Modal open={!!selected} title={selected?.product.name ?? 'Item details'} onClose={closeProduct}>
        {selected && <>
          {selected.product.imageFile && !selected.product.imageFile.startsWith('dev://')
            ? <img src={selected.product.imageFile} alt={selected.product.name} style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 16, marginBottom: 18, background: 'rgba(255,255,255,.06)' }} />
            : <div aria-hidden="true" style={{ display: 'grid', placeItems: 'center', height: 150, borderRadius: 16, marginBottom: 18, background: 'rgba(255,255,255,.06)', color: 'var(--brass)', fontSize: 48 }}>{selected.product.name.charAt(0).toUpperCase()}</div>}
          <div className="row" style={{ alignItems: 'center' }}>
            <div>
              <b>{selected.product.name}</b>
              {selected.product.ageRestricted && <span className="pill warn" style={{ marginLeft: 8 }}>18+</span>}
              <div className="mute" style={{ marginTop: 4 }}>Available to add: {maxQuantity}</div>
            </div>
            <b className="serif" style={{ fontSize: 25 }}>{fmt(selected.product.unitPriceMinor)}</b>
          </div>
          <div className="row" style={{ alignItems: 'center' }}>
            <b>Quantity</b>
            <div className="qty">
              <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <input aria-label="Quantity" className="input" type="number" min={1} max={maxQuantity} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))} style={{ width: 70, minWidth: 0, textAlign: 'center' }} />
              <button type="button" aria-label="Increase quantity" disabled={quantity >= maxQuantity} onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}>+</button>
            </div>
          </div>
          <div className="row">
            <span className="mute">Line total</span>
            <b>{fmt(selected.product.unitPriceMinor * quantity)}</b>
          </div>
          <div className="toolbar" style={{ margin: '18px 0 0' }}>
            <button type="button" className="btn g" onClick={closeProduct} disabled={adding}>Cancel</button>
            <button type="button" className="btn p" style={{ flex: 1 }} onClick={addSelected} disabled={adding || maxQuantity < 1}>
              {adding ? 'Adding…' : 'Add item'}
            </button>
          </div>
        </>}
      </Modal>
    </div>
  )
}
