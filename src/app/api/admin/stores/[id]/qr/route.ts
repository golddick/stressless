import { eq } from 'drizzle-orm'
import { stores } from '@/server/db/schema'
import { route, adminScope, scopedStore, useDB, logActivity, newId } from '@/server/kit'

// Rotates the entrance QR token (the old printed code stops working).
export const POST = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner'] })
  const db = useDB()
  const store = await scopedStore(db, scope, params.id)
  const [row] = await db.update(stores).set({ qrToken: newId('qr') }).where(eq(stores.id, store.id)).returning()
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'store_qr_rotated', targetType: 'store', targetId: store.id })
  return row
})
