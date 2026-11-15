import { eq } from 'drizzle-orm'
import { payments } from '@/server/db/schema'
import { confirmPayment } from '@/server/services/fulfil'
import { route, body, fail, requireRole, useDB, paymentSimulator } from '@/server/kit'

// Local development only: simulates the Paystack webhook when no PAYSTACK_SECRET_KEY is set.
export const POST = route(async (req) => {
  if (!paymentSimulator()) throw fail(404, 'Not found.')
  await requireRole(['customer'])
  const { orderId } = await body(req)
  const [p] = await useDB().select().from(payments).where(eq(payments.orderId, orderId)).limit(1)
  if (!p) throw fail(404, 'Order not found.')
  return { outcome: await confirmPayment(p.providerRef, p.amountMinor) }
})
