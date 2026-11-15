import { and, desc, eq } from 'drizzle-orm'
import { ownerAccounts, shoppingSessions, stores } from '../db/schema'
import type { DB } from '../utils/db'
import { getSetting } from '../utils/activity'
import { fail } from '../utils/http'

/** The customer's active session; expires it after inactivity. */
export async function requireActiveSession(db: DB, userId: string) {
  const [row] = await db.select({ session: shoppingSessions, store: stores, ownerStatus: ownerAccounts.status })
    .from(shoppingSessions).innerJoin(stores, eq(stores.id, shoppingSessions.storeId))
    .innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId))
    .where(and(eq(shoppingSessions.userId, userId), eq(shoppingSessions.status, 'active')))
    .orderBy(desc(shoppingSessions.startedAt)).limit(1)
  if (!row) throw fail(409, 'Scan a store code to start shopping.', 'no_session')
  const idle = await getSetting('session_idle_minutes', 30)
  if (Date.now() - row.session.lastActiveAt.getTime() > idle * 60_000) {
    await db.update(shoppingSessions).set({ status: 'expired' }).where(eq(shoppingSessions.id, row.session.id))
    throw fail(409, 'Your session timed out. Scan the store code to start again.', 'session_expired')
  }
  if (row.ownerStatus !== 'active' || !row.store.active) throw fail(403, 'This store is not open for scanning right now.', 'store_closed')
  return { session: row.session, store: row.store }
}

export const touchSession = (db: DB, id: string) =>
  db.update(shoppingSessions).set({ lastActiveAt: new Date() }).where(eq(shoppingSessions.id, id))
