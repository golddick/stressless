import { and, asc, eq, ilike, or, sql } from 'drizzle-orm'
import { categories, inventory, products } from '@/server/db/schema'
import { productSchema } from '@/shared/schemas'
import { categoryId } from '@/server/services/catalog'
import { route, body, query, parse, fail, adminScope, scopedStore, useDB } from '@/server/kit'

export const GET = route(async (req) => {
  const scope = await adminScope(req)
  const q = query(req)
  const storeId = q.storeId || scope.storeIds?.[0]
  const db = useDB()
  if (storeId) await scopedStore(db, scope, storeId)
  const search = q.q ? `%${q.q}%` : null
  return db.select({
    id: products.id, barcode: products.barcode, name: products.name, priceMinor: products.priceMinor,
    category: categories.name, imageFile: products.imageFile, ageRestricted: products.ageRestricted, active: products.active,
    stock: storeId ? inventory.quantity : sql<number | null>`null`
  }).from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(inventory, and(eq(inventory.productId, products.id), eq(inventory.storeId, storeId ?? '')))
    .where(and(eq(products.ownerId, scope.ownerId), search ? or(ilike(products.name, search), ilike(products.barcode, search)) : undefined))
    .orderBy(asc(products.name)).limit(300)
})

export const POST = route(async (req) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const { category, storeId, stock, ...b } = parse(productSchema, await body(req))
  const db = useDB()
  const [dup] = await db.select({ id: products.id }).from(products).where(and(eq(products.ownerId, scope.ownerId), eq(products.barcode, b.barcode))).limit(1)
  if (dup) throw fail(409, 'A product with this barcode already exists.')
  const [row] = await db.insert(products).values({ ...b, ownerId: scope.ownerId, categoryId: await categoryId(db, scope.ownerId, category) }).returning()
  if (storeId && stock !== undefined) {
    await scopedStore(db, scope, storeId)
    await db.insert(inventory).values({ storeId, productId: row.id, quantity: stock }).onConflictDoNothing()
  }
  return row
})
