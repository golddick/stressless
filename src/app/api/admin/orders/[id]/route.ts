import { and, desc, eq } from 'drizzle-orm'
import { exitVerifications, orderEvents, orderItems, payments, users } from '@/server/db/schema'
import { loadScopedOrder } from '@/server/services/orderAccess'
import { route, adminScope, assertOwnerActive, fail, requireRole, useDB } from '@/server/kit'

export const GET = route(async (req, { params }) => {
  const user = await requireRole(['super_admin', 'owner', 'manager', 'exit_staff'])
  const isExitStaff = user.role === 'exit_staff'
  if (isExitStaff) await assertOwnerActive(useDB(), user.ownerId!)
  const scope = isExitStaff
    ? { user, ownerId: user.ownerId!, storeIds: user.storeIds ?? [] }
    : await adminScope(req)
  const db = useDB()
  const o = await loadScopedOrder(scope, params.id)
  const verifications = await db.select({
    id: exitVerifications.id,
    orderId: exitVerifications.orderId,
    staffId: exitVerifications.staffId,
    result: exitVerifications.result,
    note: exitVerifications.note,
    at: exitVerifications.at,
    staffName: users.name,
    staffEmail: users.email
  }).from(exitVerifications)
    .innerJoin(users, eq(users.id, exitVerifications.staffId))
    .where(and(
      eq(exitVerifications.orderId, o.order.id),
      ...(isExitStaff ? [eq(exitVerifications.staffId, user.id)] : [])
    )).orderBy(desc(exitVerifications.at))
  if (isExitStaff && !verifications.length) throw fail(404, 'Order not found.')
  const { exitToken, ...order } = o.order
  const [items, [payment], events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(desc(orderEvents.at))
  ])
  return { ...order, store: o.store, customer: o.customer, email: o.email, items, payment, verifications, events }
})
