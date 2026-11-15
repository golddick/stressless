import { eq } from 'drizzle-orm'
import { exitVerifications, orders, stores } from '@/server/db/schema'
import { exitVerifySchema } from '@/shared/schemas'
import { canTransition } from '@/shared/orderState'
import { notifyStoreTeam } from '@/server/services/notify'
import { route, body, parse, fail, requireRole, useDB, logOrderEvent, getSetting } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['exit_staff', 'manager', 'owner'])
  const { token, result, note } = parse(exitVerifySchema, await body(req))
  const db = useDB()
  const outcome = await db.transaction(async tx => {
    const [o] = await tx.select().from(orders).where(eq(orders.exitToken, token)).for('update').limit(1)
    if (!o) throw fail(404, 'This pass was not found.', 'pass_not_found')
    const [s] = await tx.select().from(stores).where(eq(stores.id, o.storeId)).limit(1)
    if (s.ownerId !== user.ownerId || (user.storeIds && !user.storeIds.includes(s.id))) throw fail(403, 'This pass belongs to another store.', 'wrong_store')
    if (o.exitUsedAt || !canTransition(o.status, result)) throw fail(409, 'This pass has already been used or is not valid.', 'pass_used')
    // single use: the token is consumed on the first verify or flag
    await tx.update(orders).set({ status: result, exitUsedAt: new Date() }).where(eq(orders.id, o.id))
    await tx.insert(exitVerifications).values({ orderId: o.id, staffId: user.id, result, note })
    if (result === 'verified') await tx.update(orders).set({ status: 'completed' }).where(eq(orders.id, o.id))
    return { order: o, store: s }
  })
  await logOrderEvent(outcome.order.id, result === 'verified' ? 'exit_verified' : 'exit_flagged', { staffId: user.id, note })
  if (result === 'flagged') await notifyStoreTeam(outcome.store.id, 'flagged_order', `Order ${outcome.order.id} was flagged at the exit${note ? `: ${note}` : '.'}`, 'Flagged order')
  const rate = await getSetting('spot_check_rate', 0.1)
  return { ok: true, result, spotCheck: result === 'verified' && Math.random() < rate, orderId: outcome.order.id, storeId: outcome.store.id }
})
