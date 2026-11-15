import { randomInt } from 'node:crypto'
import { otpCodes } from '@/server/db/schema'
import { otpRequestSchema } from '@/shared/schemas'
import { sendEmail, sendSms } from '@/server/services/dropaphi'
import { route, body, parse, rateLimit, useDB, hashOtp } from '@/server/kit'

export const POST = route(async (req) => {
  const { identifier } = parse(otpRequestSchema, await body(req))
  rateLimit(req, 'otp-request', 5, 10 * 60_000, identifier)
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await useDB().insert(otpCodes).values({ identifier, codeHash: hashOtp(identifier, code), expiresAt: new Date(Date.now() + 10 * 60_000) })
  if (identifier.includes('@')) await sendEmail(identifier, 'Your stressless sign-in code', `<p>Your code is <b>${code}</b>. It expires in 10 minutes.</p>`)
  else await sendSms(identifier, `Your stressless code is ${code}. It expires in 10 minutes.`)
  return { ok: true }
})
