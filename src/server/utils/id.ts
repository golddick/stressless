import { randomBytes } from 'node:crypto'
import { dropid } from 'dropid'

const gen: unknown = dropid

/** Readable, prefixed ID such as `order_a3f2b9c1d4e5`. Always generated on the server. */
export function newId(prefix: string): string {
  if (typeof gen === 'function') {
    const v = (gen as (p: string) => unknown)(prefix)
    if (typeof v === 'string' && v.startsWith(prefix)) return v
  }
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

/** Long random single-use token (exit passes). */
export const secretToken = (prefix: string) => `${prefix}_${randomBytes(18).toString('base64url')}`
