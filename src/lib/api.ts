'use client'

export class ApiError extends Error { constructor(public status: number, message: string, public data?: any) { super(message) } }

/** fetch wrapper: JSON in/out, throws ApiError(message), adds ?ownerId= for the Super Admin support view. */
export async function api<T = any>(url: string, opts: { method?: string; body?: any; query?: Record<string, any> } = {}): Promise<T> {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  if (url.startsWith('/api/admin') && typeof window !== 'undefined') {
    const owner = new URLSearchParams(window.location.search).get('ownerId')
    if (owner) q.set('ownerId', owner)
  }
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData
  const res = await fetch(q.size ? `${url}?${q}` : url, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: opts.body && !isForm ? { 'content-type': 'application/json' } : undefined,
    body: opts.body ? (isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
    credentials: 'same-origin'
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, json?.message || 'Something went wrong. Please try again.', json?.data)
  return json as T
}
