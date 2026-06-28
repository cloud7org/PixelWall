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
}

const GRID_W = 1600
const GRID_H = 625
const GRID_STEP = 20
const MIN_SCALE = 0.2
const MAX_SCALE = 8

export default function PixelGrid({ onHover, onBlocksLoaded, onNewBlock, onZoomChange, externalScale }: Props) {
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

    // Grid lines (only visible range)
    const startX = Math.max(0, Math.floor(-offsetX / scale / GRID_STEP) * GRID_STEP)
    const startY = Math.max(0, Math.floor(-offsetY / scale / GRID_STEP) * GRID_STEP)
    const endX = Math.min(GRID_W, startX + Math.ceil(cssW / scale / GRID_STEP + 2) * GRID_STEP)
    const endY = Math.min(GRID_H, startY + Math.ceil(cssH / scale / GRID_STEP + 2) * GRID_STEP)

    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1 / scale
    ctx.beginPath()
    for (let x = startX; x <= endX; x += GRID_STEP) {
      ctx.moveTo(x, startY); ctx.lineTo(x, endY)
    }
    for (let y = startY; y <= endY; y += GRID_STEP) {
      ctx.moveTo(startX, y); ctx.lineTo(endX, y)
    }
    ctx.stroke()

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
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

    ctx.restore()
  }, [])

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => { draw(); rafRef.current = null })
  }, [draw])

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr

    if (!initializedRef.current) {
      initializedRef.current = true
      const cssW = canvas.offsetWidth
      const cssH = canvas.offsetHeight
      // Cover: scale so grid fills full canvas width and height (may clip on one axis)
      const fitScale = Math.max(cssW / GRID_W, cssH / GRID_H)
      viewRef.current.scale = fitScale
      viewRef.current.offsetX = 0
      viewRef.current.offsetY = 0
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
        onBlocksLoaded(data as PixelBlock[])
        scheduleRedraw()
      }
    })

    const channel = supabase
      .channel('pixel-blocks-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pixel_blocks' }, payload => {
        const block = payload.new as PixelBlock
        blocksRef.current = [...blocksRef.current, block]
        onNewBlock(block)
        flashBlock(block)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [onBlocksLoaded, onNewBlock, scheduleRedraw, flashBlock])

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
    const canvas = canvasRef.current
    if (!canvas) return
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [resize])

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
      isDraggingRef.current = true
      dragMovedRef.current = false
      lastPtrRef.current = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
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
        onHover(hitTest(lx, ly))
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false
      canvas.style.cursor = 'crosshair'
      if (!dragMovedRef.current) {
        const rect = canvas.getBoundingClientRect()
        const { lx, ly } = toLogical(e.clientX - rect.left, e.clientY - rect.top)
        const hit = hitTest(lx, ly)
        if (hit?.link_url) window.open(hit.link_url, '_blank', 'noopener')
      }
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
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  )
}
