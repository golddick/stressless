import { and, eq } from 'drizzle-orm'
import { inventory, products } from '@/server/db/schema'
import { productPatchSchema } from '@/shared/schemas'
import { categoryId } from '@/server/services/catalog'
import { notifyIfNewlyLowStock } from '@/server/services/lowStock'
import { route, body, parse, fail, adminScope, scopedStore, useDB, logActivity } from '@/server/kit'

export const PATCH = route(async (req, { params }) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const db = useDB()
  const id = params.id
  const [old] = await db.select().from(products).where(and(eq(products.id, id), eq(products.ownerId, scope.ownerId))).limit(1)
  if (!old) throw fail(404, 'Product not found.')
  const { category, storeId, stock, ...b } = parse(productPatchSchema, await body(req))
  const patch: Record<string, unknown> = { ...b }
  if (category !== undefined) patch.categoryId = await categoryId(db, scope.ownerId, category)
  if (Object.keys(patch).length) await db.update(products).set(patch).where(eq(products.id, id))
  if (b.priceMinor !== undefined && b.priceMinor !== old.priceMinor)
    await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'price_changed', targetType: 'product', targetId: id, detail: { from: old.priceMinor, to: b.priceMinor } })
  if (storeId && stock !== undefined) {
    await scopedStore(db, scope, storeId)
    const { previous, current } = await db.transaction(async tx => {
      const [previous] = await tx.select().from(inventory)
        .where(and(eq(inventory.storeId, storeId), eq(inventory.productId, id)))
        .for('update').limit(1)
      const [current] = await tx.insert(inventory).values({ storeId, productId: id, quantity: stock })
        .onConflictDoUpdate({ target: [inventory.storeId, inventory.productId], set: { quantity: stock } }).returning()
      return { previous: previous ?? null, current }
    })
    await notifyIfNewlyLowStock(storeId, old.name, previous, current)
  }
  return { ok: true }
})
