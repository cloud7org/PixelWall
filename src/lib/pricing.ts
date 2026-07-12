export const CENTRAL_W = 1000
export const CENTRAL_H = 1000

export const PREMIUM_PLN_PER_PX = 0.3
export const PREMIUM_MIN_PLN = 100
export const STANDARD_PLN_PER_PX = 0.01
export const STANDARD_MIN_PLN = 15

export function calculatePrice(x: number, y: number, w: number, h: number) {
  const overlapW = Math.max(0, Math.min(x + w, CENTRAL_W) - Math.max(x, 0))
  const overlapH = Math.max(0, Math.min(y + h, CENTRAL_H) - Math.max(y, 0))
  const premiumPixels = overlapW * overlapH
  const totalPixels = w * h
  const standardPixels = totalPixels - premiumPixels

  const premiumSubtotal = premiumPixels > 0 ? Math.max(premiumPixels * PREMIUM_PLN_PER_PX, PREMIUM_MIN_PLN) : 0
  const standardSubtotal = standardPixels > 0 ? Math.max(standardPixels * STANDARD_PLN_PER_PX, STANDARD_MIN_PLN) : 0

  return {
    premiumPixels,
    standardPixels,
    totalPixels,
    premiumSubtotal,
    standardSubtotal,
    price: premiumSubtotal + standardSubtotal,
  }
}

export function formatPln(amount: number) {
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`
}

const FRAME_TIERS = [
  { max: 10_000, price: 19.99, width: 4 },
  { max: 30_000, price: 29.99, width: 5 },
  { max: Infinity, price: 49.99, width: 5 },
]

function frameTier(totalPixels: number) {
  return FRAME_TIERS.find(t => totalPixels <= t.max) ?? FRAME_TIERS[FRAME_TIERS.length - 1]
}

export function calculateFramePrice(totalPixels: number) {
  return frameTier(totalPixels).price
}

export function calculateFrameWidth(totalPixels: number) {
  return frameTier(totalPixels).width
}
