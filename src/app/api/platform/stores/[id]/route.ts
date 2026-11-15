import { and, eq, inArray, sql } from 'drizzle-orm'
import { inventory, orders, ownerAccounts, storeStaff, stores, users } from '@/server/db/schema'
import { PAID_STATUSES } from '@/shared/orderState'
import { storeSchema } from '@/shared/schemas'
import { route, body, parse, fail, requireRole, useDB, logActivity } from '@/server/kit'

export const GET = route(async (_req, { params }) => {
  await requireRole(['super_admin'])
  const db = useDB()
  const [store] = await db.select({
    id: stores.id, ownerId: stores.ownerId, name: stores.name, address: stores.address,
    taxRate: stores.taxRate, hours: stores.hours, logoFile: stores.logoFile,
    active: stores.active, createdAt: stores.createdAt,
    owner: ownerAccounts.businessName, ownerStatus: ownerAccounts.status,
    ownerName: users.name, ownerEmail: users.email
  }).from(stores)
    .innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId))
    .innerJoin(users, eq(users.id, ownerAccounts.userId))
    .where(eq(stores.id, params.id)).limit(1)
  if (!store) throw fail(404, 'Store not found.')

  const [[sales], [orderCount], [inventoryCount], [staffCount]] = await Promise.all([
    db.select({
      subtotalMinor: sql<number>`coalesce(sum(${orders.subtotalMinor}), 0)::int`,
      taxMinor: sql<number>`coalesce(sum(${orders.taxMinor}), 0)::int`,
      totalMinor: sql<number>`coalesce(sum(${orders.totalMinor}), 0)::int`,
      paidOrders: sql<number>`count(*)::int`
    }).from(orders).where(and(eq(orders.storeId, store.id), inArray(orders.status, PAID_STATUSES))),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(eq(orders.storeId, store.id)),
    db.select({ count: sql<number>`count(*)::int` }).from(inventory).where(eq(inventory.storeId, store.id)),
    db.select({ count: sql<number>`count(*)::int` }).from(storeStaff).where(eq(storeStaff.storeId, store.id))
  ])
  return { store, sales, orderCount: orderCount.count, inventoryCount: inventoryCount.count, staffCount: staffCount.count }
})

export const PATCH = route(async (req, { params }) => {
  const admin = await requireRole(['super_admin'])
  const db = useDB()
  const [existing] = await db.select({ id: stores.id, ownerId: stores.ownerId })
    .from(stores).where(eq(stores.id, params.id)).limit(1)
  if (!existing) throw fail(404, 'Store not found.')
  const changes = parse(storeSchema.partial(), await body(req))
  const [store] = await db.update(stores).set(changes).where(eq(stores.id, existing.id)).returning()
  await logActivity({
    ownerId: existing.ownerId, actorId: admin.id, action: 'store_updated',
    targetType: 'store', targetId: existing.id, detail: changes
  })
  return store
})
