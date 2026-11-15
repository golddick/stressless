import { activityLog, orderEvents, platformSettings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { useDB } from './db'

/** Audit trail for refunds, flags, price changes and Super Admin actions. */
export async function logActivity(e: { ownerId?: string | null; actorId?: string | null; action: string; targetType?: string; targetId?: string; detail?: unknown }) {
  try { await useDB().insert(activityLog).values({ ...e, detail: e.detail as any }) } catch (err) { console.error('[activity]', err) }
}
export async function logOrderEvent(orderId: string | null, type: string, detail?: unknown) {
  try { await useDB().insert(orderEvents).values({ orderId, type, detail: detail as any }) } catch (err) { console.error('[order_events]', err) }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [r] = await useDB().select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1)
  return (r?.value as T) ?? fallback
}
