import { eq } from 'drizzle-orm'
import { ownerAccounts, users } from '@/server/db/schema'
import { ownerPatchSchema } from '@/shared/schemas'
import { route, body, parse, fail, requireRole, useDB, logActivity } from '@/server/kit'

export const PATCH = route(async (req, { params }) => {
  const admin = await requireRole(['super_admin'])
  const b = parse(ownerPatchSchema, await body(req))
  const db = useDB()
  const [o] = await db.select().from(ownerAccounts).where(eq(ownerAccounts.id, params.id)).limit(1)
  if (!o) throw fail(404, 'Owner not found.')
  if (b.businessName) await db.update(ownerAccounts).set({ businessName: b.businessName }).where(eq(ownerAccounts.id, params.id))
  if (b.name || b.email) await db.update(users).set({ ...(b.name && { name: b.name }), ...(b.email && { email: b.email }) }).where(eq(users.id, o.userId))
  await logActivity({ ownerId: params.id, actorId: admin.id, action: 'owner_updated', targetType: 'owner', targetId: params.id, detail: b })
  return { ok: true }
})
