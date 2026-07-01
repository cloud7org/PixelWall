'use client'

import { useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'

interface Props {
  onHover: (block: PixelBlock | null) => void
  onBlocksLoaded: (blocks: PixelBlock[]) => void
  onNewBlock: (block: PixelBlock) => void
  onZoomChange: (pct: number) => void
  externalScale?: number
  reinitKey?: number | string
  fetchKey?: number
  showHint?: boolean
  onDragSelectComplete?: (sel: { x: number; y: number; w: number; h: number }) => void
  onBlockClick?: (block: PixelBlock) => void
}

const GRID_W = 1000
const GRID_H = 1000
const GRID_STEP = 20
const MIN_SCALE = 0.2
const MAX_SCALE = 8

export default function PixelGrid({ onHover, onBlocksLoaded, onNewBlock, onZoomChange, externalScale, reinitKey, fetchKey, showHint, onDragSelectComplete, onBlockClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blocksRef = useRef<PixelBlock[]>([])
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const viewRef = useRef({ scale: 0.6, offsetX: 20, offsetY: 20 })
  const isDraggingRef = useRef(false)
  const dragMovedRef = useRef(false)
  const lastPtrRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)
  const initializedRef = useRef(false)
  const activePtrsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef      = useRef<{ dist: number } | null>(null)
  const showHintRef      = useRef(false)
  const hintRafRef       = useRef<number | null>(null)
  const hintStartRef     = useRef(0)
  const hintPosRef       = useRef<{ x: number; y: number } | null>({ x: 60, y: 60 })
  const lastTapRef       = useRef<{ time: number; cx: number; cy: number } | null>(null)
  const drawSelRef       = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const isDrawingRef     = useRef(false)
  const drawStartGridRef = useRef<{ x: number; y: number } | null>(null)
  const onDragSelCompleteRef = useRef<typeof onDragSelectComplete>(undefined)
  const onBlockClickRef      = useRef<typeof onBlockClick>(undefined)
  useEffect(() => { showHintRef.current = !!showHint }, [showHint])
  useEffect(() => { onDragSelCompleteRef.current = onDragSelectComplete }, [onDragSelectComplete])
  useEffect(() => { onBlockClickRef.current = onBlockClick }, [onBlockClick])

  const snap = (v: number) => Math.round(v / 10) * 10

  const findFreeHintPos = useCallback((): { x: number; y: number } | null => {
    const HW = 40, HH = 40
    for (let y = 0; y <= GRID_H - HH; y += GRID_STEP) {
      for (let x = 0; x <= GRID_W - HW; x += GRID_STEP) {
        const free = !blocksRef.current.some(
          b => x < b.x + b.width && x + HW > b.x && y < b.y + b.height && y + HH > b.y
        )
        if (free) return { x, y }
      }
    }
    return null
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = dprRef.current
    const { scale, offsetX, offsetY } = viewRef.current
    const cssW = canvas.width / dpr
    const cssH = canvas.height / dpr

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#FAF8F2'
    ctx.fillRect(0, 0, cssW, cssH)

    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    // Grid lines — millimeter paper style
    const MINOR = 10
    const startX = Math.max(0, Math.floor(-offsetX / scale / MINOR) * MINOR)
    const startY = Math.max(0, Math.floor(-offsetY / scale / MINOR) * MINOR)
    const endX   = Math.min(GRID_W, startX + Math.ceil(cssW / scale / MINOR + 2) * MINOR)
    const endY   = Math.min(GRID_H, startY + Math.ceil(cssH / scale / MINOR + 2) * MINOR)

    // Pass 1: minor lines every 10px (thin, faint)
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 0.5 / scale
    ctx.beginPath()
    for (let x = startX; x <= endX; x += MINOR) {
      if (x % GRID_STEP !== 0) { ctx.moveTo(x, startY); ctx.lineTo(x, endY) }
    }
    for (let y = startY; y <= endY; y += MINOR) {
      if (y % GRID_STEP !== 0) { ctx.moveTo(startX, y); ctx.lineTo(endX, y) }
    }
    ctx.stroke()

    // Pass 2: major lines every 20px (thicker, more visible)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1 / scale
    ctx.beginPath()
    for (let x = startX; x <= endX; x += GRID_STEP) {
      ctx.moveTo(x, startY); ctx.lineTo(x, endY)
    }
    for (let y = startY; y <= endY; y += GRID_STEP) {
      ctx.moveTo(startX, y); ctx.lineTo(endX, y)
    }
    ctx.stroke()

    // Border — dark and prominent
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(0, 0, GRID_W, GRID_H)

    // Blocks
    const blockColors = ['#FF4D2E', '#2EE6A6', '#FFD23F', '#1A1C24']
    blocksRef.current.forEach(block => {
      const img = imagesRef.current.get(block.id)
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, block.x, block.y, block.width, block.height)
      } else {
        const col = blockColors[block.id.charCodeAt(0) % blockColors.length]
        ctx.fillStyle = col
        ctx.globalAlpha = 0.85
        ctx.fillRect(block.x, block.y, block.width, block.height)
        ctx.globalAlpha = 1
        if (!imagesRef.current.has(block.id)) {
          const image = new Image()
          image.crossOrigin = 'anonymous'
          image.onload = () => scheduleRedraw()
          image.src = block.image_url
          imagesRef.current.set(block.id, image)
        }
      }
    })

    // Animated hint rectangle
    if (showHintRef.current) {
      const hp = hintPosRef.current
      if (hp) {
      const elapsed = performance.now() - hintStartRef.current
      const pulse = (Math.sin(elapsed / 400) + 1) / 2
      const alpha = 0.35 + pulse * 0.65
      const hx = hp.x, hy = hp.y, hw = 40, hh = 40
      ctx.fillStyle = `rgba(255,77,46,${alpha * 0.12})`
      ctx.fillRect(hx, hy, hw, hh)
      ctx.setLineDash([3 / scale, 3 / scale])
      ctx.lineDashOffset = -(elapsed / 80) % (6 / scale)
      ctx.strokeStyle = `rgba(255,77,46,${alpha})`
      ctx.lineWidth = 2 / scale
      ctx.strokeRect(hx, hy, hw, hh)
      ctx.setLineDash([])
      ctx.lineDashOffset = 0
      const fs = Math.max(8, 14 / scale)
      ctx.font = `bold ${fs}px JetBrains Mono, monospace`
      const lbl = 'Przeciągnij palcem, aby wybrać obszar'
      const tw = ctx.measureText(lbl).width
      const pad = 2 / scale
      const lh = fs * 1.7
      const ly = hy - lh - 1 / scale
      ctx.fillStyle = `rgba(255,77,46,${alpha * 0.9})`
      ctx.fillRect(hx, ly, tw + pad * 2, lh)
      ctx.fillStyle = '#1A0A05'
      ctx.fillText(lbl, hx + pad, ly + lh * 0.75)
      }
    }

    // Draw-mode selection rectangle (touch drag)
    if (drawSelRef.current) {
      const ds = drawSelRef.current
      ctx.fillStyle = 'rgba(255,77,46,0.12)'
      ctx.fillRect(ds.x, ds.y, ds.w, ds.h)
      ctx.setLineDash([4 / scale, 4 / scale])
      ctx.strokeStyle = '#FF4D2E'
      ctx.lineWidth = 2 / scale
      ctx.strokeRect(ds.x, ds.y, ds.w, ds.h)
      ctx.setLineDash([])
      const fs = Math.max(8, 12 / scale)
      ctx.font = `bold ${fs}px JetBrains Mono, monospace`
      const lbl = `${ds.w} × ${ds.h}`
      const tw = ctx.measureText(lbl).width
      const pad = 4 / scale
      const lh = fs * 1.8
      const ly = ds.y - lh - 2 / scale
      ctx.fillStyle = '#FF4D2E'
      ctx.fillRect(ds.x, ly, tw + pad * 2, lh)
      ctx.fillStyle = '#1A0A05'
      ctx.fillText(lbl, ds.x + pad, ly + lh * 0.75)
    }

    ctx.restore()
  }, [])

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => { draw(); rafRef.current = null })
  }, [draw])

  // Continuous animation loop for the hint pulse
  useEffect(() => {
    if (!showHint) {
      if (hintRafRef.current !== null) { cancelAnimationFrame(hintRafRef.current); hintRafRef.current = null }
      scheduleRedraw()
      return
    }
    hintStartRef.current = performance.now()
    const loop = () => { draw(); hintRafRef.current = requestAnimationFrame(loop) }
    hintRafRef.current = requestAnimationFrame(loop)
    return () => { if (hintRafRef.current !== null) { cancelAnimationFrame(hintRafRef.current); hintRafRef.current = null } }
  }, [showHint, draw, scheduleRedraw])

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr

    if (!initializedRef.current && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      initializedRef.current = true
      const cssW = canvas.offsetWidth
      const cssH = canvas.offsetHeight
      const fitScale = Math.min(cssW / GRID_W, cssH / GRID_H)
      viewRef.current.scale = fitScale
      viewRef.current.offsetX = Math.round((cssW - GRID_W * fitScale) / 2)
      viewRef.current.offsetY = Math.round((cssH - GRID_H * fitScale) / 2)
    }

    scheduleRedraw()
  }, [scheduleRedraw])

  const toLogical = (mx: number, my: number) => {
    const { scale, offsetX, offsetY } = viewRef.current
    return { lx: (mx - offsetX) / scale, ly: (my - offsetY) / scale }
  }

  const hitTest = (lx: number, ly: number): PixelBlock | null => {
    if (lx < 0 || lx >= GRID_W || ly < 0 || ly >= GRID_H) return null
    for (let i = blocksRef.current.length - 1; i >= 0; i--) {
      const b = blocksRef.current[i]
      if (lx >= b.x && lx < b.x + b.width && ly >= b.y && ly < b.y + b.height) return b
    }
    return null
  }

  const flashBlock = useCallback((block: PixelBlock) => {
    let alpha = 0.8
    const animate = () => {
      scheduleRedraw()
      if (alpha <= 0) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = dprRef.current
      const { scale, offsetX, offsetY } = viewRef.current
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.translate(offsetX, offsetY)
      ctx.scale(scale, scale)
      ctx.strokeStyle = `rgba(46,230,166,${alpha})`
      ctx.lineWidth = 4 / scale
      ctx.strokeRect(block.x - 2 / scale, block.y - 2 / scale, block.width + 4 / scale, block.height + 4 / scale)
      ctx.restore()
      alpha -= 0.04
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [scheduleRedraw])

  // Load blocks + Realtime
  useEffect(() => {
    supabase.from('pixel_blocks').select('*').then(({ data }) => {
      if (data) {
        blocksRef.current = data as PixelBlock[]
        hintPosRef.current = findFreeHintPos()
        onBlocksLoaded(data as PixelBlock[])
        scheduleRedraw()
      }
    })

    const channel = supabase
      .channel('pixel-blocks-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pixel_blocks' }, payload => {
        const block = payload.new as PixelBlock
        blocksRef.current = [...blocksRef.current, block]
        hintPosRef.current = findFreeHintPos()
        onNewBlock(block)
        flashBlock(block)
        scheduleRedraw()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [onBlocksLoaded, onNewBlock, scheduleRedraw, flashBlock, findFreeHintPos])

  // Re-fetch blocks when fetchKey changes (fallback for when realtime misses the INSERT)
  useEffect(() => {
    if (fetchKey === undefined) return
    supabase.from('pixel_blocks').select('*').then(({ data }) => {
      if (data) {
        blocksRef.current = data as PixelBlock[]
        hintPosRef.current = findFreeHintPos()
        onBlocksLoaded(data as PixelBlock[])
        scheduleRedraw()
      }
    })
  }, [fetchKey, findFreeHintPos, onBlocksLoaded, scheduleRedraw])

  // External scale from toolbar
  useEffect(() => {
    if (externalScale === undefined) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = dprRef.current
    const cssW = canvas.width / dpr
    const cssH = canvas.height / dpr
    const targetScale = MIN_SCALE + (externalScale / 100) * (MAX_SCALE - MIN_SCALE) * 0.2
    const { scale, offsetX, offsetY } = viewRef.current
    const ratio = targetScale / scale
    viewRef.current.scale = targetScale
    viewRef.current.offsetX = cssW / 2 - (cssW / 2 - offsetX) * ratio
    viewRef.current.offsetY = cssH / 2 - (cssH / 2 - offsetY) * ratio
    scheduleRedraw()
  }, [externalScale, scheduleRedraw])

  // ResizeObserver
  useEffect(() => {
    initializedRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [resize, reinitKey])

  // Mouse/wheel handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const { scale, offsetX, offsetY } = viewRef.current
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
      const ratio = newScale / scale
      viewRef.current.scale = newScale
      viewRef.current.offsetX = mx - (mx - offsetX) * ratio
      viewRef.current.offsetY = my - (my - offsetY) * ratio
      onZoomChange(Math.round(((newScale - MIN_SCALE) / (MAX_SCALE * 0.2 - MIN_SCALE)) * 100))
      scheduleRedraw()
    }

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      activePtrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePtrsRef.current.size === 2) {
        // Cancel any in-progress touch draw when second finger lands
        if (isDrawingRef.current) {
          isDrawingRef.current = false
          drawSelRef.current = null
          drawStartGridRef.current = null
          scheduleRedraw()
        }
        const [a, b] = [...activePtrsRef.current.values()]
        pinchRef.current = { dist: Math.hypot(b.x - a.x, b.y - a.y) }
        isDraggingRef.current = false
        return
      }

      dragMovedRef.current = false
      lastPtrRef.current = { x: e.clientX, y: e.clientY }

      if (e.pointerType === 'touch') {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const hitBlock = hitTest(lx, ly)
        if (hitBlock || lx < 0 || lx >= GRID_W || ly < 0 || ly >= GRID_H) {
          // Touch on a block or outside grid: pan
          isDraggingRef.current = true
          isDrawingRef.current = false
        } else {
          // Touch on empty grid interior: start draw mode
          isDrawingRef.current = true
          isDraggingRef.current = false
          const sx = Math.max(0, Math.min(GRID_W - 10, snap(Math.round(lx))))
          const sy = Math.max(0, Math.min(GRID_H - 10, snap(Math.round(ly))))
          drawStartGridRef.current = { x: sx, y: sy }
          drawSelRef.current = { x: sx, y: sy, w: 10, h: 10 }
          canvas.style.cursor = 'crosshair'
        }
      } else {
        // Mouse / stylus: existing pan behavior
        isDraggingRef.current = true
        isDrawingRef.current = false
        if (e.button === 2) { canvas.style.cursor = 'grabbing'; return }
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const hitBlock = hitTest(lx, ly)
        canvas.style.cursor = hitBlock ? 'grabbing' : (lx >= 0 && lx < GRID_W && ly >= 0 && ly < GRID_H ? 'crosshair' : 'grabbing')
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      activePtrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePtrsRef.current.size === 2 && pinchRef.current) {
        const [a, b] = [...activePtrsRef.current.values()]
        const newDist = Math.hypot(b.x - a.x, b.y - a.y)
        const factor = newDist / pinchRef.current.dist
        const rect = canvas.getBoundingClientRect()
        const cx = (a.x + b.x) / 2 - rect.left
        const cy = (a.y + b.y) / 2 - rect.top
        const { scale, offsetX, offsetY } = viewRef.current
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
        const ratio = newScale / scale
        viewRef.current.scale   = newScale
        viewRef.current.offsetX = cx - (cx - offsetX) * ratio
        viewRef.current.offsetY = cy - (cy - offsetY) * ratio
        pinchRef.current.dist = newDist
        onZoomChange(Math.round(((newScale - MIN_SCALE) / (MAX_SCALE * 0.2 - MIN_SCALE)) * 100))
        scheduleRedraw()
        return
      }

      // Draw mode — update selection rectangle
      if (isDrawingRef.current && drawStartGridRef.current) {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const start = drawStartGridRef.current
        const gx = Math.max(0, Math.min(GRID_W, snap(Math.round(lx))))
        const gy = Math.max(0, Math.min(GRID_H, snap(Math.round(ly))))
        const newX = Math.min(start.x, gx)
        const newY = Math.min(start.y, gy)
        const newW = Math.max(10, Math.round(Math.abs(gx - start.x) / 10) * 10)
        const newH = Math.max(10, Math.round(Math.abs(gy - start.y) / 10) * 10)
        drawSelRef.current = {
          x: newX,
          y: newY,
          w: Math.min(newW, GRID_W - newX),
          h: Math.min(newH, GRID_H - newY),
        }
        dragMovedRef.current = true
        scheduleRedraw()
        return
      }

      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      if (isDraggingRef.current) {
        const dx = e.clientX - lastPtrRef.current.x
        const dy = e.clientY - lastPtrRef.current.y
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMovedRef.current = true
        viewRef.current.offsetX += dx
        viewRef.current.offsetY += dy
        lastPtrRef.current = { x: e.clientX, y: e.clientY }
        scheduleRedraw()
      } else {
        const { lx, ly } = toLogical(mx, my)
        const hovered = hitTest(lx, ly)
        onHover(hovered)
        canvas.style.cursor = hovered ? 'pointer' : (lx >= 0 && lx < GRID_W && ly >= 0 && ly < GRID_H ? 'crosshair' : 'default')
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      activePtrsRef.current.delete(e.pointerId)
      if (activePtrsRef.current.size < 2) pinchRef.current = null

      // Finalize touch draw mode
      if (isDrawingRef.current) {
        isDrawingRef.current = false
        const ds = drawSelRef.current
        drawSelRef.current = null
        drawStartGridRef.current = null
        scheduleRedraw()
        if (ds && dragMovedRef.current && ds.w >= 10 && ds.h >= 10) {
          onDragSelCompleteRef.current?.(ds)
        }
        dragMovedRef.current = false
        return
      }

      isDraggingRef.current = false
      canvas.style.cursor = 'crosshair'

      if (!dragMovedRef.current) {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const hit = hitTest(lx, ly)
        if (hit) {
          // Block click: show tooltip (all devices)
          onBlockClickRef.current?.(hit)
        } else if (e.pointerType !== 'touch' && lx >= 0 && lx < GRID_W && ly >= 0 && ly < GRID_H) {
          // Desktop double-tap on empty area → open add-photo flow
          const now = performance.now()
          const cx = e.clientX - rect.left, cy = e.clientY - rect.top
          const last = lastTapRef.current
          if (last && now - last.time < 400 && Math.hypot(cx - last.cx, cy - last.cy) < 40) {
            lastTapRef.current = null
            const sx = Math.max(0, Math.min(GRID_W - 10, snap(Math.round(lx))))
            const sy = Math.max(0, Math.min(GRID_H - 10, snap(Math.round(ly))))
            onDragSelCompleteRef.current?.({ x: sx, y: sy, w: 10, h: 10 })
          } else {
            lastTapRef.current = { time: now, cx, cy }
          }
        }
      }
      dragMovedRef.current = false
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('mouseleave', () => onHover(null))

    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
    }
  }, [onHover, onZoomChange, scheduleRedraw])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
    />
  )
}
