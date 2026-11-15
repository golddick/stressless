import { and, eq } from 'drizzle-orm'
import { ownerAccounts, shoppingSessions, stores } from '@/server/db/schema'
import { startSessionSchema } from '@/shared/schemas'
import { route, body, parse, fail, rateLimit, requireRole, useDB } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['customer'])
  rateLimit(req, 'session-start', 20, 60_000, user.id)
  const b = parse(startSessionSchema, await body(req))
  const db = useDB()
  const [row] = await db.select({ store: stores, ownerStatus: ownerAccounts.status }).from(stores)
    .innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId))
    .where(b.storeToken ? eq(stores.qrToken, b.storeToken) : eq(stores.id, b.storeId!)).limit(1)
  if (!row || !row.store.active) throw fail(404, 'We could not find that store.')
  if (row.ownerStatus !== 'active') throw fail(403, 'This store is not open for scanning right now.', 'store_closed')
  // a session belongs to one store: close any other active session first
  await db.update(shoppingSessions).set({ status: 'expired' })
    .where(and(eq(shoppingSessions.userId, user.id), eq(shoppingSessions.status, 'active')))
  const [session] = await db.insert(shoppingSessions).values({ userId: user.id, storeId: row.store.id }).returning()
  return { session, store: { id: row.store.id, name: row.store.name, address: row.store.address } }
})
