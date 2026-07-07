import { CENTRAL_W, CENTRAL_H } from './pricing'

const SWEEP_PERIOD_MS = 4000
const SWEEP_DURATION_MS = 1400
const SWEEP_BAND_HALF_WIDTH = 220

// Aurora borealis palette: green → cyan → violet, cycled continuously so the
// border and label badge shimmer through the same colors as the sweep band.
const AURORA_CYCLE_MS = 6000
const AURORA_COLORS: [number, number, number][] = [
  [64, 255, 170],  // green
  [80, 220, 255],  // cyan
  [170, 110, 255], // violet
]

function auroraColor(elapsedMs: number): [number, number, number] {
  const n = AURORA_COLORS.length
  const phase = ((elapsedMs % AURORA_CYCLE_MS) / AURORA_CYCLE_MS) * n
  const i = Math.floor(phase) % n
  const j = (i + 1) % n
  const f = phase - Math.floor(phase)
  const a = AURORA_COLORS[i]
  const b = AURORA_COLORS[j]
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ]
}

export function drawPremiumZone(ctx: CanvasRenderingContext2D, scale: number, elapsedMs: number) {
  const [ar, ag, ab] = auroraColor(elapsedMs)

  // Base aurora tint
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.05)`
  ctx.fillRect(0, 0, CENTRAL_W, CENTRAL_H)

  // Shimmer — diagonal aurora-borealis band sweeping across the zone, repeating with a pause
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
    grad.addColorStop(0, 'rgba(64,255,170,0)')
    grad.addColorStop(0.28, 'rgba(64,255,170,0.32)')   // aurora green
    grad.addColorStop(0.5, 'rgba(80,220,255,0.34)')    // teal / cyan
    grad.addColorStop(0.72, 'rgba(170,110,255,0.32)')  // violet
    grad.addColorStop(1, 'rgba(170,110,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CENTRAL_W, CENTRAL_H)
    ctx.restore()
  }

  // Border + corner label — same shifting aurora color as the base tint above
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.6)`
  ctx.lineWidth = 2 / scale
  ctx.strokeRect(0, 0, CENTRAL_W, CENTRAL_H)

  const fs = Math.max(8, 12 / scale)
  ctx.font = `bold ${fs}px JetBrains Mono, monospace`
  const lbl = 'STREFA TIME SQUARE · 0,30 zł/px'
  const tw = ctx.measureText(lbl).width
  const pad = 6 / scale
  const lh = fs * 1.9
  ctx.fillStyle = `rgb(${ar},${ag},${ab})`
  ctx.fillRect(0, -lh - 2 / scale, tw + pad * 2, lh)
  ctx.fillStyle = '#0B0C10'
  ctx.fillText(lbl, pad, -lh - 2 / scale + lh * 0.72)
}
