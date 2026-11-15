import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { and, eq } from 'drizzle-orm'
import ws from 'ws'
import * as s from './schema'

neonConfig.webSocketConstructor = ws as any
const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema: s })

async function user(email: string, name: string, role: s.Role) {
  await db.insert(s.users).values({ email, name, role }).onConflictDoNothing()
  const [u] = await db.select().from(s.users).where(eq(s.users.email, email))
  return u
}

const adminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@stressless.test').toLowerCase()
const admin = await user(adminEmail, 'Super Admin', 'super_admin')
const ownerUser = await user('dickgoldd@gmail.com', 'Demo Owner', 'owner')
let [owner] = await db.select().from(s.ownerAccounts).where(eq(s.ownerAccounts.userId, ownerUser.id))
if (!owner) [owner] = await db.insert(s.ownerAccounts).values({ userId: ownerUser.id, businessName: 'Demo Mart', createdBy: admin.id }).returning()

let [store] = await db.select().from(s.stores).where(eq(s.stores.qrToken, 'demo-store'))
if (!store) [store] = await db.insert(s.stores).values({ ownerId: owner.id, name: 'Demo Mart, Lekki', address: '12 Admiralty Way, Lekki', qrToken: 'demo-store' }).returning()

const manager = await user('golddick60@gmail.com', 'Demo Manager', 'manager')
const exitStaff = await user('exit@demo.stressless.test', 'Demo Exit Staff', 'exit_staff')
await db.insert(s.storeStaff).values([{ userId: manager.id, storeId: store.id, role: 'manager' }, { userId: exitStaff.id, storeId: store.id, role: 'exit_staff' }]).onConflictDoNothing()

const cats = ['Dairy', 'Bakery', 'Drinks', 'Snacks', 'Household']
await db.insert(s.categories).values(cats.map(name => ({ ownerId: owner.id, name }))).onConflictDoNothing()
const catRows = await db.select().from(s.categories).where(eq(s.categories.ownerId, owner.id))
const cat = (n: string) => catRows.find(c => c.name === n)!.id

const demo: [string, string, number, string, boolean][] = [
  ['6001000000011', 'Greek yogurt 500g', 180000, 'Dairy', false], ['6001000000028', 'Fresh milk 1L', 220000, 'Dairy', false],
  ['6001000000035', 'Sourdough loaf', 250000, 'Bakery', false], ['6001000000042', 'Butter croissant', 90000, 'Bakery', false],
  ['6001000000059', 'Cold brew coffee', 120000, 'Drinks', false], ['6001000000066', 'Sparkling water 750ml', 60000, 'Drinks', false],
  ['6001000000073', 'Lager 6-pack', 780000, 'Drinks', true], ['6001000000080', 'Plantain chips', 70000, 'Snacks', false],
  ['6001000000097', 'Dark chocolate bar', 150000, 'Snacks', false], ['6001000000103', 'Dish soap 500ml', 130000, 'Household', false],
  ['6001000000110', 'Paper towels 2-pack', 210000, 'Household', false], ['6001000000127', 'Red wine 750ml', 1450000, 'Drinks', true]
]
for (const [barcode, name, priceMinor, c, ageRestricted] of demo) {
  await db.insert(s.products).values({ ownerId: owner.id, barcode, name, priceMinor, categoryId: cat(c), ageRestricted }).onConflictDoNothing()
  const [p] = await db.select().from(s.products).where(and(eq(s.products.ownerId, owner.id), eq(s.products.barcode, barcode)))
  await db.insert(s.inventory).values({ storeId: store.id, productId: p.id, quantity: 40, lowStockThreshold: 5 }).onConflictDoNothing()
}
await db.insert(s.platformSettings).values([
  { key: 'spot_check_rate', value: 0.1 }, { key: 'session_idle_minutes', value: 30 }, { key: 'default_tax_rate', value: 0.075 }
]).onConflictDoNothing()

console.log(`Seeded.\n  Super Admin: ${adminEmail}\n  Demo owner:   owner@demo.stressless.test\n  Demo manager: manager@demo.stressless.test\n  Demo exit:    exit@demo.stressless.test\n  Demo store QR: /store/demo-store`)
process.exit(0)
