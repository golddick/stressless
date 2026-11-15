import { getCart } from '@/server/services/cart'
import { requireActiveSession } from '@/server/services/session'
import { route, requireRole, useDB } from '@/server/kit'

export const GET = route(async () => {
  const user = await requireRole(['customer'])
  const db = useDB()
  const { session, store } = await requireActiveSession(db, user.id)
  return { session, store: { id: store.id, name: store.name, address: store.address }, cart: await getCart(db, session.id, store.taxRate) }
})
