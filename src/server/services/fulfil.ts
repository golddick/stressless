import { and, eq, sql } from 'drizzle-orm'
import { inventory, orderEvents, orderItems, orders, payments, shoppingSessions, stores, users } from '../db/schema'
import { canTransition } from '../../shared/orderState'
import { formatMoney } from '../../shared/pricing'
import { sendEmail } from './dropaphi'
import { notifyStoreTeam } from './notify'
import { logOrderEvent } from '../utils/activity'
import { useDB } from '../utils/db'

/**
 * Called ONLY by the signed Paystack webhook (or the dev simulator). Idempotent:
 * a repeated webhook for an already-confirmed payment changes nothing.
 */
export async function confirmPayment(reference: string, amountMinor: number) {
  const db = useDB()
  const lowStock: { storeId: string; name: string; qty: number }[] = []
  let orderId = ''

  const outcome = await db.transaction(async tx => {
    const [pay] = await tx.select().from(payments).where(eq(payments.providerRef, reference)).for('update').limit(1)
    if (!pay) return 'unknown' as const
    orderId = pay.orderId
    if (pay.status === 'success') return 'duplicate' as const
    const [order] = await tx.select().from(orders).where(eq(orders.id, pay.orderId)).for('update').limit(1)
    if (!order || amountMinor !== order.totalMinor || amountMinor !== pay.amountMinor) {
      await tx.update(payments).set({ status: 'failed' }).where(eq(payments.id, pay.id))
      return 'mismatch' as const
    }
    if (!canTransition(order.status, 'paid')) return 'invalid' as const
    const lateOrder = order.status === 'abandoned'
    await tx.update(payments).set({ status: 'success', paidAt: new Date() }).where(eq(payments.id, pay.id))
    await tx.update(orders).set({ status: 'paid', paidAt: new Date() }).where(eq(orders.id, order.id))
    await tx.update(shoppingSessions).set({ status: 'checked_out' }).where(eq(shoppingSessions.id, order.sessionId))
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    for (const it of items) {
      const [inv] = await tx.update(inventory)
        .set({ quantity: sql`GREATEST(${inventory.quantity} - ${it.quantity}, 0)` })
        .where(and(eq(inventory.storeId, order.storeId), eq(inventory.productId, it.productId)))
        .returning({ qty: inventory.quantity, threshold: inventory.lowStockThreshold })
      if (inv && inv.qty <= inv.threshold) lowStock.push({ storeId: order.storeId, name: it.name, qty: inv.qty })
    }
    await tx.insert(orderEvents).values({ orderId: order.id, type: lateOrder ? 'paid_after_timeout' : 'paid', detail: { reference } })
    return 'paid' as const
  })

  if (outcome === 'paid') {
    for (const l of lowStock) await notifyStoreTeam(l.storeId, 'low_stock', `Low stock: ${l.name} has ${l.qty} left.`, 'Low stock alert')
    await sendReceipt(orderId)
  } else if (outcome !== 'duplicate') await logOrderEvent(orderId || null, `payment_${outcome}`, { reference, amountMinor })
  return outcome
}

export async function sendReceipt(orderId: string) {
  const db = useDB()
  const [o] = await db.select({ order: orders, store: stores.name, email: users.email }).from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId)).innerJoin(users, eq(users.id, orders.userId)).where(eq(orders.id, orderId)).limit(1)
  if (!o?.email) return
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  const rows = items.map(i => `<tr><td>${i.name} × ${i.quantity}</td><td style="text-align:right">${formatMoney(i.unitPriceMinor * i.quantity)}</td></tr>`).join('')
  await sendEmail(o.email, `Your stressless receipt (${o.store})`,
    `<h2>Thanks for shopping at ${o.store}</h2><table width="100%">${rows}</table><p>Tax: ${formatMoney(o.order.taxMinor)}<br><b>Total: ${formatMoney(o.order.totalMinor)}</b></p><p>Order ${o.order.id}</p>`, { orderId })
}
