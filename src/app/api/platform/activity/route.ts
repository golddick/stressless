import { desc } from 'drizzle-orm'
import { activityLog } from '@/server/db/schema'
import { route, requireRole, useDB } from '@/server/kit'

export const GET = route(async () => {
  await requireRole(['super_admin'])
  return useDB().select().from(activityLog).orderBy(desc(activityLog.at)).limit(100)
})
