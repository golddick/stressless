import { and, eq } from 'drizzle-orm'
import { categories } from '../db/schema'
import type { DB } from '../utils/db'

/** Finds or creates a category by name, scoped to the owner. */
export async function categoryId(db: DB, ownerId: string, name?: string) {
  if (!name) return null
  await db.insert(categories).values({ ownerId, name }).onConflictDoNothing()
  const [c] = await db.select().from(categories).where(and(eq(categories.ownerId, ownerId), eq(categories.name, name)))
  return c.id
}
