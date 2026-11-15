'use client'
import Link from 'next/link'
import { useSession } from '@/lib/session'
import { homeFor } from '@/lib/format'

export default function SiteNav() {
  const { user, logout } = useSession()
  return (
    <nav className="nav glass">
      <Link className="logo" href="/">stressless</Link>
      <div className="links"><a href="/#how">How it works</a><a href="/#stores">For stores</a><a href="/#trust">Trust</a></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {user ? ( 
          <>
            <Link className="btn g sm" href={homeFor(user.role)}>{user.role === 'customer' ? 'Shop' : 'Dashboard'}</Link>
            {user.role !== 'customer' && <Link className="btn g sm" href="/profile">Profile</Link>}
            <button className="btn g sm" onClick={logout}>Sign out</button>
          </>
        ) : (
          <>
            <Link className="btn g sm" href="/signup">Sign up</Link>
            <Link className="btn p" href="/login?next=/store">Start shopping</Link>
          </>
        )}
      </div>
    </nav>
  )
}
