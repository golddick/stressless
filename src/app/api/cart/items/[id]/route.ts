import { and, eq } from 'drizzle-orm'
import { cartItems, inventory, products } from '@/server/db/schema'
import { cartQtySchema } from '@/shared/schemas'
import { getCart } from '@/server/services/cart'
import { requireActiveSession, touchSession } from '@/server/services/session'
import { route, body, parse, fail, requireRole, useDB } from '@/server/kit'

// [id] is the product id of a line in the current cart
export const PATCH = route(async (req, { params }) => {
  const user = await requireRole(['customer'])
  const { quantity } = parse(cartQtySchema, await body(req))
  const db = useDB()
  const { session, store } = await requireActiveSession(db, user.id)
  if (quantity === 0) await db.delete(cartItems).where(and(eq(cartItems.sessionId, session.id), eq(cartItems.productId, params.id)))
  else {
    const [inv] = await db.select({ quantity: inventory.quantity }).from(inventory)
      .innerJoin(products, eq(products.id, inventory.productId))
      .where(and(
        eq(inventory.storeId, store.id), eq(inventory.productId, params.id),
        eq(products.ownerId, store.ownerId), eq(products.active, true)
      )).limit(1)
    if (!inv || inv.quantity < quantity) throw fail(409, 'Not enough stock for that quantity.', 'out_of_stock')
    await db.insert(cartItems).values({ sessionId: session.id, productId: params.id, quantity })
      .onConflictDoUpdate({ target: [cartItems.sessionId, cartItems.productId], set: { quantity } })
  }
  await touchSession(db, session.id)
  return { cart: await getCart(db, session.id, store.taxRate) }
})

export const DELETE = route(async (_req, { params }) => {
  const user = await requireRole(['customer'])
  const db = useDB()
  const { session, store } = await requireActiveSession(db, user.id)
  await db.delete(cartItems).where(and(eq(cartItems.sessionId, session.id), eq(cartItems.productId, params.id)))
  await touchSession(db, session.id)
  return { cart: await getCart(db, session.id, store.taxRate) }
})
