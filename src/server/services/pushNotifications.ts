import { sendNotification, setVapidDetails } from 'web-push'
import { eq } from 'drizzle-orm'
import { pushSubscriptions } from '../db/schema'
import { useDB } from '../utils/db'

export interface PushMessage {
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(userId: string, message: PushMessage) {
  const db = useDB()
  const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  if (!subscriptions.length) return

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) {
    throw new Error('Push delivery requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.')
  }

  setVapidDetails(subject, publicKey, privateKey)
  const results = await Promise.allSettled(subscriptions.map(async subscription => {
    try {
      await sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, JSON.stringify(message))
    } catch (error) {
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
        ? error.statusCode
        : undefined
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id))
        return
      }
      throw error
    }
  }))
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
  if (failures.length) {
    throw new AggregateError(failures.map(result => result.reason), `Push delivery failed for ${failures.length} subscription(s).`)
  }
}
