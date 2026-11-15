export interface PriceLine { unitPriceMinor: number; quantity: number }

/** All money is stored as integer minor units (kobo). Single currency (NGN) in the MVP. */
export function computeTotals(lines: PriceLine[], taxRate: number) {
  const subtotalMinor = lines.reduce((s, l) => s + l.unitPriceMinor * l.quantity, 0)
  const taxMinor = Math.round(subtotalMinor * taxRate)
  return { subtotalMinor, taxMinor, totalMinor: subtotalMinor + taxMinor }
}

export function formatMoney(minor: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(minor / 100)
}
