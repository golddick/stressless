import { eq } from 'drizzle-orm'
import { orders, payments } from '@/server/db/schema'
import { noteSchema } from '@/shared/schemas'
import { canTransition } from '@/shared/orderState'
import { refundPayment } from '@/server/services/payments'
import { loadScopedOrder } from '@/server/services/orderAccess'
import { route, body, parse, fail, adminScope, useDB, logActivity, logOrderEvent } from '@/server/kit'

export const POST = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const { note } = parse(noteSchema, await body(req))
  const db = useDB()
  const { order } = await loadScopedOrder(scope, params.id)
  if (!canTransition(order.status, 'refunded')) throw fail(409, 'This order cannot be refunded in its current state.')
  const [pay] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1)
  await refundPayment(pay.providerRef, order.totalMinor)
  await db.update(payments).set({ status: 'refunded' }).where(eq(payments.id, pay.id))
  await db.update(orders).set({ status: 'refunded' }).where(eq(orders.id, order.id))
  await logOrderEvent(order.id, 'refunded', { by: scope.user.id, note })
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'refund_issued', targetType: 'order', targetId: order.id, detail: { amount: order.totalMinor, note } })
  return { ok: true }
})
