'use client'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { api } from './api'
import { errMsg } from './format'

export interface CartItem { productId: string; name: string; barcode: string; unitPriceMinor: number; quantity: number; ageRestricted: boolean }
export interface ScannedProduct { id: string; name: string; barcode: string; unitPriceMinor: number; imageFile: string | null; ageRestricted: boolean }
export interface Cart { items: CartItem[]; subtotalMinor: number; taxMinor: number; totalMinor: number; hasAgeRestricted: boolean }
interface Store { id: string; name: string; address: string }
interface Ctx {
  cart: Cart | null; store: Store | null; flash: { kind: 'ok' | 'err'; text: string } | null; count: number
  load: () => Promise<boolean>; start: (b: { storeToken?: string; storeId?: string }) => Promise<void>
  lookupBarcode: (barcode: string) => Promise<{ product: ScannedProduct; availableQuantity: number } | null>
  setQty: (productId: string, q: number) => Promise<boolean>
}
const CartCtx = createContext<Ctx>(null as any)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [flash, setFlash] = useState<Ctx['flash']>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const say = (kind: 'ok' | 'err', text: string) => { setFlash({ kind, text }); clearTimeout(timer.current); timer.current = setTimeout(() => setFlash(null), 2600) }

  const load = useCallback(async () => {
    try { const r = await api('/api/sessions/current'); setStore(r.store); setCart(r.cart); return true } catch { setStore(null); setCart(null); return false }
  }, [])
  const start = useCallback(async (body: { storeToken?: string; storeId?: string }) => { await api('/api/sessions', { method: 'POST', body }); await load() }, [load])
  const lookupBarcode = useCallback(async (barcode: string) => {
    try { return await api<{ product: ScannedProduct; availableQuantity: number }>('/api/cart/scan', { method: 'POST', body: { barcode } }) }
    catch (e) { say('err', errMsg(e)); return null }
  }, [])
  const setQty = useCallback(async (productId: string, quantity: number) => {
    try {
      setCart((await api(`/api/cart/items/${productId}`, { method: 'PATCH', body: { quantity } })).cart)
      say('ok', 'Cart updated')
      return true
    } catch (e) { say('err', errMsg(e)); return false }
  }, [])
  const count = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
  return <CartCtx.Provider value={{ cart, store, flash, count, load, start, lookupBarcode, setQty }}>{children}</CartCtx.Provider>
}
export const useCart = () => useContext(CartCtx)
