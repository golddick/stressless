import { and, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm'
import { orders, stores, users } from '@/server/db/schema'
import { route, query, adminScope, useDB } from '@/server/kit'

export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const q = query(req)
  const where = [eq(stores.ownerId, scope.ownerId)]
  if (scope.storeIds) where.push(inArray(stores.id, scope.storeIds))
  if (q.storeId) where.push(eq(stores.id, q.storeId))
  if (q.status) where.push(eq(orders.status, q.status as any))
  if (q.from) where.push(gte(orders.createdAt, new Date(q.from)))
  if (q.to) where.push(lte(orders.createdAt, new Date(q.to)))
  if (q.q) where.push(or(ilike(orders.id, `%${q.q}%`), ilike(users.name, `%${q.q}%`), ilike(users.email, `%${q.q}%`))!)
  return useDB().select({ id: orders.id, status: orders.status, subtotalMinor: orders.subtotalMinor, taxMinor: orders.taxMinor, totalMinor: orders.totalMinor, createdAt: orders.createdAt, store: stores.name, customer: users.name, email: users.email })
    .from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).innerJoin(users, eq(users.id, orders.userId))
    .where(and(...where)).orderBy(desc(orders.createdAt)).limit(Math.min(+(q.limit || 100), 300)).offset(+(q.offset || 0))
})
