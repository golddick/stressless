import { and, eq } from 'drizzle-orm'
import { notifications, ownerAccounts, storeStaff, stores, users } from '../db/schema'
import { sendEmail } from './dropaphi'
import { useDB } from '../utils/db'

/** In-dashboard notification plus email for a store's owner and managers. */
export async function notifyStoreTeam(storeId: string, type: string, body: string, subject = 'stressless alert') {
  const db = useDB()
  const [s] = await db.select({ ownerUser: ownerAccounts.userId }).from(stores)
    .innerJoin(ownerAccounts, eq(ownerAccounts.id, stores.ownerId)).where(eq(stores.id, storeId)).limit(1)
  const managers = await db.select({ id: storeStaff.userId }).from(storeStaff)
    .where(and(eq(storeStaff.storeId, storeId), eq(storeStaff.role, 'manager')))
  const ids = [...new Set([s?.ownerUser, ...managers.map(m => m.id)].filter(Boolean) as string[])]
  for (const id of ids) {
    await db.insert(notifications).values({ userId: id, type, body })
    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1)
    if (u?.email) await sendEmail(u.email, subject, `<p>${body}</p>`)
  }
}
