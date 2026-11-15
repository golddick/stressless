export type OrderStatus =
  | 'pending_payment' | 'paid' | 'verified' | 'flagged' | 'completed' | 'refunded' | 'abandoned'

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'abandoned'],
  abandoned: ['paid'], // a late webhook can still confirm a payment
  paid: ['verified', 'flagged', 'refunded'],
  flagged: ['verified', 'refunded'],
  verified: ['completed', 'refunded'],
  completed: ['refunded'],
  refunded: []
}

export const canTransition = (from: OrderStatus, to: OrderStatus) => NEXT[from]?.includes(to) ?? false
export const PAID_STATUSES: OrderStatus[] = ['paid', 'verified', 'flagged', 'completed']
