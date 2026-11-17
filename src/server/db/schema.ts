import { pgTable, text, integer, boolean, timestamp, doublePrecision, jsonb, primaryKey, unique, index } from 'drizzle-orm/pg-core'
import { newId, secretToken } from '../utils/id'

const pk = (prefix: string) => text('id').primaryKey().$defaultFn(() => newId(prefix))
const at = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow()

export type Role = 'super_admin' | 'owner' | 'manager' | 'exit_staff' | 'customer'

export const users = pgTable('users', {
  id: pk('user'), name: text('name'),
  email: text('email').unique(), phone: text('phone').unique(),
  image: text('image'), age: integer('age'), sex: text('sex'),
  passwordHash: text('password_hash'),
  role: text('role').$type<Role>().notNull().default('customer'),
  status: text('status').$type<'active' | 'disabled'>().notNull().default('active'),
  createdAt: at('created_at')
})

export const ownerAccounts = pgTable('owner_accounts', {
  id: pk('owner'), userId: text('user_id').notNull().references(() => users.id),
  businessName: text('business_name').notNull(),
  status: text('status').$type<'active' | 'suspended'>().notNull().default('active'),
  createdBy: text('created_by').references(() => users.id), createdAt: at('created_at')
})

export const stores = pgTable('stores', {
  id: pk('store'), ownerId: text('owner_id').notNull().references(() => ownerAccounts.id),
  name: text('name').notNull(), address: text('address').notNull().default(''),
  taxRate: doublePrecision('tax_rate').notNull().default(0.075),
  hours: text('hours').notNull().default('08:00-21:00'), logoFile: text('logo_file'),
  qrToken: text('qr_token').notNull().unique().$defaultFn(() => newId('qr')),
  active: boolean('active').notNull().default(true), createdAt: at('created_at')
}, t => [index('stores_owner_idx').on(t.ownerId)])

export const storeStaff = pgTable('store_staff', {
  userId: text('user_id').notNull().references(() => users.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  role: text('role').$type<'manager' | 'exit_staff'>().notNull()
}, t => [primaryKey({ columns: [t.userId, t.storeId] })])

export const categories = pgTable('categories', {
  id: pk('cat'), ownerId: text('owner_id').notNull().references(() => ownerAccounts.id), name: text('name').notNull()
}, t => [unique().on(t.ownerId, t.name)])

export const products = pgTable('products', {
  id: pk('product'), ownerId: text('owner_id').notNull().references(() => ownerAccounts.id),
  barcode: text('barcode').notNull(), name: text('name').notNull(), priceMinor: integer('price_minor').notNull(),
  categoryId: text('category_id').references(() => categories.id), imageFile: text('image_file'),
  ageRestricted: boolean('age_restricted').notNull().default(false), active: boolean('active').notNull().default(true),
  createdAt: at('created_at')
}, t => [unique().on(t.ownerId, t.barcode)])

export const inventory = pgTable('inventory', {
  storeId: text('store_id').notNull().references(() => stores.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5)
}, t => [primaryKey({ columns: [t.storeId, t.productId] })])

export const shoppingSessions = pgTable('shopping_sessions', {
  id: pk('session'), userId: text('user_id').notNull().references(() => users.id),
  storeId: text('store_id').notNull().references(() => stores.id),
  status: text('status').$type<'active' | 'checked_out' | 'expired'>().notNull().default('active'),
  startedAt: at('started_at'), lastActiveAt: at('last_active_at')
}, t => [index('sessions_user_idx').on(t.userId)])

export const cartItems = pgTable('cart_items', {
  sessionId: text('session_id').notNull().references(() => shoppingSessions.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull()
}, t => [primaryKey({ columns: [t.sessionId, t.productId] })])

export const orders = pgTable('orders', {
  id: pk('order'), sessionId: text('session_id').notNull().references(() => shoppingSessions.id),
  userId: text('user_id').notNull().references(() => users.id), storeId: text('store_id').notNull().references(() => stores.id),
  subtotalMinor: integer('subtotal_minor').notNull(), taxMinor: integer('tax_minor').notNull(), totalMinor: integer('total_minor').notNull(),
  status: text('status').$type<'pending_payment' | 'paid' | 'verified' | 'flagged' | 'completed' | 'refunded' | 'abandoned'>().notNull().default('pending_payment'),
  exitToken: text('exit_token').notNull().unique().$defaultFn(() => secretToken('exit')),
  exitUsedAt: timestamp('exit_used_at', { withTimezone: true }),
  hasAgeRestricted: boolean('has_age_restricted').notNull().default(false),
  ageConfirmed: boolean('age_confirmed').notNull().default(false),
  createdAt: at('created_at'), paidAt: timestamp('paid_at', { withTimezone: true })
}, t => [index('orders_store_idx').on(t.storeId, t.createdAt), index('orders_user_idx').on(t.userId)])

export const orderItems = pgTable('order_items', {
  id: pk('oitem'), orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  name: text('name').notNull(), unitPriceMinor: integer('unit_price_minor').notNull(), quantity: integer('quantity').notNull(),
  ageRestricted: boolean('age_restricted').notNull().default(false)
})

export const payments = pgTable('payments', {
  id: pk('pay'), orderId: text('order_id').notNull().references(() => orders.id),
  providerRef: text('provider_ref').notNull().unique(), amountMinor: integer('amount_minor').notNull(),
  status: text('status').$type<'pending' | 'success' | 'failed' | 'refunded'>().notNull().default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true })
})

export const exitVerifications = pgTable('exit_verifications', {
  id: pk('exit'), orderId: text('order_id').notNull().references(() => orders.id),
  staffId: text('staff_id').notNull().references(() => users.id),
  result: text('result').$type<'verified' | 'flagged'>().notNull(), note: text('note'), at: at('at')
})

export const audits = pgTable('audits', {
  id: pk('audit'), orderId: text('order_id').references(() => orders.id),
  storeId: text('store_id').notNull().references(() => stores.id), staffId: text('staff_id').notNull().references(() => users.id),
  outcome: text('outcome').$type<'pass' | 'fail'>().notNull(), note: text('note'), at: at('at')
})

export const notifications = pgTable('notifications', {
  id: pk('note'), userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), body: text('body').notNull(), read: boolean('read').notNull().default(false), createdAt: at('created_at')
}, t => [index('notes_user_idx').on(t.userId, t.read)])

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: pk('push'), userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull().unique(), p256dh: text('p256dh').notNull(), auth: text('auth').notNull(),
  createdAt: at('created_at')
}, t => [index('push_subscriptions_user_idx').on(t.userId)])

export const orderEvents = pgTable('order_events', {
  id: pk('evt'), orderId: text('order_id').references(() => orders.id),
  type: text('type').notNull(), detail: jsonb('detail'), at: at('at')
}, t => [index('events_order_idx').on(t.orderId)])

export const activityLog = pgTable('activity_log', {
  id: pk('log'), ownerId: text('owner_id'), actorId: text('actor_id'),
  action: text('action').notNull(), targetType: text('target_type'), targetId: text('target_id'),
  detail: jsonb('detail'), at: at('at')
})

export const otpCodes = pgTable('otp_codes', {
  id: pk('otp'), identifier: text('identifier').notNull(), codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), attempts: integer('attempts').notNull().default(0),
  createdAt: at('created_at')
}, t => [index('otp_identifier_idx').on(t.identifier)])

export const platformSettings = pgTable('platform_settings', {
  key: text('key').primaryKey(), value: jsonb('value').notNull()
})
