import { describe, expect, it } from 'vitest'
import { canTransition } from '../../src/shared/orderState'

describe('order state machine', () => {
  it('follows the happy path', () => {
    expect(canTransition('pending_payment', 'paid')).toBe(true)
    expect(canTransition('paid', 'verified')).toBe(true)
    expect(canTransition('verified', 'completed')).toBe(true)
  })
  it('flagged orders can be resolved or refunded', () => {
    expect(canTransition('paid', 'flagged')).toBe(true)
    expect(canTransition('flagged', 'verified')).toBe(true)
    expect(canTransition('flagged', 'refunded')).toBe(true)
  })
  it('blocks illegal jumps', () => {
    expect(canTransition('pending_payment', 'verified')).toBe(false)
    expect(canTransition('refunded', 'paid')).toBe(false)
    expect(canTransition('paid', 'pending_payment')).toBe(false)
  })
  it('lets a late webhook confirm an abandoned order', () => {
    expect(canTransition('abandoned', 'paid')).toBe(true)
  })
})
