'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

/** Loads data from an API route and reloads when the query changes. `poll` refreshes every N ms. */
export function useData<T = any>(url: string | null, query?: Record<string, any>, opts: { poll?: number } = {}) {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const key = JSON.stringify([url, query])
  const live = useRef(true)
  const load = useCallback(async () => {
    if (!url) return
    try { setData(await api<T>(url, { query })); setError('') } catch (e: any) { setError(e.message) } finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  useEffect(() => { live.current = true; load(); return () => { live.current = false } }, [load])
  useEffect(() => { if (!opts.poll) return; const t = setInterval(load, opts.poll); return () => clearInterval(t) }, [load, opts.poll])
  return { data, error, loading, refresh: load, setData }
}

/** Reads a query-string value after mount (avoids Suspense requirements of useSearchParams). */
export function useQueryParam(name: string) {
  const [v, setV] = useState('')
  useEffect(() => { setV(new URLSearchParams(window.location.search).get(name) ?? '') }, [name])
  return v
}

/** Keeps the Super Admin's ?ownerId= on every admin link. */
export function useSupport() {
  const ownerId = useQueryParam('ownerId')
  return { ownerId, href: (path: string) => (ownerId ? `${path}?ownerId=${ownerId}` : path) }
}

export function useStoreSelect() {
  const { data: stores } = useData<any[]>('/api/admin/stores')
  const [storeId, setStoreId] = useState('')
  useEffect(() => { if (stores?.length && !storeId) setStoreId(stores[0].id) }, [stores, storeId])
  return { stores, storeId, setStoreId }
}
