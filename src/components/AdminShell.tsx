'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Backdrop from './Backdrop'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useSession } from '@/lib/session'
import { useData, useSupport } from '@/lib/hooks'
import { api } from '@/lib/api'
import PushNotificationControl from '@/components/PushNotificationControl'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useSession()
  const path = usePathname()
  const { ownerId, href } = useSupport()
  const platform = path.startsWith('/platform')
  const items: [string, string][] = platform
    ? [['/platform', 'Overview'], ['/platform/owners', 'Owners'], ['/platform/stores', 'Stores'], ['/platform/reports', 'Reports'], ['/platform/settings', 'Settings']]
    : user?.role === 'exit_staff' ? [['/admin/exit', 'Exit verification'], ['/admin/orders', 'Checked orders']]
    : [['/admin', 'Dashboard'], ['/admin/orders', 'Orders'], ['/admin/products', 'Products'], ['/admin/inventory', 'Inventory'], ['/admin/stores', 'Stores'],
       ['/admin/exit', 'Exit verification'], ['/admin/audits', 'Spot checks'], ['/admin/staff', 'Staff'], ['/admin/reports', 'Reports']]
  const showAlerts = !!user && (user.role !== 'super_admin' || !!ownerId) && !platform
  const { data: notes, refresh } = useData<any[]>(showAlerts ? '/api/admin/notifications' : null)
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const unread = (notes ?? []).filter(n => !n.read).length
  async function toggle() { setOpen(!open); if (!open) { await api('/api/admin/notifications/read', { method: 'POST', body: {} }); refresh() } }
  const active = (to: string) => (to === '/admin' || to === '/platform' ? path === to : path.startsWith(to))

  const nav = (
    <div className=' '>
      
      
      <div className="side">
      <Link className="logo" href="/" style={{ padding: '6px 14px 14px' }}>stressless</Link>

        <div className=" side-nav">
      {items.map(([to, label]) => (
        <Link key={to} className={`nl ${active(to) ? 'router-link-active' : ''}`} href={platform ? to : href(to)} onClick={() => setMobileOpen(false)}>{label}</Link>
      ))}
      </div>

      <div className=" desktop-user-meta">
        <div className="user-info">
        <div>{user?.name || user?.email}</div>
        <div className='btn g sm' style={{ textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
        </div>
        {ownerId && <div className="pill warn" style={{ marginTop: 8 }}>Read-only support view</div>}
        <button className="btn g sm" style={{ marginTop: 10 }} onClick={logout}>Sign out</button>
      </div>

      </div>

      
    </div>
  ) 

  const mobileTopbar = (
    <div className="mobile-topbar glass">
      <Link className="logo" href="/" style={{ padding: 0, fontSize: 24 }}>stressless</Link>
      <div className="mobile-topbar-actions">
        <button type="button" className="btn g sm mobile-signout" onClick={logout}>Sign out</button>
        <SheetTrigger
          type="button"
          className="mobile-menu-btn btn g sm"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <svg className="mobile-menu-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {mobileOpen ? (
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </SheetTrigger>
      </div>
    </div>
  )

  return (
    <div className="shell">
      <Backdrop />
      <aside className="glass  desktop-side" aria-label="Sidebar navigation">
        {nav}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
     

        <SheetContent side="left" onClose={() => setMobileOpen(false)} className="mobile-nav-sheet">
          <div className="mobile-sheet-header">
            <Link className="logo" href="/" onClick={() => setMobileOpen(false)}>stressless</Link>
            <button type="button" className="btn g sm" onClick={() => setMobileOpen(false)} aria-label="Close menu">Close</button>
          </div>
          <div className="mobile-nav-list">
            {items.map(([to, label]) => (
              <Link key={to} className={`nl ${active(to) ? 'router-link-active' : ''}`} href={platform ? to : href(to)} onClick={() => setMobileOpen(false)}>{label}</Link>
            ))}
          </div>
          <div className="mute mobile-user-meta">
            <div className="user-info">
            <div>{user?.name || user?.email}</div>
            <div className='btn g sm' style={{ textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
            </div>
            {ownerId && <div className="pill warn" style={{ marginTop: 8 }}>Read-only support view</div>}
          </div>
        </SheetContent>
      </Sheet>

      <main className="content">
        {showAlerts && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6, position: 'relative' }}>
            <button className="btn g sm" onClick={toggle}>Alerts{unread ? ` (${unread})` : ''}</button>
            {open && (
              <div className="glass card" style={{ position: 'absolute', top: 44, right: 0, zIndex: 30, width: 'min(360px,92vw)', padding: 16, maxHeight: '60vh', overflow: 'auto' }}>
                {notes?.map(n => <div key={n.id} className="row" style={{ fontSize: 14 }}><span>{n.body}</span></div>)}
                {!notes?.length && <p className="mute" style={{ margin: 0 }}>No alerts yet.</p>}
                {(user?.role === 'owner' || user?.role === 'manager') && <PushNotificationControl />}
              </div>
            )}
          </div>
        )}
        {children}
      </main>

         {mobileTopbar}
    </div>
  )
}
