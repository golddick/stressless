import { confirmPayment } from '@/server/services/fulfil'
import { verifyWebhookSignature } from '@/server/services/payments'
import { route, fail } from '@/server/kit'

// Payment status is confirmed here, by a signature-verified and idempotent webhook, never by the browser.
export const POST = route(async (req) => {
  const raw = await req.text()
  if (!verifyWebhookSignature(raw, req.headers.get('x-paystack-signature') ?? undefined)) throw fail(401, 'Invalid signature.')
  const payload = JSON.parse(raw)
  if (payload.event === 'charge.success') await confirmPayment(payload.data.reference, payload.data.amount)
  return { received: true }
})
