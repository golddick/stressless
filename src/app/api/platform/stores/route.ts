import { eq } from 'drizzle-orm'
import { ownerAccounts, stores } from '@/server/db/schema'
import { platformStoreSchema } from '@/shared/schemas'
import { route, body, parse, requireRole, useDB, logActivity } from '@/server/kit'

export const GET = route(async () => {
  await requireRole(['super_admin'])
  return useDB().select({ id: stores.id, name: stores.name, address: stores.address, active: stores.active, taxRate: stores.taxRate, owner: ownerAccounts.businessName, ownerId: ownerAccounts.id, ownerStatus: ownerAccounts.status })
    .from(stores).innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId)).orderBy(ownerAccounts.businessName, stores.name)
})

// FR-A1: a Super Admin can create a store on behalf of an owner.
export const POST = route(async (req) => {
  const admin = await requireRole(['super_admin'])
  const b = parse(platformStoreSchema, await body(req))
  const [row] = await useDB().insert(stores).values(b).returning()
  await logActivity({ ownerId: b.ownerId, actorId: admin.id, action: 'store_created', targetType: 'store', targetId: row.id })
  return row
})
