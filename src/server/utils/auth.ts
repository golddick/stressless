import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { ownerAccounts, storeStaff, stores, users } from '../db/schema'
import { useDB, type DB } from './db'
import { fail } from './http'
import { logActivity } from './activity'
import { COOKIE, readSession, signSession, type Role, type SessionUser } from './sessionToken'

export type { Role, SessionUser }

export const hashOtp = (identifier: string, code: string) =>
  createHash('sha256').update(`${identifier}:${code}:${process.env.SESSION_PASSWORD}`).digest('hex')

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return `${salt}:${hash}`
}

export const verifyPassword = (password: string, stored?: string | null) => {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return safeEqual(candidate, hash)
}

export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function setSession(user: SessionUser) {
  (await cookies()).set(COOKIE, await signSession(user), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400
  })
}
export async function clearSession() { (await cookies()).delete(COOKIE) }
export async function getSessionUser() { return readSession((await cookies()).get(COOKIE)?.value) }

/** Builds the session user. Blocks suspended owners and everyone who works for them. */
export async function buildSessionUser(db: DB, u: typeof users.$inferSelect): Promise<SessionUser> {
  if (u.status !== 'active') throw fail(403, 'This account has been disabled. Contact support.', 'disabled')
  const base = { id: u.id, name: u.name, email: u.email, role: u.role as Role, status: u.status }
  if (u.role === 'owner') {
    const [o] = await db.select().from(ownerAccounts).where(eq(ownerAccounts.userId, u.id)).limit(1)
    if (!o) throw fail(403, 'No business account is linked to this user.')
    if (o.status !== 'active') throw fail(403, 'This business account is suspended. Contact stressless support.', 'suspended')
    return { ...base, ownerId: o.id, hasPassword: !!u.passwordHash }
  }
  if (u.role === 'manager' || u.role === 'exit_staff') {
    const rows = await db.select({ storeId: storeStaff.storeId, ownerId: stores.ownerId, status: ownerAccounts.status })
      .from(storeStaff).innerJoin(stores, eq(stores.id, storeStaff.storeId))
      .innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId)).where(eq(storeStaff.userId, u.id))
    if (!rows.length) throw fail(403, 'You are not assigned to a store yet.')
    if (rows[0].status !== 'active') throw fail(403, 'This business account is suspended. Contact stressless support.', 'suspended')
    return { ...base, ownerId: rows[0].ownerId, storeIds: rows.map(r => r.storeId), hasPassword: !!u.passwordHash }
  }
  return { ...base, hasPassword: !!u.passwordHash }
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw fail(401, 'Please sign in.', 'unauthenticated')
  if (!roles.includes(user.role)) throw fail(403, 'You do not have access to this.')
  if (user.status && user.status !== 'active') throw fail(403, 'This account has been disabled. Contact support.', 'disabled')
  return { ...user, hasPassword: user.hasPassword }
}

export async function assertOwnerActive(db: DB, ownerId: string) {
  const [o] = await db.select({ status: ownerAccounts.status }).from(ownerAccounts).where(eq(ownerAccounts.id, ownerId)).limit(1)
  if (!o || o.status !== 'active') throw fail(403, 'This business account is suspended.', 'suspended')
}

export interface Scope { user: SessionUser; ownerId: string; storeIds: string[] | null }

/**
 * Every admin query is scoped by owner (FR-P4). Managers are further limited to their stores.
 * A Super Admin gets a read-only support view via ?ownerId=..., and each view is audit-logged.
 */
export async function adminScope(req: NextRequest, opts: { write?: Role[] } = {}): Promise<Scope> {
  const user = await requireRole(['super_admin', 'owner', 'manager'])
  const db = useDB()
  let ownerId = user.ownerId
  if (user.role === 'super_admin') {
    if (req.method !== 'GET') throw fail(403, 'The support view is read-only.')
    ownerId = req.nextUrl.searchParams.get('ownerId') || ''
    if (!ownerId) throw fail(400, 'ownerId is required for the support view.')
    await logActivity({ ownerId, actorId: user.id, action: 'support_view', targetType: 'path', targetId: req.nextUrl.pathname })
  } else {
    if (opts.write && req.method !== 'GET' && !opts.write.includes(user.role)) throw fail(403, 'You do not have access to this.')
    await assertOwnerActive(db, ownerId!)
  }
  return { user, ownerId: ownerId!, storeIds: user.role === 'manager' ? user.storeIds ?? [] : null }
}

/** Returns the store if it belongs to the scope's owner (and, for managers, to their stores). */
export async function scopedStore(db: DB, scope: Scope, storeId: string) {
  if (scope.storeIds && !scope.storeIds.includes(storeId)) throw fail(403, 'That store is not assigned to you.')
  const [s] = await db.select().from(stores).where(and(eq(stores.id, storeId), eq(stores.ownerId, scope.ownerId))).limit(1)
  if (!s) throw fail(404, 'Store not found.')
  return s
}
