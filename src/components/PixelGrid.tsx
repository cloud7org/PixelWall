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
  resetViewKey?: number
  fetchKey?: number
  showHint?: boolean
  isMobile?: boolean
  toolMode?: 'pan' | 'draw'
  onToolModeChange?: (mode: 'pan' | 'draw') => void
  onDragSelectComplete?: (sel: { x: number; y: number; w: number; h: number }) => void
  onBlockClick?: (block: PixelBlock, screenRect: { x: number; y: number; width: number; height: number }) => void
  draftSel?: { x: number; y: number; w: number; h: number }
  draftImageUrl?: string
  onSelChange?: (sel: { x: number; y: number; w: number; h: number }) => void
}

const CENTRAL_W = 1000
const CENTRAL_H = 1000
const GRID_STEP = 20
const MIN_SCALE = 0.2
const MAX_SCALE = 8

export default function PixelGrid({
  onHover, onBlocksLoaded, onNewBlock, onZoomChange,
  externalScale, reinitKey, resetViewKey, fetchKey, showHint, isMobile, toolMode, onToolModeChange,
  onDragSelectComplete, onBlockClick,
  draftSel, draftImageUrl, onSelChange,
}: Props) {
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
  const pinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null)
  const showHintRef = useRef(false)
  const hintRafRef = useRef<number | null>(null)
  const hintStartRef = useRef(0)
  const hintPosRef = useRef<{ x: number; y: number } | null>({ x: 60, y: 60 })
  const lastTapRef = useRef<{ time: number; cx: number; cy: number } | null>(null)
  const drawSelRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const isDrawingRef = useRef(false)
  const drawStartGridRef = useRef<{ x: number; y: number } | null>(null)
  const drawSelOverlapRef = useRef(false)
  const isMobileRef = useRef(false)
  isMobileRef.current = isMobile ?? false
  const toolModeRef = useRef<'pan' | 'draw'>('draw')
  toolModeRef.current = toolMode ?? 'draw'
  const onDragSelCompleteRef = useRef<typeof onDragSelectComplete>(undefined)
  const onBlockClickRef = useRef<typeof onBlockClick>(undefined)
  const onToolModeChangeRef = useRef<typeof onToolModeChange>(undefined)
  // Draft image refs
  const draftSelRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const draftImgRef = useRef<HTMLImageElement | null>(null)
  const draftDragRef = useRef<{
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'
    startGridX: number
    startGridY: number
    startSel: { x: number; y: number; w: number; h: number }
  } | null>(null)
  const onSelChangeRef = useRef<typeof onSelChange>(undefined)

  useEffect(() => { showHintRef.current = !!showHint }, [showHint])
  useEffect(() => { onDragSelCompleteRef.current = onDragSelectComplete }, [onDragSelectComplete])
  useEffect(() => { onBlockClickRef.current = onBlockClick }, [onBlockClick])
  useEffect(() => { onToolModeChangeRef.current = onToolModeChange }, [onToolModeChange])
  useEffect(() => { draftSelRef.current = draftSel ?? null }, [draftSel])
  useEffect(() => { onSelChangeRef.current = onSelChange }, [onSelChange])

  const snap = (v: number) => Math.round(v / 10) * 10

  const findFreeHintPos = useCallback((): { x: number; y: number } | null => {
    const HW = 40, HH = 40
    for (let y = 0; y <= CENTRAL_H - HH; y += GRID_STEP) {
      for (let x = 0; x <= CENTRAL_W - HW; x += GRID_STEP) {
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
    const startX = Math.floor(-offsetX / scale / MINOR) * MINOR
    const startY = Math.floor(-offsetY / scale / MINOR) * MINOR
    const endX   = startX + Math.ceil(cssW / scale / MINOR + 2) * MINOR
    const endY   = startY + Math.ceil(cssH / scale / MINOR + 2) * MINOR

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

    ctx.strokeStyle = 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(0, 0, CENTRAL_W, CENTRAL_H)

    // Existing blocks
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

    // Draft image overlay (bottom sheet edit mode)
    if (draftSelRef.current) {
      const ds = draftSelRef.current
      const di = draftImgRef.current
      if (di && di.complete && di.naturalWidth > 0) {
        ctx.globalAlpha = 0.85
        ctx.drawImage(di, ds.x, ds.y, ds.w, ds.h)
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = 'rgba(255,77,46,0.18)'
        ctx.fillRect(ds.x, ds.y, ds.w, ds.h)
      }
      ctx.strokeStyle = '#FF4D2E'
      ctx.lineWidth = 2 / scale
      ctx.setLineDash([4 / scale, 4 / scale])
      ctx.strokeRect(ds.x, ds.y, ds.w, ds.h)
      ctx.setLineDash([])
      // Corner resize handles
      const HR = 8 / scale
      const corners = [
        { gx: ds.x, gy: ds.y },
        { gx: ds.x + ds.w, gy: ds.y },
        { gx: ds.x, gy: ds.y + ds.h },
        { gx: ds.x + ds.w, gy: ds.y + ds.h },
      ]
      corners.forEach(({ gx, gy }) => {
        ctx.beginPath()
        ctx.arc(gx, gy, HR, 0, Math.PI * 2)
        ctx.fillStyle = '#FF4D2E'
        ctx.fill()
        ctx.strokeStyle = '#FAF8F2'
        ctx.lineWidth = 1.5 / scale
        ctx.stroke()
      })
      // Size label
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
        const lbl = isMobileRef.current
          ? (toolModeRef.current === 'draw' ? 'Przeciągnij palcem, aby wybrać obszar' : 'Włącz "Zaznacz", aby wybrać obszar')
          : 'Kliknij 2 razy na wolny obszar'
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
      const overlaps = drawSelOverlapRef.current
      const selColor = overlaps ? '#FF8C00' : '#FF4D2E'
      ctx.fillStyle = overlaps ? 'rgba(255,140,0,0.15)' : 'rgba(255,77,46,0.12)'
      ctx.fillRect(ds.x, ds.y, ds.w, ds.h)
      ctx.setLineDash([4 / scale, 4 / scale])
      ctx.strokeStyle = selColor
      ctx.lineWidth = 2 / scale
      ctx.strokeRect(ds.x, ds.y, ds.w, ds.h)
      ctx.setLineDash([])
      const fs = Math.max(8, 12 / scale)
      ctx.font = `bold ${fs}px JetBrains Mono, monospace`
      const lbl = overlaps ? 'Zajęty obszar' : `${ds.w} × ${ds.h}`
      const tw = ctx.measureText(lbl).width
      const pad = 4 / scale
      const lh = fs * 1.8
      const ly = ds.y - lh - 2 / scale
      ctx.fillStyle = selColor
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

  // Load draft image when URL changes
  useEffect(() => {
    if (!draftImageUrl) { draftImgRef.current = null; return }
    const img = new Image()
    img.onload = () => scheduleRedraw()
    img.src = draftImageUrl
    draftImgRef.current = img
  }, [draftImageUrl, scheduleRedraw])

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
      const fitScale = Math.min(cssW / CENTRAL_W, cssH / CENTRAL_H)
      viewRef.current.scale = fitScale
      viewRef.current.offsetX = Math.round((cssW - CENTRAL_W * fitScale) / 2)
      viewRef.current.offsetY = Math.round((cssH - CENTRAL_H * fitScale) / 2)
    }

    scheduleRedraw()
  }, [scheduleRedraw])

  const toLogical = (mx: number, my: number) => {
    const { scale, offsetX, offsetY } = viewRef.current
    return { lx: (mx - offsetX) / scale, ly: (my - offsetY) / scale }
  }

  const hitTest = (lx: number, ly: number): PixelBlock | null => {
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

  // Re-fetch blocks when fetchKey changes
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

  // Reset view to default fit when resetViewKey increments
  useEffect(() => {
    if (!resetViewKey) return
    const canvas = canvasRef.current
    if (!canvas) return
    const cssW = canvas.offsetWidth
    const cssH = canvas.offsetHeight
    if (!cssW || !cssH) return
    const fitScale = Math.min(cssW / CENTRAL_W, cssH / CENTRAL_H)
    viewRef.current.scale = fitScale
    viewRef.current.offsetX = Math.round((cssW - CENTRAL_W * fitScale) / 2)
    viewRef.current.offsetY = Math.round((cssH - CENTRAL_H * fitScale) / 2)
    onZoomChange(Math.round(((fitScale - MIN_SCALE) / (MAX_SCALE * 0.2 - MIN_SCALE)) * 100))
    scheduleRedraw()
  }, [resetViewKey, onZoomChange, scheduleRedraw])

  // Pointer + wheel handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const overlapsBlock = (sel: { x: number; y: number; w: number; h: number }) =>
      blocksRef.current.some(
        b => sel.x < b.x + b.width && sel.x + sel.w > b.x &&
             sel.y < b.y + b.height && sel.y + sel.h > b.y
      )

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
        // Cancel draw/draft drag when second finger lands
        if (isDrawingRef.current) {
          isDrawingRef.current = false
          drawSelRef.current = null
          drawStartGridRef.current = null
          scheduleRedraw()
        }
        draftDragRef.current = null
        const [a, b] = [...activePtrsRef.current.values()]
        const rect = canvas.getBoundingClientRect()
        const midX = (a.x + b.x) / 2 - rect.left
        const midY = (a.y + b.y) / 2 - rect.top
        pinchRef.current = {
          dist: Math.hypot(b.x - a.x, b.y - a.y),
          cx: midX,
          cy: midY,
        }
        isDraggingRef.current = false
        return
      }

      dragMovedRef.current = false
      lastPtrRef.current = { x: e.clientX, y: e.clientY }

      if (e.pointerType === 'touch') {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const { scale } = viewRef.current

        // Draft mode: check corner handles then body
        const ds = draftSelRef.current
        if (ds) {
          const HIT = 24 / scale
          const corners: { id: 'nw' | 'ne' | 'sw' | 'se'; gx: number; gy: number }[] = [
            { id: 'nw', gx: ds.x, gy: ds.y },
            { id: 'ne', gx: ds.x + ds.w, gy: ds.y },
            { id: 'sw', gx: ds.x, gy: ds.y + ds.h },
            { id: 'se', gx: ds.x + ds.w, gy: ds.y + ds.h },
          ]
          for (const h of corners) {
            if (Math.hypot(lx - h.gx, ly - h.gy) < HIT) {
              draftDragRef.current = {
                mode: h.id,
                startGridX: snap(Math.round(lx)),
                startGridY: snap(Math.round(ly)),
                startSel: { ...ds },
              }
              return
            }
          }
          if (lx >= ds.x && lx <= ds.x + ds.w && ly >= ds.y && ly <= ds.y + ds.h) {
            draftDragRef.current = {
              mode: 'move',
              startGridX: snap(Math.round(lx)),
              startGridY: snap(Math.round(ly)),
              startSel: { ...ds },
            }
            return
          }
          // Outside draft: pan
          isDraggingRef.current = true
          return
        }

        // Double-tap on empty area: jump straight into drawing a selection,
        // even while in pan mode — and sync the mode toggle to "Zaznacz".
        const tapCx = e.clientX - rect.left, tapCy = e.clientY - rect.top
        const tapNow = performance.now()
        const lastTap = lastTapRef.current
        const isDoubleTap = !!lastTap && tapNow - lastTap.time < 400 && Math.hypot(tapCx - lastTap.cx, tapCy - lastTap.cy) < 40
        lastTapRef.current = null

        if (isDoubleTap && !hitTest(lx, ly)) {
          if (toolModeRef.current !== 'draw') onToolModeChangeRef.current?.('draw')
          isDrawingRef.current = true
          isDraggingRef.current = false
          const sx = snap(Math.round(lx))
          const sy = snap(Math.round(ly))
          drawStartGridRef.current = { x: sx, y: sy }
          drawSelRef.current = { x: sx, y: sy, w: 10, h: 10 }
          canvas.style.cursor = 'crosshair'
          return
        }

        if (toolModeRef.current === 'pan') {
          isDraggingRef.current = true
          isDrawingRef.current = false
          return
        }

        const hitBlock = hitTest(lx, ly)
        if (hitBlock) {
          isDraggingRef.current = true
          isDrawingRef.current = false
        } else {
          // Empty area: draw mode
          isDrawingRef.current = true
          isDraggingRef.current = false
          const sx = snap(Math.round(lx))
          const sy = snap(Math.round(ly))
          drawStartGridRef.current = { x: sx, y: sy }
          drawSelRef.current = { x: sx, y: sy, w: 10, h: 10 }
          canvas.style.cursor = 'crosshair'
        }
      } else {
        // Mouse: pan
        isDraggingRef.current = true
        isDrawingRef.current = false
        if (e.button === 2) { canvas.style.cursor = 'grabbing'; return }
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const hitBlock = hitTest(lx, ly)
        canvas.style.cursor = hitBlock ? 'grabbing' : 'crosshair'
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      activePtrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      // Two-finger pinch + pan
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
        // Combined zoom + pan: anchor the grid point under the PREVIOUS midpoint to the CURRENT midpoint
        viewRef.current.scale = newScale
        viewRef.current.offsetX = cx - (pinchRef.current.cx - offsetX) * ratio
        viewRef.current.offsetY = cy - (pinchRef.current.cy - offsetY) * ratio
        pinchRef.current.dist = newDist
        pinchRef.current.cx = cx
        pinchRef.current.cy = cy
        onZoomChange(Math.round(((newScale - MIN_SCALE) / (MAX_SCALE * 0.2 - MIN_SCALE)) * 100))
        scheduleRedraw()
        return
      }

      // Draft image move/resize
      if (draftDragRef.current) {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const { mode, startGridX, startGridY, startSel } = draftDragRef.current
        const dx = snap(Math.round(lx)) - startGridX
        const dy = snap(Math.round(ly)) - startGridY
        let ns = { ...startSel }
        if (mode === 'move') {
          ns.x = snap(startSel.x + dx)
          ns.y = snap(startSel.y + dy)
        } else if (mode === 'se') {
          ns.w = Math.max(10, snap(startSel.w + dx))
          ns.h = Math.max(10, snap(startSel.h + dy))
        } else if (mode === 'nw') {
          const nx = snap(startSel.x + dx)
          const ny = snap(startSel.y + dy)
          ns = { x: nx, y: ny, w: Math.max(10, startSel.x + startSel.w - nx), h: Math.max(10, startSel.y + startSel.h - ny) }
        } else if (mode === 'ne') {
          const ny = snap(startSel.y + dy)
          ns = {
            x: startSel.x, y: ny,
            w: Math.max(10, snap(startSel.w + dx)),
            h: Math.max(10, startSel.y + startSel.h - ny),
          }
        } else if (mode === 'sw') {
          const nx = snap(startSel.x + dx)
          ns = {
            x: nx, y: startSel.y,
            w: Math.max(10, startSel.x + startSel.w - nx),
            h: Math.max(10, snap(startSel.h + dy)),
          }
        }
        draftSelRef.current = ns
        onSelChangeRef.current?.(ns)
        scheduleRedraw()
        return
      }

      // Draw mode — update selection rectangle
      if (isDrawingRef.current && drawStartGridRef.current) {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const start = drawStartGridRef.current
        const gx = snap(Math.round(lx))
        const gy = snap(Math.round(ly))
        const newX = Math.min(start.x, gx)
        const newY = Math.min(start.y, gy)
        const newW = Math.max(10, Math.round(Math.abs(gx - start.x) / 10) * 10)
        const newH = Math.max(10, Math.round(Math.abs(gy - start.y) / 10) * 10)
        const newSel = { x: newX, y: newY, w: newW, h: newH }
        drawSelRef.current = newSel
        drawSelOverlapRef.current = overlapsBlock(newSel)
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
        canvas.style.cursor = hovered ? 'pointer' : 'crosshair'
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      activePtrsRef.current.delete(e.pointerId)
      if (activePtrsRef.current.size < 2) pinchRef.current = null

      // Finalize draft drag
      if (draftDragRef.current) {
        draftDragRef.current = null
        return
      }

      // Finalize touch draw mode
      if (isDrawingRef.current) {
        isDrawingRef.current = false
        const ds = drawSelRef.current
        const overlapped = drawSelOverlapRef.current
        drawSelRef.current = null
        drawSelOverlapRef.current = false
        drawStartGridRef.current = null
        scheduleRedraw()
        if (ds && dragMovedRef.current && ds.w >= 10 && ds.h >= 10 && !overlapped) {
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
          const { scale, offsetX, offsetY } = viewRef.current
          const screenRect = {
            x: rect.left + offsetX + hit.x * scale,
            y: rect.top + offsetY + hit.y * scale,
            width: hit.width * scale,
            height: hit.height * scale,
          }
          onBlockClickRef.current?.(hit, screenRect)
        } else if (e.pointerType !== 'touch') {
          // Desktop double-click on empty area
          const now = performance.now()
          const cx = e.clientX - rect.left, cy = e.clientY - rect.top
          const last = lastTapRef.current
          if (last && now - last.time < 400 && Math.hypot(cx - last.cx, cy - last.cy) < 40) {
            lastTapRef.current = null
            const sx = snap(Math.round(lx))
            const sy = snap(Math.round(ly))
            onDragSelCompleteRef.current?.({ x: sx, y: sy, w: 10, h: 10 })
          } else {
            lastTapRef.current = { time: now, cx, cy }
          }
        } else {
          // Touch: remember this tap so the next pointerdown can recognize a double-tap
          lastTapRef.current = { time: performance.now(), cx: e.clientX - rect.left, cy: e.clientY - rect.top }
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
