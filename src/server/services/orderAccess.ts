import { eq } from 'drizzle-orm'
import { orders, stores, users } from '../db/schema'
import type { Scope } from '../utils/auth'
import { useDB } from '../utils/db'
import { fail } from '../utils/http'

/** Loads an order only if it belongs to the caller's owner (and, for managers, their stores). */
export async function loadScopedOrder(scope: Scope, id: string) {
  const [o] = await useDB().select({ order: orders, store: stores.name, ownerId: stores.ownerId, customer: users.name, email: users.email }).from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId)).innerJoin(users, eq(users.id, orders.userId)).where(eq(orders.id, id)).limit(1)
  if (!o || o.ownerId !== scope.ownerId || (scope.storeIds && !scope.storeIds.includes(o.order.storeId))) throw fail(404, 'Order not found.')
  return o
}
