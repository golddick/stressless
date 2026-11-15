import { eq } from 'drizzle-orm'
import { ownerAccounts } from '@/server/db/schema'
import { route, fail, requireRole, useDB, logActivity } from '@/server/kit'

// Suspending an owner blocks their stores: sign-in, new sessions, scanning and checkout all check the owner status.
export const POST = route(async (_req, { params }) => {
  const admin = await requireRole(['super_admin'])
  const [row] = await useDB().update(ownerAccounts).set({ status: 'active' }).where(eq(ownerAccounts.id, params.id)).returning()
  if (!row) throw fail(404, 'Owner not found.')
  await logActivity({ ownerId: params.id, actorId: admin.id, action: 'owner_reactivate', targetType: 'owner', targetId: params.id })
  return row
})
