import { route, clearSession } from '@/server/kit'

export const POST = route(async () => { await clearSession(); return { ok: true } })
