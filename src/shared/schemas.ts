import { z } from 'zod'

export const identifierSchema = z
  .string()
  .trim()
  .transform(v => (v.includes('@') ? v.toLowerCase() : v.replace(/[\s()-]/g, '')))
  .refine(
    v => (v.includes('@') ? z.string().email().safeParse(v).success : /^\+?\d{8,15}$/.test(v)),
    'Enter a valid email or phone number'
  )

export const otpRequestSchema = z.object({ identifier: identifierSchema })
export const otpVerifySchema = z.object({
  identifier: identifierSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  name: z.string().trim().max(80).optional()
})
export const passwordLoginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(8, 'Use at least 8 characters.').max(128)
})
export const passwordSetSchema = z.object({
  currentPassword: z.string().min(8).max(128).optional(),
  newPassword: z.string().min(8, 'Use at least 8 characters.').max(128),
  confirmPassword: z.string().min(8).max(128)
}).refine(v => v.newPassword === v.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] })
export const passwordResetSchema = z.object({
  identifier: identifierSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
  confirmPassword: z.string().min(8).max(128)
}).refine(v => v.password === v.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] })
export const profileUpdateSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  age: z.number().int().min(0).max(130).nullable().optional(),
  sex: z.enum(['female', 'male', 'intersex', 'prefer_not_to_say']).nullable().optional(),
  currentPassword: z.string().min(8).max(128).optional(),
  newPassword: z.string().min(8).max(128).optional(),
  confirmPassword: z.string().min(8).max(128).optional(),
  disableAccount: z.boolean().optional()
}).refine(v => !v.newPassword || !v.confirmPassword || v.newPassword === v.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
})

export const startSessionSchema = z.object({ storeToken: z.string().optional(), storeId: z.string().optional() })
  .refine(v => v.storeToken || v.storeId, 'Provide a store code or store')
export const scanSchema = z.object({ barcode: z.string().trim().min(3).max(64) })
export const cartQtySchema = z.object({ quantity: z.number().int().min(0).max(99) })
export const checkoutSchema = z.object({ ageConfirmed: z.boolean().optional() })

export const storeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).default(''),
  taxRate: z.number().min(0).max(0.5).default(0.075),
  hours: z.string().trim().max(60).default('08:00-21:00'),
  active: z.boolean().default(true)
})
export const platformStoreSchema = storeSchema.extend({ ownerId: z.string() })

export const productSchema = z.object({
  barcode: z.string().trim().min(3).max(64),
  name: z.string().trim().min(1).max(120),
  priceMinor: z.number().int().min(0),
  category: z.string().trim().max(60).optional(),
  imageFile: z.string().nullable().optional(),
  ageRestricted: z.boolean().default(false),
  active: z.boolean().default(true),
  storeId: z.string().optional(),
  stock: z.number().int().min(0).optional()
})
export const productPatchSchema = productSchema.partial()
export const csvImportSchema = z.object({ csv: z.string().min(1).max(2_000_000), storeId: z.string().optional() })
export const inventoryPatchSchema = z.object({
  storeId: z.string(), productId: z.string(),
  quantity: z.number().int().min(0).optional(),
  delta: z.number().int().optional(),
  lowStockThreshold: z.number().int().min(0).optional()
})
export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      p256dh: z.string().min(1).max(256),
      auth: z.string().min(1).max(256)
    })
  })
})
export const pushUnsubscribeSchema = z.object({ endpoint: z.string().url().max(2048) })

export const staffInviteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['manager', 'exit_staff']),
  storeIds: z.array(z.string()).min(1)
})

export const exitLookupSchema = z.object({ token: z.string().trim().min(8).max(120) })
export const exitVerifySchema = z.object({
  token: z.string().trim().min(8).max(120),
  result: z.enum(['verified', 'flagged']),
  note: z.string().trim().max(300).optional()
})
export const auditSchema = z.object({
  storeId: z.string(), orderId: z.string().optional(),
  outcome: z.enum(['pass', 'fail']), note: z.string().trim().max(300).optional()
})
export const noteSchema = z.object({ note: z.string().trim().max(300).optional() })

export const ownerCreateSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email()
})
export const ownerPatchSchema = ownerCreateSchema.partial()
export const settingsSchema = z.object({
  spot_check_rate: z.number().min(0).max(1).optional(),
  session_idle_minutes: z.number().int().min(5).max(240).optional(),
  default_tax_rate: z.number().min(0).max(0.5).optional()
})
