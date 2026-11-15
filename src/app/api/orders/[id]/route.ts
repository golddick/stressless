import { and, eq } from 'drizzle-orm'
import { orderItems, orders, payments, stores } from '@/server/db/schema'
import { route, fail, requireRole, useDB } from '@/server/kit'

export const GET = route(async (_req, { params }) => {
  const user = await requireRole(['customer'])
  const db = useDB()
  const [o] = await db.select({ order: orders, store: stores.name, address: stores.address }).from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(and(eq(orders.id, params.id), eq(orders.userId, user.id))).limit(1)
  if (!o) throw fail(404, 'Order not found.')
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.order.id))
  const [pay] = await db.select({ status: payments.status, paidAt: payments.paidAt }).from(payments).where(eq(payments.orderId, o.order.id)).limit(1)
  const { exitToken, ...order } = o.order
  // the exit pass token is only revealed for paid, unused orders at the exit
  const showPass = ['paid', 'flagged'].includes(order.status) && !order.exitUsedAt
  return { ...order, store: o.store, address: o.address, items, payment: pay, exitToken: showPass ? exitToken : null }
})
