import { and, eq } from 'drizzle-orm'
import { inventory, products } from '@/server/db/schema'
import { csvImportSchema } from '@/shared/schemas'
import { parseCsv } from '@/server/utils/csv'
import { uploadFile } from '@/server/services/dropaphi'
import { categoryId } from '@/server/services/catalog'
import { route, body, parse, fail, adminScope, scopedStore, useDB, logActivity } from '@/server/kit'

// CSV columns: barcode,name,price,category,age_restricted,stock   (price in naira, e.g. 1800.50)
export const POST = route(async (req) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const { csv, storeId } = parse(csvImportSchema, await body(req))
  const db = useDB()
  if (storeId) await scopedStore(db, scope, storeId)
  const rows = parseCsv(csv)
  if (rows.length > 5000) throw fail(422, 'Import up to 5,000 rows at a time.')
  let created = 0, updated = 0
  const errors: { row: number; error: string }[] = []
  for (const [i, r] of rows.entries()) {
    const price = Math.round(parseFloat(r.price) * 100)
    if (!r.barcode || !r.name || !Number.isFinite(price) || price < 0) { errors.push({ row: i + 2, error: 'Needs barcode, name and a valid price' }); continue }
    const values = { name: r.name, priceMinor: price, ageRestricted: ['1', 'true', 'yes'].includes((r.age_restricted || '').toLowerCase()), categoryId: await categoryId(db, scope.ownerId, r.category || undefined) }
    const [ex] = await db.select().from(products).where(and(eq(products.ownerId, scope.ownerId), eq(products.barcode, r.barcode))).limit(1)
    let pid = ex?.id
    if (ex) { await db.update(products).set(values).where(eq(products.id, ex.id)); updated++ }
    else { const [n] = await db.insert(products).values({ ...values, ownerId: scope.ownerId, barcode: r.barcode }).returning({ id: products.id }); pid = n.id; created++ }
    if (storeId && r.stock !== undefined && r.stock !== '' && Number.isInteger(+r.stock))
      await db.insert(inventory).values({ storeId, productId: pid!, quantity: +r.stock })
        .onConflictDoUpdate({ target: [inventory.storeId, inventory.productId], set: { quantity: +r.stock } })
  }
  await uploadFile(`imports/${scope.ownerId}-${Date.now()}.csv`, 'text/csv', Buffer.from(csv)) // keep the source file
  await logActivity({ ownerId: scope.ownerId, actorId: scope.user.id, action: 'products_imported', detail: { created, updated, errors: errors.length } })
  return { created, updated, errors }
})
