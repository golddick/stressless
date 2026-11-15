'use client'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

export interface SessionUser { id: string; name: string | null; email: string | null; role: 'super_admin' | 'owner' | 'manager' | 'exit_staff' | 'customer'; ownerId?: string; storeIds?: string[]; hasPassword?: boolean }
interface Ctx { user: SessionUser | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const SessionCtx = createContext<Ctx>({ user: null, loading: true, refresh: async () => {}, logout: async () => {} })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    try { setUser((await api<{ user: SessionUser | null }>('/api/auth/session')).user) } catch { setUser(null) } finally { setLoading(false) }
  }, [])
  const logout = useCallback(async () => { await api('/api/auth/logout', { method: 'POST', body: {} }); setUser(null); window.location.href = '/' }, [])
  useEffect(() => { refresh() }, [refresh])
  return <SessionCtx.Provider value={{ user, loading, refresh, logout }}>{children}</SessionCtx.Provider>
}
export const useSession = () => useContext(SessionCtx)
