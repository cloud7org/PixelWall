import { calculateFrameWidth } from './pricing'
import { auroraColor } from './drawPremiumZone'

const SHIMMER_PERIOD_MS = 1800

export function drawBlockFrame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scale: number,
  totalPixels: number,
  elapsedMs: number
) {
  const frameWidthPx = calculateFrameWidth(totalPixels)
  const lineWidth = frameWidthPx / scale
  const rx = x + lineWidth / 2
  const ry = y + lineWidth / 2
  const rw = w - lineWidth
  const rh = h - lineWidth

  // Same aurora green → cyan → violet palette as the central premium zone
  // (drawPremiumZone.ts), so the paid frame reads as part of the same visual system.
  const [ar, ag, ab] = auroraColor(elapsedMs)

  // Shimmer band — a bright aurora sweep travels diagonally across the border,
  // looping continuously (same technique as drawPremiumZone's sweep).
  const progress = (elapsedMs % SHIMMER_PERIOD_MS) / SHIMMER_PERIOD_MS
  const span = rw + rh
  const bandCenter = -span * 0.2 + progress * span * 1.4
  const bandHalf = Math.max(span * 0.22, 1)

  const grad = ctx.createLinearGradient(
    rx + bandCenter - bandHalf, ry,
    rx + bandCenter + bandHalf, ry + rh
  )
  grad.addColorStop(0, 'rgba(64,255,170,0)')
  grad.addColorStop(0.28, 'rgba(64,255,170,0.9)')
  grad.addColorStop(0.5, 'rgba(80,220,255,0.95)')
  grad.addColorStop(0.72, 'rgba(170,110,255,0.9)')
  grad.addColorStop(1, 'rgba(170,110,255,0)')

  ctx.save()
  // Base border — solid aurora color, cycling continuously
  ctx.shadowColor = `rgba(${ar},${ag},${ab},0.9)`
  ctx.shadowBlur = 10 / scale
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.75)`
  ctx.lineWidth = lineWidth
  ctx.strokeRect(rx, ry, rw, rh)
  // Shimmer band on top, sharp (no shadow) so the edge stays crisp
  ctx.shadowBlur = 0
  ctx.strokeStyle = grad
  ctx.strokeRect(rx, ry, rw, rh)
  ctx.restore()
}
