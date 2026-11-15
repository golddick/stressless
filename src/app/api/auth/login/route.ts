import { eq } from 'drizzle-orm'
import { users } from '@/server/db/schema'
import { passwordLoginSchema } from '@/shared/schemas'
import { route, body, parse, fail, rateLimit, useDB, buildSessionUser, verifyPassword, setSession } from '@/server/kit'

export const POST = route(async (req) => {
  const { identifier, password } = parse(passwordLoginSchema, await body(req))
  rateLimit(req, 'password-login', 10, 10 * 60_000, identifier)
  const db = useDB()
  const col = identifier.includes('@') ? users.email : users.phone
  const [user] = await db.select().from(users).where(eq(col, identifier)).limit(1)
  if (!user) throw fail(401, 'Email/phone or password is incorrect.')
  if (user.status !== 'active') throw fail(403, 'This account has been disabled. Contact support.', 'disabled')
  if (!user.passwordHash) throw fail(401, 'This account has no password yet. Use the one-time code sign in flow or reset your password.')
  if (!verifyPassword(password, user.passwordHash)) throw fail(401, 'Email/phone or password is incorrect.')
  const sessionUser = await buildSessionUser(db, user)
  await setSession(sessionUser)
  return { user: sessionUser }
})
