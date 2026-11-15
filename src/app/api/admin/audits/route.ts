import { and, desc, eq, inArray } from 'drizzle-orm'
import { audits, stores, users } from '@/server/db/schema'
import { route, adminScope, useDB } from '@/server/kit'

export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const where = [eq(stores.ownerId, scope.ownerId), ...(scope.storeIds ? [inArray(stores.id, scope.storeIds)] : [])]
  return useDB().select({ id: audits.id, orderId: audits.orderId, outcome: audits.outcome, note: audits.note, at: audits.at, store: stores.name, staff: users.name })
    .from(audits).innerJoin(stores, eq(stores.id, audits.storeId)).innerJoin(users, eq(users.id, audits.staffId)).where(and(...where)).orderBy(desc(audits.at)).limit(200)
})
