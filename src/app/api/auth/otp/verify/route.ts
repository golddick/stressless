import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { otpCodes, users } from '@/server/db/schema'
import { otpVerifySchema } from '@/shared/schemas'
import { route, body, parse, fail, rateLimit, useDB, hashOtp, safeEqual, buildSessionUser, setSession } from '@/server/kit'

export const POST = route(async (req) => {
  const { identifier, code, name } = parse(otpVerifySchema, await body(req))
  rateLimit(req, 'otp-verify', 10, 10 * 60_000, identifier)
  const db = useDB()
  const [row] = await db.select().from(otpCodes)
    .where(and(eq(otpCodes.identifier, identifier), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt)).limit(1)
  if (!row || row.attempts >= 5) throw fail(400, 'That code has expired. Request a new one.')
  if (!safeEqual(row.codeHash, hashOtp(identifier, code))) {
    await db.update(otpCodes).set({ attempts: sql`${otpCodes.attempts} + 1` }).where(eq(otpCodes.id, row.id))
    throw fail(400, 'That code is not right.')
  }
  await db.delete(otpCodes).where(eq(otpCodes.identifier, identifier))

  const col = identifier.includes('@') ? users.email : users.phone
  let [user] = await db.select().from(users).where(eq(col, identifier)).limit(1)
  if (!user) {
    [user] = await db.insert(users).values({ name: name || null, role: 'customer', ...(identifier.includes('@') ? { email: identifier } : { phone: identifier }) }).returning()
  }
  if (user.status !== 'active') throw fail(403, 'This account is disabled.')
  const sessionUser = await buildSessionUser(db, user)
  await setSession(sessionUser)
  return { user: sessionUser }
})
