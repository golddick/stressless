import { eq } from 'drizzle-orm'
import { notifications } from '@/server/db/schema'
import { route, requireRole, useDB } from '@/server/kit'

export const POST = route(async () => {
  const user = await requireRole(['owner', 'manager', 'exit_staff', 'super_admin'])
  await useDB().update(notifications).set({ read: true }).where(eq(notifications.userId, user.id))
  return { ok: true }
})
