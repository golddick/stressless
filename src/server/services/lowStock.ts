import { enteredLowStock, type InventoryLevel } from '@/shared/inventory'
import { notifyStoreTeam } from './notify'

export async function notifyIfNewlyLowStock(
  storeId: string,
  productName: string,
  previous: InventoryLevel | null,
  current: InventoryLevel
) {
  if (!enteredLowStock(previous, current)) return
  await notifyStoreTeam(
    storeId,
    'low_stock',
    `Low stock: ${productName} has ${current.quantity} left.`,
    'Low stock alert',
    '/admin/inventory'
  )
}
