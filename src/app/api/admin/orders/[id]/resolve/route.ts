import { eq } from 'drizzle-orm'
import { orders } from '@/server/db/schema'
import { noteSchema } from '@/shared/schemas'
import { loadScopedOrder } from '@/server/services/orderAccess'
import { route, body, parse, fail, adminScope, useDB, logActivity, logOrderEvent } from '@/server/kit'

// A manager reviews a flagged order and resolves it (Flagged -> Verified -> Completed).
export const POST = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const { note } = parse(noteSchema, await body(req))
  const { order } = await loadScopedOrder(scope, params.id)
  if (order.status !== 'flagged') throw fail(409, 'Only flagged orders can be resolved.')
  await useDB().update(orders).set({ status: 'completed' }).where(eq(orders.id, order.id))
  await logOrderEvent(order.id, 'flag_resolved', { by: scope.user.id, note })
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'flag_resolved', targetType: 'order', targetId: order.id, detail: { note } })
  return { ok: true }
})
