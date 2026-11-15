import { NextRequest, NextResponse } from 'next/server'
import type { ZodTypeAny, z } from 'zod'

export class HttpError extends Error {
  constructor(public status: number, message: string, public data?: unknown) { super(message) }
}
export const fail = (status: number, message: string, code?: string) => new HttpError(status, message, code ? { code } : undefined)

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data)
  if (!r.success) {
    const first = r.error.issues[0]
    throw new HttpError(422, first ? `${first.path.join('.') || 'input'}: ${first.message}` : 'Invalid input', r.error.flatten())
  }
  return r.data
}

export type Ctx = { params: Promise<Record<string, string>> }
type Handler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<unknown>

/** Wraps a route handler: JSON in/out, HttpError -> status code, anything else -> 500. */
export const route = (fn: Handler) => async (req: NextRequest, ctx: Ctx) => {
  try {
    const out = await fn(req, { params: (await ctx?.params) ?? {} })
    return out instanceof Response ? out : NextResponse.json(out ?? { ok: true })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ message: e.message, data: e.data, statusCode: e.status }, { status: e.status })
    console.error(e)
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export const body = (req: NextRequest) => req.json().catch(() => ({}))
export const query = (req: NextRequest) => Object.fromEntries(req.nextUrl.searchParams) as Record<string, string>
