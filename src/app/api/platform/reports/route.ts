import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { orders, ownerAccounts, stores } from '@/server/db/schema'
import { PAID_STATUSES } from '@/shared/orderState'
import { route, query, requireRole, useDB } from '@/server/kit'

// FR-P2: platform-wide numbers across every owner.
export const GET = route(async (req) => {
  await requireRole(['super_admin'])
  const db = useDB()
  const since = new Date(Date.now() - (+(query(req).days || 30)) * 86400_000)
  const paid = and(gte(orders.createdAt, since), inArray(orders.status, PAID_STATUSES))
  const perOwner = await db.select({
    ownerId: ownerAccounts.id, business: ownerAccounts.businessName, status: ownerAccounts.status,
    orders: sql<number>`count(${orders.id})::int`,
    subtotalMinor: sql<number>`coalesce(sum(${orders.subtotalMinor}),0)::int`,
    taxMinor: sql<number>`coalesce(sum(${orders.taxMinor}),0)::int`,
    revenueMinor: sql<number>`coalesce(sum(${orders.totalMinor}),0)::int`
  }).from(ownerAccounts).leftJoin(stores, eq(stores.ownerId, ownerAccounts.id))
    .leftJoin(orders, and(eq(orders.storeId, stores.id), paid)).groupBy(ownerAccounts.id).orderBy(sql`4 desc`)
  const [counts] = await db.select({
    owners: sql<number>`(select count(*)::int from ${ownerAccounts})`, stores: sql<number>`(select count(*)::int from ${stores})`,
    flagged: sql<number>`(select count(*)::int from ${orders} where ${orders.status} = 'flagged')`
  }).from(sql`(select 1) x`)
  return {
    since, ...counts,
    orders: perOwner.reduce((s, o) => s + o.orders, 0),
    subtotalMinor: perOwner.reduce((s, o) => s + o.subtotalMinor, 0),
    taxMinor: perOwner.reduce((s, o) => s + o.taxMinor, 0),
    revenueMinor: perOwner.reduce((s, o) => s + o.revenueMinor, 0),
    perOwner
  }
})
