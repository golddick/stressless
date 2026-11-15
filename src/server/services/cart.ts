import { eq } from 'drizzle-orm'
import { cartItems, products } from '../db/schema'
import type { DB } from '../utils/db'
import { computeTotals } from './pricing'

export async function getCart(db: DB, sessionId: string, taxRate: number) {
  const items = await db.select({
    productId: products.id, barcode: products.barcode, name: products.name, unitPriceMinor: products.priceMinor,
    imageFile: products.imageFile, ageRestricted: products.ageRestricted, quantity: cartItems.quantity
  }).from(cartItems).innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.sessionId, sessionId)).orderBy(products.name)
  return { items, taxRate, ...computeTotals(items, taxRate), hasAgeRestricted: items.some(i => i.ageRestricted) }
}
