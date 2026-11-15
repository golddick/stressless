import { desc, eq } from 'drizzle-orm'
import { notifications } from '@/server/db/schema'
import { route, requireRole, useDB } from '@/server/kit'

export const GET = route(async () => {
  const user = await requireRole(['owner', 'manager', 'exit_staff', 'super_admin'])
  return useDB().select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50)
})
