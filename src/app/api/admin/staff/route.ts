import { and, eq, inArray } from 'drizzle-orm'
import { storeStaff, stores, users } from '@/server/db/schema'
import { staffInviteSchema } from '@/shared/schemas'
import { sendEmail } from '@/server/services/dropaphi'
import { route, body, parse, fail, adminScope, scopedStore, useDB, logActivity, env } from '@/server/kit'

export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const where = [eq(stores.ownerId, scope.ownerId), ...(scope.storeIds ? [inArray(stores.id, scope.storeIds)] : [])]
  return useDB().select({ userId: users.id, name: users.name, email: users.email, status: users.status, role: storeStaff.role, storeId: stores.id, store: stores.name })
    .from(storeStaff).innerJoin(users, eq(users.id, storeStaff.userId)).innerJoin(stores, eq(stores.id, storeStaff.storeId)).where(and(...where))
})

export const POST = route(async (req) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const b = parse(staffInviteSchema, await body(req))
  if (scope.user.role === 'manager' && b.role !== 'exit_staff') throw fail(403, 'Managers can only add exit staff.')
  const db = useDB()
  for (const id of b.storeIds) await scopedStore(db, scope, id)
  let [u] = await db.select().from(users).where(eq(users.email, b.email)).limit(1)
  if (u && !['manager', 'exit_staff'].includes(u.role)) throw fail(409, 'That email already belongs to another kind of account.')
  if (!u) [u] = await db.insert(users).values({ name: b.name, email: b.email, role: b.role }).returning()
  else await db.update(users).set({ role: b.role, status: 'active' }).where(eq(users.id, u.id))
  await db.insert(storeStaff).values(b.storeIds.map(storeId => ({ userId: u.id, storeId, role: b.role }))).onConflictDoNothing()
  await sendEmail(b.email, 'You have been added to stressless', `<p>Hi ${b.name}, sign in at ${env().appUrl}/login with this email address to start.</p>`)
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'staff_added', targetType: 'user', targetId: u.id, detail: { role: b.role } })
  return { id: u.id }
})
