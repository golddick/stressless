export const homeFor = (role?: string) =>
  role === 'super_admin' ? '/platform' : role === 'owner' || role === 'manager' ? '/admin' : role === 'exit_staff' ? '/admin/exit' : '/store'
export const errMsg = (e: any) => e?.message || 'Something went wrong. Please try again.'
export const fmt = (minor: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format((minor ?? 0) / 100)
export const fdate = (d: string | Date) => new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
export const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10)
