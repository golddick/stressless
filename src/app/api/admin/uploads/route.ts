import { uploadFile } from '@/server/services/dropaphi'
import { route, fail, adminScope } from '@/server/kit'

// Product images and store logos go to DropAphi file storage (multipart, max 3 MB, images only).
export const POST = route(async (req) => {
  const scope = await adminScope(req, { write: ['owner', 'manager'] })
  const f = (await req.formData()).get('file')
  if (!(f instanceof File) || !f.type.startsWith('image/')) throw fail(422, 'Upload an image file.')
  if (f.size > 3_000_000) throw fail(422, 'Images must be under 3 MB.')
  const res = await uploadFile(`${scope.ownerId}/${Date.now()}-${f.name || 'image'}`, f.type, Buffer.from(await f.arrayBuffer()))
  if (!res) throw fail(502, 'The image could not be stored. Try again.')
  return { file: res.ref }
})
