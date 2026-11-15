import { desc, eq } from 'drizzle-orm'
import { orders, stores } from '@/server/db/schema'
import { route, requireRole, useDB } from '@/server/kit'

export const GET = route(async () => {
  const user = await requireRole(['customer'])
  return useDB().select({ id: orders.id, status: orders.status, totalMinor: orders.totalMinor, createdAt: orders.createdAt, store: stores.name })
    .from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(100)
})
