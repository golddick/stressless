export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { users } from '@/server/db/schema'
import { useDB } from '@/server/utils/db'
import { COOKIE, readSession } from '@/server/utils/sessionToken'

const CUSTOMER = ['/store', '/scan', '/cart', '/pay', '/exit-pass', '/orders']
const home = (role: string) => (role === 'super_admin' ? '/platform' : role === 'owner' || role === 'manager' ? '/admin' : role === 'exit_staff' ? '/admin/exit' : '/store')

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname
  const area = p.startsWith('/platform') ? 'platform' : p.startsWith('/admin') ? 'admin' : CUSTOMER.some(x => p === x || p.startsWith(x + '/')) ? 'customer' : null
  if (!area) return NextResponse.next()

  const sessionToken = req.cookies.get(COOKIE)?.value
  const user = await readSession(sessionToken)
  if (!user) {
    const url = req.nextUrl.clone(); url.pathname = '/login'; url.search = `?next=${encodeURIComponent(p + req.nextUrl.search)}`
    return NextResponse.redirect(url)
  }

  const db = useDB()
  const [row] = await db.select({ status: users.status, passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1)
  if (!row || row.status !== 'active') {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE)
    return res
  }

  if (['owner', 'manager', 'exit_staff'].includes(user.role) && !row.passwordHash) {
    const url = req.nextUrl.clone(); url.pathname = '/profile'; url.search = '?setup=1'
    return NextResponse.redirect(url)
  }

  const ok =
    area === 'customer' ? user.role === 'customer'
    : area === 'platform' ? user.role === 'super_admin'
    : user.role === 'exit_staff' ? p === '/admin/exit' : ['owner', 'manager', 'super_admin'].includes(user.role)
  if (!ok) { const url = req.nextUrl.clone(); url.pathname = home(user.role); url.search = ''; return NextResponse.redirect(url) }
  return NextResponse.next()
}

export const config = { matcher: ['/store/:path*', '/scan', '/cart', '/pay', '/exit-pass/:path*', '/orders/:path*', '/admin/:path*', '/platform/:path*'] }
