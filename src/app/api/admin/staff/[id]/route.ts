import { and, eq, inArray } from 'drizzle-orm'
import { storeStaff, stores, users } from '@/server/db/schema'
import { route, adminScope, useDB, logActivity } from '@/server/kit'

export const DELETE = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const db = useDB()
  const mine = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, scope.ownerId))
  const ids = mine.map(s => s.id).filter(id => !scope.storeIds || scope.storeIds.includes(id))
  await db.delete(storeStaff).where(and(eq(storeStaff.userId, params.id), inArray(storeStaff.storeId, ids)))
  const left = await db.select().from(storeStaff).where(eq(storeStaff.userId, params.id)).limit(1)
  if (!left.length) await db.update(users).set({ status: 'disabled' }).where(eq(users.id, params.id))
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'staff_removed', targetType: 'user', targetId: params.id })
  return { ok: true }
})
