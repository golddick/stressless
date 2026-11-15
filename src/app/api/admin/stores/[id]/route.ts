import { eq } from 'drizzle-orm'
import { stores } from '@/server/db/schema'
import { storeSchema } from '@/shared/schemas'
import { route, body, parse, adminScope, scopedStore, useDB, logActivity } from '@/server/kit'

export const PATCH = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner'] })
  const db = useDB()
  const store = await scopedStore(db, scope, params.id)
  const b = parse(storeSchema.partial(), await body(req))
  const [row] = await db.update(stores).set(b).where(eq(stores.id, store.id)).returning()
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'store_updated', targetType: 'store', targetId: store.id, detail: b })
  return row
})
