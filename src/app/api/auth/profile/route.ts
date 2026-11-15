import { eq } from 'drizzle-orm'
import { users } from '@/server/db/schema'
import { profileUpdateSchema } from '@/shared/schemas'
import { route, body, parse, fail, requireRole, useDB, hashPassword, verifyPassword, setSession, buildSessionUser, clearSession } from '@/server/kit'

export const GET = route(async () => {
  const user = await requireRole(['owner', 'manager', 'super_admin', 'exit_staff', 'customer'])
  const db = useDB()
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (!row) throw fail(404, 'User not found.')
  return { user: { id: row.id, name: row.name, email: row.email, phone: row.phone, image: row.image, age: row.age, sex: row.sex, role: row.role, status: row.status, hasPassword: !!row.passwordHash } }
})

export const PATCH = route(async (req) => {
  const current = await requireRole(['owner', 'manager', 'super_admin', 'exit_staff', 'customer'])
  const db = useDB()
  const payload = parse(profileUpdateSchema, await body(req))
  const [row] = await db.select().from(users).where(eq(users.id, current.id)).limit(1)
  if (!row) throw fail(404, 'User not found.')

  if (payload.disableAccount === true) {
    if (row.passwordHash) {
      if (!payload.currentPassword) throw fail(400, 'Current password is required to disable your account.')
      if (!verifyPassword(payload.currentPassword, row.passwordHash)) throw fail(401, 'Current password is incorrect.')
    }
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, current.id))
    await clearSession()
    return { ok: true, disabled: true }
  }

  let newPasswordHash = row.passwordHash
  if (payload.newPassword) {
    if (row.passwordHash) {
      if (!payload.currentPassword) throw fail(400, 'Current password is required to change your password.')
      if (!verifyPassword(payload.currentPassword, row.passwordHash)) throw fail(401, 'Current password is incorrect.')
    }
    newPasswordHash = hashPassword(payload.newPassword)
  }

  const updates: any = {}
  if (payload.name !== undefined) updates.name = payload.name || null
  if (payload.email !== undefined) updates.email = payload.email || null
  if (payload.phone !== undefined) updates.phone = payload.phone || null
  if (payload.age !== undefined) updates.age = payload.age
  if (payload.sex !== undefined) updates.sex = payload.sex
  if (payload.newPassword) updates.passwordHash = newPasswordHash

  if (Object.keys(updates).length) {
    await db.update(users).set(updates).where(eq(users.id, current.id))
  }

  const refreshed = await db.select().from(users).where(eq(users.id, current.id)).limit(1)
  const updated = refreshed[0]
  const sessionUser = await buildSessionUser(db, updated)
  await setSession(sessionUser)
  return { user: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, image: updated.image, age: updated.age, sex: updated.sex, role: updated.role, status: updated.status, hasPassword: !!updated.passwordHash } }
})
