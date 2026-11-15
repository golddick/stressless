import { describe, expect, it } from 'vitest'
import { identifierSchema, otpVerifySchema } from '../../src/shared/schemas'

describe('sign-in validation', () => {
  it('normalises emails and phones', () => {
    expect(identifierSchema.parse(' Ada@Example.COM ')).toBe('ada@example.com')
    expect(identifierSchema.parse('+234 801 234 5678')).toBe('+2348012345678')
  })
  it('rejects junk', () => {
    expect(identifierSchema.safeParse('hello').success).toBe(false)
  })
  it('needs a 6 digit code', () => {
    expect(otpVerifySchema.safeParse({ identifier: 'a@b.co', code: '12345' }).success).toBe(false)
    expect(otpVerifySchema.safeParse({ identifier: 'a@b.co', code: '123456' }).success).toBe(true)
  })
})
