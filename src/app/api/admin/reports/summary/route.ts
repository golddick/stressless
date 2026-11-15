import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { inventory, orderItems, orders, stores } from '@/server/db/schema'
import { PAID_STATUSES } from '@/shared/orderState'
import { route, query, adminScope, useDB } from '@/server/kit'

// Sales, top products, flagged orders and verification rates (FR-A8).
export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const q = query(req)
  const db = useDB()
  const from = q.from ? new Date(q.from) : new Date(Date.now() - 30 * 86400_000)
  const to = q.to ? new Date(q.to) : new Date()
  const scopedStores = [eq(stores.ownerId, scope.ownerId)]
  if (scope.storeIds) scopedStores.push(inArray(stores.id, scope.storeIds))
  if (q.storeId) scopedStores.push(eq(stores.id, q.storeId))
  const base = [...scopedStores, gte(orders.createdAt, from), lte(orders.createdAt, to)]
  const paid = and(...base, inArray(orders.status, PAID_STATUSES))
  const allTimePaid = and(...scopedStores, inArray(orders.status, PAID_STATUSES))

  const [[totals], [allTimeSales]] = await Promise.all([
    db.select({ orders: sql<number>`count(*)::int`, revenueMinor: sql<number>`coalesce(sum(${orders.totalMinor}),0)::int`, taxMinor: sql<number>`coalesce(sum(${orders.taxMinor}),0)::int` })
      .from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(paid),
    db.select({ subtotalMinor: sql<number>`coalesce(sum(${orders.subtotalMinor}),0)::int` })
      .from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(allTimePaid)
  ])
  const daily = await db.select({ day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`, revenueMinor: sql<number>`sum(${orders.totalMinor})::int`, orders: sql<number>`count(*)::int` })
    .from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(paid).groupBy(sql`1`).orderBy(sql`1`)
  const top = await db.select({ name: orderItems.name, units: sql<number>`sum(${orderItems.quantity})::int`, revenueMinor: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceMinor})::int` })
    .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).innerJoin(stores, eq(stores.id, orders.storeId)).where(paid)
    .groupBy(orderItems.name).orderBy(sql`3 desc`).limit(10)
  const status = await db.select({ status: orders.status, n: sql<number>`count(*)::int` }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).where(and(...base)).groupBy(orders.status)
  const n = (s: string) => status.find(x => x.status === s)?.n ?? 0
  const checked = n('verified') + n('completed') + n('flagged')
  const [low] = await db.select({ n: sql<number>`count(*)::int` }).from(inventory).innerJoin(stores, eq(stores.id, inventory.storeId))
    .where(and(eq(stores.ownerId, scope.ownerId), sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`, scope.storeIds ? inArray(stores.id, scope.storeIds) : undefined))
  return {
    from, to, ...totals, allTimeSubtotalMinor: allTimeSales.subtotalMinor, daily, top,
    flagged: n('flagged'), refunded: n('refunded'), lowStock: low?.n ?? 0,
    verification: { checked, flagged: n('flagged'), flagRate: checked ? n('flagged') / checked : 0 }
  }
})
