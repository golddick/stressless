import { describe, expect, it } from 'vitest'
import { computeTotals, formatMoney } from '../../src/shared/pricing'

describe('pricing', () => {
  it('adds up lines and applies the store tax rate', () => {
    const t = computeTotals([{ unitPriceMinor: 180000, quantity: 1 }, { unitPriceMinor: 120000, quantity: 2 }], 0.075)
    expect(t).toEqual({ subtotalMinor: 420000, taxMinor: 31500, totalMinor: 451500 })
  })
  it('rounds tax to whole kobo', () => {
    expect(computeTotals([{ unitPriceMinor: 333, quantity: 1 }], 0.075).taxMinor).toBe(25)
  })
  it('handles an empty cart', () => {
    expect(computeTotals([], 0.075).totalMinor).toBe(0)
  })
  it('formats naira', () => {
    expect(formatMoney(150000)).toContain('1,500')
  })
})
