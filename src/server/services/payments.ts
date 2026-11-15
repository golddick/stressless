import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../utils/env'
import { fail } from '../utils/http'

const API = 'https://api.paystack.co'
const headers = () => ({ authorization: `Bearer ${env().paystackSecret}`, 'content-type': 'application/json' })

export async function initializePayment(p: { email: string; amountMinor: number; reference: string; callbackUrl: string; metadata?: unknown }) {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ email: p.email, amount: p.amountMinor, reference: p.reference, callback_url: p.callbackUrl, metadata: p.metadata, currency: 'NGN' })
  })
  const j: any = await res.json()
  if (!res.ok || !j.status) throw fail(502, 'Payment provider is unavailable. Please try again.')
  return { authorizationUrl: j.data.authorization_url as string }
}

/** Paystack signs the raw body with HMAC SHA-512 using the secret key. */
export function verifyWebhookSignature(raw: string, signature: string | undefined) {
  if (!signature || !env().paystackSecret) return false
  const expected = createHmac('sha512', env().paystackSecret).update(raw).digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function refundPayment(reference: string, amountMinor?: number) {
  if (!env().paystackSecret) return { simulated: true }
  const res = await fetch(`${API}/refund`, { method: 'POST', headers: headers(), body: JSON.stringify({ transaction: reference, amount: amountMinor }) })
  const j: any = await res.json()
  if (!res.ok || !j.status) throw fail(502, j?.message || 'The refund could not be processed.')
  return { simulated: false }
}
