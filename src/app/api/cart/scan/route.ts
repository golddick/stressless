import { and, eq } from 'drizzle-orm'
import { cartItems, inventory, products } from '@/server/db/schema'
import { scanSchema } from '@/shared/schemas'
import { requireActiveSession } from '@/server/services/session'
import { route, body, parse, fail, rateLimit, requireRole, useDB } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['customer'])
  rateLimit(req, 'scan', 60, 60_000, user.id)
  const { barcode } = parse(scanSchema, await body(req))
  const db = useDB()
  const { session, store } = await requireActiveSession(db, user.id)
  const [p] = await db.select().from(products)
    .where(and(eq(products.ownerId, store.ownerId), eq(products.barcode, barcode), eq(products.active, true))).limit(1)
  if (!p) throw fail(404, 'We do not recognise that barcode. Try again or ask a team member.', 'unknown_barcode')
  const [inv] = await db.select().from(inventory).where(and(eq(inventory.storeId, store.id), eq(inventory.productId, p.id))).limit(1)
  const [inCart] = await db.select().from(cartItems).where(and(eq(cartItems.sessionId, session.id), eq(cartItems.productId, p.id))).limit(1)
  const availableQuantity = (inv?.quantity ?? 0) - (inCart?.quantity ?? 0)
  if (availableQuantity < 1) throw fail(409, `${p.name} is out of stock here.`, 'out_of_stock')
  return {
    product: {
      id: p.id, name: p.name, barcode: p.barcode, unitPriceMinor: p.priceMinor,
      imageFile: p.imageFile, ageRestricted: p.ageRestricted
    },
    availableQuantity
  }
})
