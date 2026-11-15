import { platformSettings } from '@/server/db/schema'
import { settingsSchema } from '@/shared/schemas'
import { route, body, parse, requireRole, useDB, getSetting, logActivity } from '@/server/kit'

export const GET = route(async () => {
  await requireRole(['super_admin'])
  return {
    spot_check_rate: await getSetting('spot_check_rate', 0.1),
    session_idle_minutes: await getSetting('session_idle_minutes', 30),
    default_tax_rate: await getSetting('default_tax_rate', 0.075)
  }
})

export const PUT = route(async (req) => {
  const admin = await requireRole(['super_admin'])
  const b = parse(settingsSchema, await body(req))
  const db = useDB()
  for (const [key, value] of Object.entries(b))
    if (value !== undefined) await db.insert(platformSettings).values({ key, value }).onConflictDoUpdate({ target: platformSettings.key, set: { value } })
  await logActivity({ actorId: admin.id, action: 'settings_updated', detail: b })
  return { ok: true }
})
