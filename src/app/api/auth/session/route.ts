import { route, getSessionUser } from '@/server/kit'

export const GET = route(async () => ({ user: await getSessionUser() }))
