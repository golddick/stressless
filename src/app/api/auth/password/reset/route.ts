import { and, desc, eq, gt } from 'drizzle-orm'
import { otpCodes, users } from '@/server/db/schema'
import { passwordResetSchema } from '@/shared/schemas'
import { route, body, parse, fail, rateLimit, useDB, hashOtp, safeEqual, hashPassword } from '@/server/kit'

export const POST = route(async (req) => {
  const { identifier, code, password } = parse(passwordResetSchema, await body(req))
  rateLimit(req, 'password-reset', 10, 10 * 60_000, identifier)
  const db = useDB()
  const [row] = await db.select().from(otpCodes)
    .where(and(eq(otpCodes.identifier, identifier), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt)).limit(1)
  if (!row || row.attempts >= 5) throw fail(400, 'That code has expired. Request a new one.')
  if (!safeEqual(row.codeHash, hashOtp(identifier, code))) {
    throw fail(400, 'That code is not right.')
  }
  const col = identifier.includes('@') ? users.email : users.phone
  const [user] = await db.select().from(users).where(eq(col, identifier)).limit(1)
  if (!user) throw fail(404, 'No account found for that email or phone.')
  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, user.id))
  await db.delete(otpCodes).where(eq(otpCodes.identifier, identifier))
  return { ok: true }
})
