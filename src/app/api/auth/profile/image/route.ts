import { eq } from 'drizzle-orm'
import { users } from '@/server/db/schema'
import { uploadFile } from '@/server/services/dropaphi'
import { fail, requireRole, route, useDB } from '@/server/kit'

export const POST = route(async (req) => {
  const user = await requireRole(['owner', 'manager', 'super_admin', 'exit_staff', 'customer'])
  const file = (await req.formData()).get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/')) throw fail(422, 'Upload an image file.')
  if (file.size > 3_000_000) throw fail(422, 'Images must be under 3 MB.')

  const uploaded = await uploadFile(`${user.id}/${Date.now()}-${file.name || 'profile-image'}`, file.type, Buffer.from(await file.arrayBuffer()))
  if (!uploaded) throw fail(502, 'The image could not be stored. Try again.')

  const db = useDB()
  await db.update(users).set({ image: uploaded.ref }).where(eq(users.id, user.id))
  return { image: uploaded.ref }
})
