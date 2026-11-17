export interface InventoryLevel {
  quantity: number
  lowStockThreshold: number
}

export function enteredLowStock(previous: InventoryLevel | null, current: InventoryLevel) {
  const wasLow = previous !== null && previous.quantity <= previous.lowStockThreshold
  const isLow = current.quantity <= current.lowStockThreshold
  return !wasLow && isLow
}
