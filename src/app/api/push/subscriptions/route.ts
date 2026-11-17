import { and, eq } from 'drizzle-orm'
import { pushSubscriptions } from '@/server/db/schema'
import { pushSubscriptionSchema, pushUnsubscribeSchema } from '@/shared/schemas'
import { route, body, parse, fail, requireRole, useDB } from '@/server/kit'

export const GET = route(async () => {
  await requireRole(['owner', 'manager'])
  const isConfigured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT)
  return { publicKey: isConfigured ? process.env.VAPID_PUBLIC_KEY : null }
})

export const POST = route(async (req) => {
  const user = await requireRole(['owner', 'manager'])
  const { subscription } = parse(pushSubscriptionSchema, await body(req))
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    throw fail(503, 'Push notifications are not configured on this server.')
  }
  await useDB().insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth
  }).onConflictDoUpdate({
    target: pushSubscriptions.endpoint,
    set: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }
  })
  return { ok: true }
})

export const DELETE = route(async (req) => {
  const user = await requireRole(['owner', 'manager'])
  const { endpoint } = parse(pushUnsubscribeSchema, await body(req))
  await useDB().delete(pushSubscriptions).where(and(
    eq(pushSubscriptions.userId, user.id),
    eq(pushSubscriptions.endpoint, endpoint)
  ))
  return { ok: true }
})
