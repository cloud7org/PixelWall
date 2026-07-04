import { CENTRAL_W, CENTRAL_H } from './pricing'

const SWEEP_PERIOD_MS = 4000
const SWEEP_DURATION_MS = 1400
const SWEEP_BAND_HALF_WIDTH = 220

export function drawPremiumZone(ctx: CanvasRenderingContext2D, scale: number, elapsedMs: number) {
  // Base gold tint
  ctx.fillStyle = 'rgba(255,210,63,0.05)'
  ctx.fillRect(0, 0, CENTRAL_W, CENTRAL_H)

  // Shimmer — diagonal gold band sweeping across the zone, repeating with a pause
  const t = elapsedMs % SWEEP_PERIOD_MS
  if (t < SWEEP_DURATION_MS) {
    const progress = t / SWEEP_DURATION_MS
    const span = CENTRAL_W + CENTRAL_H
    const bandCenter = -span * 0.3 + progress * span * 1.6

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CENTRAL_W, CENTRAL_H)
    ctx.clip()
    const grad = ctx.createLinearGradient(
      bandCenter - SWEEP_BAND_HALF_WIDTH, 0,
      bandCenter + SWEEP_BAND_HALF_WIDTH, CENTRAL_H
    )
    grad.addColorStop(0, 'rgba(255,223,120,0)')
    grad.addColorStop(0.5, 'rgba(255,223,120,0.35)')
    grad.addColorStop(1, 'rgba(255,223,120,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CENTRAL_W, CENTRAL_H)
    ctx.restore()
  }

  // Border + corner label
  ctx.strokeStyle = 'rgba(255,210,63,0.6)'
  ctx.lineWidth = 2 / scale
  ctx.strokeRect(0, 0, CENTRAL_W, CENTRAL_H)

  const fs = Math.max(8, 12 / scale)
  ctx.font = `bold ${fs}px JetBrains Mono, monospace`
  const lbl = 'STREFA PREMIUM · 0,30 zł/px'
  const tw = ctx.measureText(lbl).width
  const pad = 6 / scale
  const lh = fs * 1.9
  ctx.fillStyle = '#FFD23F'
  ctx.fillRect(0, -lh - 2 / scale, tw + pad * 2, lh)
  ctx.fillStyle = '#1A0A05'
  ctx.fillText(lbl, pad, -lh - 2 / scale + lh * 0.72)
}
