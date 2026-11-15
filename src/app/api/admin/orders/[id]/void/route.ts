import { eq } from 'drizzle-orm'
import { orders } from '@/server/db/schema'
import { canTransition } from '@/shared/orderState'
import { loadScopedOrder } from '@/server/services/orderAccess'
import { route, fail, adminScope, useDB, logActivity, logOrderEvent } from '@/server/kit'

// Voids an order that was never paid.
export const POST = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const { order } = await loadScopedOrder(scope, params.id)
  if (order.status !== 'pending_payment' || !canTransition(order.status, 'abandoned')) throw fail(409, 'Only unpaid orders can be voided.')
  await useDB().update(orders).set({ status: 'abandoned' }).where(eq(orders.id, order.id))
  await logOrderEvent(order.id, 'voided', { by: scope.user.id })
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'order_voided', targetType: 'order', targetId: order.id })
  return { ok: true }
})
