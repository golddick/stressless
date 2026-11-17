import { describe, expect, it } from 'vitest'
import { enteredLowStock } from '../../src/shared/inventory'

describe('enteredLowStock', () => {
  it('alerts when stock crosses to the configured low-stock boundary', () => {
    expect(enteredLowStock(
      { quantity: 6, lowStockThreshold: 5 },
      { quantity: 5, lowStockThreshold: 5 }
    )).toBe(true)
  })

  it('does not repeat alerts while stock remains low', () => {
    expect(enteredLowStock(
      { quantity: 4, lowStockThreshold: 5 },
      { quantity: 3, lowStockThreshold: 5 }
    )).toBe(false)
  })

  it('alerts again after restocking above the threshold', () => {
    expect(enteredLowStock(
      { quantity: 8, lowStockThreshold: 5 },
      { quantity: 4, lowStockThreshold: 5 }
    )).toBe(true)
  })

  it('alerts on initial stock at or below the threshold', () => {
    expect(enteredLowStock(null, { quantity: 5, lowStockThreshold: 5 })).toBe(true)
    expect(enteredLowStock(null, { quantity: 6, lowStockThreshold: 5 })).toBe(false)
  })
})
