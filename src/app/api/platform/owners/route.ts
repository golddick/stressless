import { eq, sql } from 'drizzle-orm'
import { ownerAccounts, stores, users } from '@/server/db/schema'
import { ownerCreateSchema } from '@/shared/schemas'
import { sendEmail } from '@/server/services/dropaphi'
import { route, body, parse, fail, requireRole, useDB, logActivity, env } from '@/server/kit'

export const GET = route(async () => {
  await requireRole(['super_admin'])
  return useDB().select({
    id: ownerAccounts.id, businessName: ownerAccounts.businessName, status: ownerAccounts.status, createdAt: ownerAccounts.createdAt,
    ownerName: users.name, email: users.email, stores: sql<number>`(select count(*)::int from ${stores} where ${stores.ownerId} = ${ownerAccounts.id})`
  }).from(ownerAccounts).innerJoin(users, eq(users.id, ownerAccounts.userId)).orderBy(ownerAccounts.businessName)
})

// FR-P1: create a store owner and invite them by email.
export const POST = route(async (req) => {
  const admin = await requireRole(['super_admin'])
  const b = parse(ownerCreateSchema, await body(req))
  const db = useDB()
  const [existing] = await db.select().from(users).where(eq(users.email, b.email)).limit(1)
  if (existing) throw fail(409, 'That email already has an account.')
  const owner = await db.transaction(async tx => {
    const [u] = await tx.insert(users).values({ name: b.name, email: b.email, role: 'owner' }).returning()
    const [o] = await tx.insert(ownerAccounts).values({ userId: u.id, businessName: b.businessName, createdBy: admin.id }).returning()
    return o
  })
  await sendEmail(b.email, 'Your stressless business account is ready', `<p>Hi ${b.name}, ${b.businessName} has been set up on stressless. Sign in at ${env().appUrl}/login with this email address.</p>`)
  await logActivity({ ownerId: owner.id, actorId: admin.id, action: 'owner_created', targetType: 'owner', targetId: owner.id })
  return owner
})
