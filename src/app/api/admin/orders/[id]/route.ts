import { desc, eq } from 'drizzle-orm'
import { exitVerifications, orderEvents, orderItems, payments } from '@/server/db/schema'
import { loadScopedOrder } from '@/server/services/orderAccess'
import { route, adminScope, useDB } from '@/server/kit'

export const GET = route(async (req, { params }) => {
  const scope = await adminScope(req)
  const db = useDB()
  const o = await loadScopedOrder(scope, params.id)
  const { exitToken, ...order } = o.order
  const [items, [payment], verifications, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1),
    db.select().from(exitVerifications).where(eq(exitVerifications.orderId, order.id)).orderBy(desc(exitVerifications.at)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(desc(orderEvents.at))
  ])
  return { ...order, store: o.store, customer: o.customer, email: o.email, items, payment, verifications, events }
})
