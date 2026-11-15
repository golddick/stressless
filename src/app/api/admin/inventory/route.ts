import { and, asc, eq, sql } from 'drizzle-orm'
import { inventory, products } from '@/server/db/schema'
import { inventoryPatchSchema } from '@/shared/schemas'
import { route, body, query, parse, fail, adminScope, scopedStore, useDB, logActivity } from '@/server/kit'

export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const db = useDB()
  const storeId = query(req).storeId
  if (!storeId) throw fail(400, 'storeId is required.')
  await scopedStore(db, scope, storeId)
  return db.select({
    productId: products.id, name: products.name, barcode: products.barcode, imageFile: products.imageFile,
    quantity: inventory.quantity, lowStockThreshold: inventory.lowStockThreshold
  })
    .from(products).leftJoin(inventory, and(eq(inventory.productId, products.id), eq(inventory.storeId, storeId)))
    .where(eq(products.ownerId, scope.ownerId)).orderBy(asc(products.name))
})

export const PATCH = route(async (req) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const b = parse(inventoryPatchSchema, await body(req))
  const db = useDB()
  await scopedStore(db, scope, b.storeId)
  const [p] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, b.productId), eq(products.ownerId, scope.ownerId)))
  if (!p) throw fail(404, 'Product not found.')
  const qty = b.quantity ?? Math.max(0, b.delta ?? 0)
  const set: Record<string, unknown> = {}
  if (b.quantity !== undefined) set.quantity = b.quantity
  else if (b.delta !== undefined) set.quantity = sql`GREATEST(${inventory.quantity} + ${b.delta}, 0)`
  if (b.lowStockThreshold !== undefined) set.lowStockThreshold = b.lowStockThreshold
  const [row] = await db.insert(inventory).values({ storeId: b.storeId, productId: b.productId, quantity: qty, lowStockThreshold: b.lowStockThreshold ?? 5 })
    .onConflictDoUpdate({ target: [inventory.storeId, inventory.productId], set }).returning()
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'inventory_adjusted', targetType: 'product', targetId: b.productId, detail: b })
  return row
})
