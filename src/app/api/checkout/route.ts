import { and, eq } from 'drizzle-orm'
import { inventory, orderItems, orders, payments, users } from '@/server/db/schema'
import { checkoutSchema } from '@/shared/schemas'
import { getCart } from '@/server/services/cart'
import { requireActiveSession, touchSession } from '@/server/services/session'
import { initializePayment } from '@/server/services/payments'
import { route, body, parse, fail, rateLimit, requireRole, assertOwnerActive, useDB, logOrderEvent, env, paymentSimulator, newId } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['customer'])
  rateLimit(req, 'checkout', 10, 60_000, user.id)
  const { ageConfirmed } = parse(checkoutSchema, await body(req))
  const db = useDB()
  const { session, store } = await requireActiveSession(db, user.id)
  await assertOwnerActive(db, store.ownerId)
  // Prices, totals and stock are always recalculated on the server
  const cart = await getCart(db, session.id, store.taxRate)
  if (!cart.items.length) throw fail(422, 'Your cart is empty.')
  if (cart.hasAgeRestricted && !ageConfirmed) throw fail(422, 'Please confirm you are of age to buy the restricted items in your cart.', 'age_confirmation_required')
  for (const it of cart.items) {
    const [inv] = await db.select().from(inventory).where(and(eq(inventory.storeId, store.id), eq(inventory.productId, it.productId))).limit(1)
    if (!inv || inv.quantity < it.quantity) throw fail(409, `${it.name} is no longer available in that quantity.`, 'out_of_stock')
  }
  // one open order per session: abandon any earlier unpaid one
  await db.update(orders).set({ status: 'abandoned' }).where(and(eq(orders.sessionId, session.id), eq(orders.status, 'pending_payment')))

  const reference = newId('pay').replace('_', '-')
  const order = await db.transaction(async tx => {
    const [o] = await tx.insert(orders).values({
      sessionId: session.id, userId: user.id, storeId: store.id,
      subtotalMinor: cart.subtotalMinor, taxMinor: cart.taxMinor, totalMinor: cart.totalMinor,
      hasAgeRestricted: cart.hasAgeRestricted, ageConfirmed: !!ageConfirmed
    }).returning()
    await tx.insert(orderItems).values(cart.items.map(i => ({ orderId: o.id, productId: i.productId, name: i.name, unitPriceMinor: i.unitPriceMinor, quantity: i.quantity, ageRestricted: i.ageRestricted })))
    await tx.insert(payments).values({ orderId: o.id, providerRef: reference, amountMinor: o.totalMinor })
    return o
  })
  await logOrderEvent(order.id, 'checkout_started', { reference })
  await touchSession(db, session.id)

  const callback = `${env().appUrl}/pay?orderId=${order.id}`
  if (paymentSimulator()) return { orderId: order.id, simulator: true, authorizationUrl: callback + '&sim=1' }
  const [u] = await db.select({ email: users.email, phone: users.phone }).from(users).where(eq(users.id, user.id))
  const { authorizationUrl } = await initializePayment({
    email: u.email || `${u.phone}@customers.stressless.app`, amountMinor: order.totalMinor, reference, callbackUrl: callback, metadata: { orderId: order.id }
  })
  return { orderId: order.id, simulator: false, authorizationUrl }
})
