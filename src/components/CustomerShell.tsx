'use client'
import Link from 'next/link'
import Backdrop from './Backdrop'
import { CartProvider, useCart } from '@/lib/cart'
import { useSession } from '@/lib/session'

function Nav() {
  const { count } = useCart()
  const { logout } = useSession()
  return (
    <nav className="nav glass">
      <Link className="logo" href="/store">stressless</Link>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link className="btn g sm" href="/orders">Orders</Link>
        <Link className="btn g sm" href="/cart">Cart{count ? ` (${count})` : ''}</Link>
        <button className="btn g sm" onClick={logout}>Sign out</button>
      </div>
    </nav>
  )
}

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Backdrop />
      <Nav />
      <main className="wrap page" style={{ maxWidth: 640 }}>{children}</main>
    </CartProvider>
  )
}
