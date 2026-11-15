import { and, eq, inArray } from 'drizzle-orm'
import { stores } from '@/server/db/schema'
import { storeSchema } from '@/shared/schemas'
import { route, body, parse, adminScope, useDB, logActivity } from '@/server/kit'

export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const where = [eq(stores.ownerId, scope.ownerId), ...(scope.storeIds ? [inArray(stores.id, scope.storeIds)] : [])]
  return useDB().select().from(stores).where(and(...where)).orderBy(stores.name)
})

export const POST = route(async (req) => {
  const scope = await adminScope(req, { write: ['owner'] })
  const b = parse(storeSchema, await body(req))
  const [row] = await useDB().insert(stores).values({ ...b, ownerId: scope.ownerId }).returning()
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'store_created', targetType: 'store', targetId: row.id })
  return row
})
