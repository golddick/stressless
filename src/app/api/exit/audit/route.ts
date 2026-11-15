import { eq } from 'drizzle-orm'
import { audits, stores } from '@/server/db/schema'
import { auditSchema } from '@/shared/schemas'
import { notifyStoreTeam } from '@/server/services/notify'
import { route, body, parse, fail, requireRole, useDB } from '@/server/kit'

// Records the outcome of a random spot check (FR-A5).
export const POST = route(async (req) => {
  const user = await requireRole(['exit_staff', 'manager', 'owner'])
  const b = parse(auditSchema, await body(req))
  const db = useDB()
  const [s] = await db.select().from(stores).where(eq(stores.id, b.storeId)).limit(1)
  if (!s || s.ownerId !== user.ownerId || (user.storeIds && !user.storeIds.includes(s.id))) throw fail(403, 'That store is not assigned to you.')
  const [row] = await db.insert(audits).values({ ...b, staffId: user.id }).returning()
  if (b.outcome === 'fail') await notifyStoreTeam(s.id, 'spot_check_failed', `A spot check failed at ${s.name}${b.orderId ? ` (order ${b.orderId})` : ''}.`, 'Spot check failed')
  return row
})
