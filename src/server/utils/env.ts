export const env = () => ({
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  dropaphiKey: process.env.DROPAPHI_API_KEY || '',
  dropaphiBase: (process.env.DROPAPHI_BASE_URL || 'https://dropaphi.xyz').replace(/\/$/, ''),
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || '',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  isProd: process.env.NODE_ENV === 'production'
})
/** True when no Paystack key is set outside production: enables the payment simulator. */
export const paymentSimulator = () => !env().paystackSecret && !env().isProd
