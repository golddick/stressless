import { env } from '../utils/env'
import { logOrderEvent } from '../utils/activity'

/**
 * The only module that talks to DropAphi (email, SMS/OTP, file storage).
 * Email delivery follows the DropAphi REST API. The SMS endpoint still needs confirmation.
 * Failures are retried, logged in order_events, and never throw: a failed email must not block checkout.
 */
async function call(path: string, payload: unknown, ctx: { orderId?: string } = {}): Promise<boolean> {
  const { dropaphiKey, dropaphiBase } = env()
  if (!dropaphiKey) { console.log(`[dropaphi:dev] ${path}`, JSON.stringify(payload)); return true }
  let lastErr: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${dropaphiBase}${path}`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'DROP-API-Key': dropaphiKey },
        body: JSON.stringify(payload)
      })
      if (res.ok) return true
      lastErr = `HTTP ${res.status}`
    } catch (e) { lastErr = e }
    await new Promise(r => setTimeout(r, 300 * attempt))
  }
  console.error('[dropaphi] failed', path, lastErr)
  await logOrderEvent(ctx.orderId ?? null, 'dropaphi_failed', { path, error: String(lastErr) })
  return false
}

export const sendEmail = (to: string, subject: string, html: string, ctx?: { orderId?: string }) =>
  call('/api/v1/email/send', { to, subject, html }, ctx)
export const sendSms = (to: string, message: string, ctx?: { orderId?: string }) =>
  call('/v1/sms/send', { to, message }, ctx)

/** Uploads a file (product image, store logo, CSV import). Returns a storage reference or null. */
export async function uploadFile(name: string, contentType: string, data: Buffer): Promise<{ ref: string } | null> {
  const { dropaphiKey, dropaphiBase } = env()
  if (!dropaphiKey) return { ref: `dev://${encodeURIComponent(name)}` }
  try {
    const res = await fetch(`${dropaphiBase}/api/v1/files/upload`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'DROP-API-Key': dropaphiKey },
      body: JSON.stringify({
        name, type: contentType, data: data.toString('base64'),
        metadata: { visibility: 'PUBLIC' }
      })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = await res.json() as { success?: unknown; data?: { url?: unknown; id?: unknown } }
    if (result.success === false) throw new Error('DropAphi reported that the upload failed.')
    const ref = result.data?.url ?? result.data?.id
    if (typeof ref !== 'string' || !ref) throw new Error('DropAphi response did not include data.url or data.id.')
    return { ref }
  } catch (e) { console.error('[dropaphi] upload failed', e); return null }
}
