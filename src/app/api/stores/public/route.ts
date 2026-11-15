import { and, eq } from 'drizzle-orm'
import { ownerAccounts, stores } from '@/server/db/schema'
import { route, requireRole, useDB } from '@/server/kit'

// Lets a signed-in customer pick a store from a list instead of scanning the entrance QR.
export const GET = route(async () => {
  await requireRole(['customer'])
  return useDB().select({ id: stores.id, name: stores.name, address: stores.address, hours: stores.hours })
    .from(stores).innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId))
    .where(and(eq(stores.active, true), eq(ownerAccounts.status, 'active'))).orderBy(stores.name)
})
