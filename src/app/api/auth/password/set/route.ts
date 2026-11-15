import { eq } from 'drizzle-orm'
import { users } from '@/server/db/schema'
import { passwordSetSchema } from '@/shared/schemas'
import { route, body, parse, fail, requireRole, useDB, hashPassword, verifyPassword } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['owner', 'manager', 'exit_staff', 'customer'])
  const { currentPassword, newPassword } = parse(passwordSetSchema, await body(req))
  const db = useDB()
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (!row) throw fail(404, 'User not found.')
  if (row.passwordHash && currentPassword === undefined) throw fail(400, 'Current password is required.')
  if (row.passwordHash && currentPassword && !verifyPassword(currentPassword, row.passwordHash)) throw fail(401, 'Current password is incorrect.')
  await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, user.id))
  return { ok: true }
})
