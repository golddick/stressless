import { and, eq, inArray } from 'drizzle-orm'
import { ownerAccounts, storeStaff, stores, users } from '../db/schema'
import { createInAppNotification } from './inAppNotifications'
import { sendEmailNotification } from './emailNotifications'
import { sendPushNotification } from './pushNotifications'
import { useDB } from '../utils/db'
import { env } from '../utils/env'

async function getStoreTeam(storeId: string) {
  const db = useDB()
  const [s] = await db.select({ ownerUser: ownerAccounts.userId }).from(stores)
    .innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId)).where(eq(stores.id, storeId)).limit(1)
  const managers = await db.select({ id: storeStaff.userId }).from(storeStaff)
    .where(and(eq(storeStaff.storeId, storeId), eq(storeStaff.role, 'manager')))
  const ids = [...new Set([s?.ownerUser, ...managers.map(m => m.id)].filter(Boolean) as string[])]
  if (!ids.length) return []
  return db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, ids))
}

/** Sends each store-team notification through independent, reusable channels. */
export async function notifyStoreTeam(
  storeId: string,
  type: string,
  body: string,
  subject = 'stressless-pay alert',
  url = '/admin'
) {
  const recipients = await getStoreTeam(storeId)
  const results = await Promise.allSettled(recipients.flatMap(recipient => [
    createInAppNotification(recipient.id, type, body),
    recipient.email ? sendEmailNotification(recipient.email, subject, body) : Promise.resolve(),
    sendPushNotification(recipient.id, { title: subject, body, url: new URL(url, env().appUrl).toString() })
  ]))
  for (const result of results) {
    if (result.status === 'rejected') console.error('[notifications] channel delivery failed:', result.reason)
  }
}
