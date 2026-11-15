import { eq } from 'drizzle-orm'
import { orderItems, orders, stores, users } from '@/server/db/schema'
import { exitLookupSchema } from '@/shared/schemas'
import { route, body, parse, fail, rateLimit, requireRole, useDB } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['exit_staff', 'manager', 'owner'])
  rateLimit(req, 'exit-lookup', 60, 60_000, user.id)
  const { token } = parse(exitLookupSchema, await body(req))
  const db = useDB()
  const [row] = await db.select({ order: orders, store: stores, customer: users.name }).from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId)).innerJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.exitToken, token)).limit(1)
  if (!row) throw fail(404, 'This pass was not found.', 'pass_not_found')
  if (row.store.ownerId !== user.ownerId || (user.storeIds && !user.storeIds.includes(row.store.id)))
    throw fail(403, 'This pass belongs to another store.', 'wrong_store')
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.order.id))
  const { exitToken, ...order } = row.order
  return { order, items, customer: row.customer, store: row.store.name, usable: order.status === 'paid' && !order.exitUsedAt }
})
