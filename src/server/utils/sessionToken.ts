// Edge-safe (used by middleware too): only depends on `jose`.
import { SignJWT, jwtVerify } from 'jose'

export const COOKIE = 'sl_session'
export type Role = 'super_admin' | 'owner' | 'manager' | 'exit_staff' | 'customer'
export type AccountStatus = 'active' | 'disabled'

export interface SessionUser { id: string; name: string | null; email: string | null; role: Role; status?: AccountStatus; ownerId?: string; storeIds?: string[]; hasPassword?: boolean }

const key = () => new TextEncoder().encode(process.env.SESSION_PASSWORD || 'dev-only-insecure-session-password-change-me')

export const signSession = (user: SessionUser) =>
  new SignJWT({ user }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(key())

export async function readSession(token?: string): Promise<SessionUser | null> {
  if (!token) return null
  try { return ((await jwtVerify(token, key())).payload as any).user as SessionUser } catch { return null }
}
