'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import ToolModeToggle from './ToolModeToggle'

const CENTRAL_W = 1000
const CENTRAL_H = 1000
const GRID_STEP = 20
const MIN_SCALE = 0.001
const MAX_SCALE = 1000


const scaleToPct = (s: number) =>
  Math.round(Math.log(s / MIN_SCALE) / Math.log(MAX_SCALE / MIN_SCALE) * 100)
const pctToScale = (p: number) =>
  MIN_SCALE * Math.pow(MAX_SCALE / MIN_SCALE, p / 100)

type Sel  = { x: number; y: number; w: number; h: number }
type Handle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'
type DragMode = 'none' | 'draw' | 'move' | 'pan' | Handle
type ToolMode = 'draw' | 'pointer' | 'pan'

const HANDLE_CURSORS: Record<Handle, string> = {
  nw: 'nwse-resize', n: 'ns-resize',  ne: 'nesw-resize',
  w:  'ew-resize',                     e:  'ew-resize',
  sw: 'nesw-resize', s: 'ns-resize',  se: 'nwse-resize',
}
const HANDLE_NAMES: Handle[] = ['nw','n','ne','w','e','sw','s','se']

function hitTestSel(lx: number, ly: number, sel: Sel, scale: number, touchPx = 10): Handle | 'body' | null {
  const r = touchPx / scale
  const { x, y, w, h } = sel
  const cx = x + w / 2, cy = y + h / 2
  const pts: [Handle, number, number][] = [
    ['nw', x, y],   ['n', cx, y],   ['ne', x + w, y],
    ['w',  x, cy],                   ['e',  x + w, cy],
    ['sw', x, y+h], ['s', cx, y+h], ['se', x + w, y+h],
  ]
  for (const [name, hx, hy] of pts) {
    if (Math.abs(lx - hx) <= r && Math.abs(ly - hy) <= r) return name
  }
  if (lx >= x && lx <= x + w && ly >= y && ly <= y + h) return 'body'
  return null
}

function applyResize(handle: Handle, start: Sel, gdx: number, gdy: number, snap: (v: number) => number): Sel {
  const s10 = (v: number) => Math.max(10, Math.round(v / 10) * 10)
  let { x, y, w, h } = start
  if (handle.includes('e'))  w = s10(start.w + gdx)
  if (handle.includes('s'))  h = s10(start.h + gdy)
  if (handle.includes('w')) { const nw = s10(start.w - gdx); x = start.x + start.w - nw; w = nw }
  if (handle.includes('n')) { const nh = s10(start.h - gdy); y = start.y + start.h - nh; h = nh }
  return { x, y, w, h }
}

export default function BuyPageContent({ onClose, initialSel }: { onClose?: () => void; initialSel?: { x: number; y: number; w: number; h: number } } = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isMobile } = useBreakpoint()

  const initW = Math.max(10, Number(searchParams.get('w') ?? 10))
  const initH = Math.max(10, Number(searchParams.get('h') ?? 10))
  const defaultSel = initialSel ?? { x: 50, y: 50, w: initW, h: initH }

  // Canvas / view refs
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const blocksRef      = useRef<PixelBlock[]>([])
  const imagesRef      = useRef<Map<string, HTMLImageElement>>(new Map())
  const viewRef        = useRef({ scale: 0.3, offsetX: 20, offsetY: 20 })
  const dprRef         = useRef(1)
  const rafRef         = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const selRef         = useRef<Sel>(defaultSel)
  const isOverlapRef   = useRef(false)

  // Drag ref — mutated imperatively to avoid stale closures
  const dragRef = useRef<{
    mode: DragMode
    startClient: { x: number; y: number }
    startGrid:  { x: number; y: number }
    startSel:   Sel
    startView:  { offsetX: number; offsetY: number }
  }>({
    mode: 'none',
    startClient: { x: 0, y: 0 },
    startGrid:   { x: 0, y: 0 },
    startSel:    { x: 50, y: 50, w: initW, h: initH },
    startView:   { offsetX: 20, offsetY: 20 },
  })
  const spaceRef       = useRef(false)
  const toolModeRef    = useRef<ToolMode>('draw')
  const snapEnabledRef = useRef(true)
  const imageImgRef    = useRef<HTMLImageElement | null>(null)
  const activePtrsRef  = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef        = useRef<{ dist: number; cx: number; cy: number } | null>(null)
  const gestureHintRef  = useRef(true)
  const didInitModeRef  = useRef(false)
  const isMobileRef     = useRef(false)

  // React state
  const [sel, setSel]               = useState<Sel>(defaultSel)
  const [toolMode, setToolMode]     = useState<ToolMode>('draw')
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [zoomPct, setZoomPct]       = useState(30)
  const [ownerName, setOwnerName]   = useState('')
  const [email, setEmail]           = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [linkUrl, setLinkUrl]       = useState('')
  const [altText, setAltText]       = useState('')
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selW, setSelW]             = useState(String(defaultSel.w))
  const [selH, setSelH]             = useState(String(defaultSel.h))
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)
  const [showGestureHint, setShowGestureHint] = useState(true)

  const price = sel.w * sel.h

  // Sync refs with state
  useEffect(() => {
    selRef.current = sel
    setSelW(String(sel.w))
    setSelH(String(sel.h))
  }, [sel])
  useEffect(() => { toolModeRef.current    = toolMode    }, [toolMode])
  useEffect(() => { snapEnabledRef.current = snapEnabled }, [snapEnabled])

  // Mobile: default to pan mode so single-finger drag scrolls like users expect
  useEffect(() => {
    isMobileRef.current = isMobile
    if (isMobile && !didInitModeRef.current) {
      didInitModeRef.current = true
      setToolMode('pan')
    }
  }, [isMobile])

  const snap = useCallback((v: number) =>
    snapEnabledRef.current ? Math.round(v / (GRID_STEP / 2)) * (GRID_STEP / 2) : v, [])

  // ─── DRAW ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = dprRef.current
    const { scale, offsetX, offsetY } = viewRef.current
    const cssW = canvas.width / dpr
    const cssH = canvas.height / dpr
    const s    = selRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    const bgGradient = ctx.createRadialGradient(cssW / 2, cssH * 0.35, 0, cssW / 2, cssH * 0.35, Math.max(cssW, cssH) * 0.8)
    bgGradient.addColorStop(0, '#121834')
    bgGradient.addColorStop(1, '#05060D')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, cssW, cssH)

    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    // Visible range
    const sX = Math.floor(-offsetX / scale / GRID_STEP) * GRID_STEP
    const sY = Math.floor(-offsetY / scale / GRID_STEP) * GRID_STEP
    const eX = sX + Math.ceil(cssW / scale / GRID_STEP + 2) * GRID_STEP
    const eY = sY + Math.ceil(cssH / scale / GRID_STEP + 2) * GRID_STEP
    const maxLineSpan = Math.max(eX - sX, eY - sY)

    // Starfield — night-sky backdrop; world-fixed cell size that auto-coarsens
    // when zoomed way out, so the iteration count stays bounded at any zoom.
    {
      let starCell = 32
      const rangeX = cssW / scale
      const rangeY = cssH / scale
      while ((rangeX / starCell) * (rangeY / starCell) > 3000) starCell *= 2
      const starHash = (a: number, b: number) => {
        let h = (a * 374761393 + b * 668265263) | 0
        h = (h ^ (h >>> 13)) * 1274126177
        h = h ^ (h >>> 16)
        return ((h >>> 0) % 100000) / 100000
      }
      const cStartX = Math.floor(-offsetX / scale / starCell) - 1
      const cStartY = Math.floor(-offsetY / scale / starCell) - 1
      const cCountX = Math.ceil(rangeX / starCell) + 3
      const cCountY = Math.ceil(rangeY / starCell) + 3
      const tierDim: number[] = []
      const tierMid: number[] = []
      const tierBright: number[] = []
      for (let cy = cStartY; cy < cStartY + cCountY; cy++) {
        for (let cx = cStartX; cx < cStartX + cCountX; cx++) {
          if (starHash(cx, cy) > 0.22) continue
          const jx = starHash(cx * 7 + 3, cy * 13 + 5)
          const jy = starHash(cx * 13 + 9, cy * 7 + 2)
          const sizeH = starHash(cx * 31 + 1, cy * 17 + 4)
          const sx = (cx + jx) * starCell
          const sy = (cy + jy) * starCell
          const r = (0.5 + sizeH * 1.1) / scale
          const bucket = sizeH < 0.55 ? tierDim : sizeH < 0.85 ? tierMid : tierBright
          bucket.push(sx, sy, r)
        }
      }
      const fillStarTier = (pts: number[], alpha: number) => {
        if (!pts.length) return
        ctx.beginPath()
        for (let i = 0; i < pts.length; i += 3) {
          const sx = pts[i], sy = pts[i + 1], r = pts[i + 2]
          ctx.moveTo(sx + r, sy)
          ctx.arc(sx, sy, r, 0, Math.PI * 2)
        }
        ctx.fillStyle = `rgba(226,233,255,${alpha})`
        ctx.fill()
      }
      fillStarTier(tierDim, 0.3)
      fillStarTier(tierMid, 0.55)
      fillStarTier(tierBright, 0.85)
    }

    // Minor grid (10px)
    const minor = GRID_STEP / 2
    if (maxLineSpan / minor <= 2000) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 0.5 / scale
      ctx.beginPath()
      for (let x = Math.floor(sX/minor)*minor; x <= eX; x += minor) {
        if (x % GRID_STEP !== 0) { ctx.moveTo(x, sY); ctx.lineTo(x, eY) }
      }
      for (let y = Math.floor(sY/minor)*minor; y <= eY; y += minor) {
        if (y % GRID_STEP !== 0) { ctx.moveTo(sX, y); ctx.lineTo(eX, y) }
      }
      ctx.stroke()
    }

    // Major grid (20px)
    if (maxLineSpan / GRID_STEP <= 2000) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1 / scale
      ctx.beginPath()
      for (let x = sX; x <= eX; x += GRID_STEP) { ctx.moveTo(x, sY); ctx.lineTo(x, eY) }
      for (let y = sY; y <= eY; y += GRID_STEP) { ctx.moveTo(sX, y); ctx.lineTo(eX, y) }
      ctx.stroke()
    }

    // Grid border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(0, 0, CENTRAL_W, CENTRAL_H)

    // Sold blocks
    const blockColors = ['#FF4D2E', '#2EE6A6', '#FFD23F', '#F5F0E6']
    blocksRef.current.forEach(block => {
      const img = imagesRef.current.get(block.id)
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, block.x, block.y, block.width, block.height)
      } else {
        ctx.fillStyle = blockColors[block.id.charCodeAt(0) % blockColors.length]
        ctx.globalAlpha = 0.7
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

    // Selection — vermilion
    const overlap = isOverlapRef.current
    ctx.fillStyle = 'rgba(255,77,46,0.10)'
    ctx.fillRect(s.x, s.y, s.w, s.h)
    // Uploaded image preview inside selection
    if (imageImgRef.current) {
      ctx.drawImage(imageImgRef.current, s.x, s.y, s.w, s.h)
    }
    // Outer glow
    ctx.strokeStyle = 'rgba(255,77,46,0.25)'
    ctx.lineWidth = 4 / scale
    ctx.strokeRect(s.x - 1/scale, s.y - 1/scale, s.w + 2/scale, s.h + 2/scale)
    // Main border
    ctx.strokeStyle = overlap ? 'rgba(255,77,46,0.4)' : '#FF4D2E'
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(s.x, s.y, s.w, s.h)

    // Dim label
    const fontSize = Math.max(8, 11 / scale)
    ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`
    const labelText = `${s.w} × ${s.h} px`
    const tw = ctx.measureText(labelText).width
    const pad = 6 / scale
    const lh  = fontSize * 1.9
    const ly  = s.y - lh - 2 / scale
    ctx.fillStyle = '#FF4D2E'
    ctx.fillRect(s.x, ly, tw + pad * 2, lh)
    ctx.fillStyle = '#1A0A05'
    ctx.fillText(labelText, s.x + pad, ly + lh * 0.72)

    // 8 circular handles
    const hr = 5 / scale
    const pts: [number,number][] = [
      [s.x,           s.y],           [s.x + s.w/2, s.y],   [s.x + s.w, s.y],
      [s.x,           s.y + s.h/2],                           [s.x + s.w, s.y + s.h/2],
      [s.x,           s.y + s.h],     [s.x + s.w/2, s.y+s.h],[s.x + s.w, s.y + s.h],
    ]
    pts.forEach(([hx, hy]) => {
      ctx.beginPath()
      ctx.arc(hx, hy, hr, 0, Math.PI * 2)
      ctx.fillStyle = '#F5F0E6'
      ctx.fill()
      ctx.strokeStyle = '#FF4D2E'
      ctx.lineWidth = 2 / scale
      ctx.stroke()
    })

    ctx.restore()
  }, []) // reads only refs

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => { draw(); rafRef.current = null })
  }, [draw])

  // Recompute overlap + redraw when sel changes
  useEffect(() => {
    const s = selRef.current
    isOverlapRef.current = blocksRef.current.some(
      b => s.x < b.x + b.width && s.x + s.w > b.x && s.y < b.y + b.height && s.y + s.h > b.y
    )
    scheduleRedraw()
  }, [sel, scheduleRedraw])

  // Load blocks from Supabase
  useEffect(() => {
    supabase.from('pixel_blocks').select('*').then(({ data }) => {
      if (data) { blocksRef.current = data as PixelBlock[]; scheduleRedraw() }
    })
  }, [scheduleRedraw])

  // Load uploaded image into ref so draw() can access it
  useEffect(() => {
    if (!imagePreview) {
      imageImgRef.current = null
      scheduleRedraw()
      return
    }
    const img = new Image()
    img.onload = () => {
      imageImgRef.current = img
      scheduleRedraw()
    }
    img.src = imagePreview
  }, [imagePreview, scheduleRedraw])

  const hasOverlap = useCallback((x: number, y: number, w: number, h: number) =>
    blocksRef.current.some(
      b => x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y
    ), [])

  const screenToGrid = useCallback((sx: number, sy: number) => {
    const { scale, offsetX, offsetY } = viewRef.current
    return { lx: (sx - offsetX) / scale, ly: (sy - offsetY) / scale }
  }, [])

  // ─── RESIZE OBSERVER ───────────────────────────────────────────────────────

  useEffect(() => {
    initializedRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      if (!initializedRef.current && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        initializedRef.current = true
        const fit = Math.min(canvas.offsetWidth / CENTRAL_W, canvas.offsetHeight / CENTRAL_H)
        const cx = canvas.offsetWidth
        const cy = canvas.offsetHeight
        viewRef.current = {
          scale: fit,
          offsetX: Math.round((cx - CENTRAL_W * fit) / 2),
          offsetY: Math.round((cy - CENTRAL_H * fit) / 2),
        }
        setZoomPct(scaleToPct(fit))
      }
      scheduleRedraw()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [scheduleRedraw, isMobile])

  // ─── GESTURE HINT AUTO-DISMISS ────────────────────────────────────────────

  useEffect(() => {
    if (!isMobile) return
    const t = setTimeout(() => {
      gestureHintRef.current = false
      setShowGestureHint(false)
    }, 4000)
    return () => clearTimeout(t)
  }, [isMobile])

  // ─── POINTER + WHEEL ───────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const { scale, offsetX, offsetY } = viewRef.current
      const factor   = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
      const ratio    = newScale / scale
      viewRef.current.scale   = newScale
      viewRef.current.offsetX = mx - (mx - offsetX) * ratio
      viewRef.current.offsetY = my - (my - offsetY) * ratio
      setZoomPct(scaleToPct(newScale))
      scheduleRedraw()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (gestureHintRef.current) {
        gestureHintRef.current = false
        setShowGestureHint(false)
        return
      }
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      activePtrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePtrsRef.current.size === 2) {
        const [a, b] = [...activePtrsRef.current.values()]
        const rect = canvas.getBoundingClientRect()
        pinchRef.current = {
          dist: Math.hypot(b.x - a.x, b.y - a.y),
          cx: (a.x + b.x) / 2 - rect.left,
          cy: (a.y + b.y) / 2 - rect.top,
        }
        dragRef.current.mode = 'none'
        setSel({ ...dragRef.current.startSel })
        return
      }

      const rect = canvas.getBoundingClientRect()
      const { lx, ly } = screenToGrid(e.clientX - rect.left, e.clientY - rect.top)
      dragRef.current.startClient = { x: e.clientX, y: e.clientY }
      dragRef.current.startGrid   = { x: lx, y: ly }
      dragRef.current.startSel    = { ...selRef.current }
      dragRef.current.startView   = { ...viewRef.current }

      if (e.button === 2 || spaceRef.current || toolModeRef.current === 'pan') {
        dragRef.current.mode = 'pan'
        canvas.style.cursor  = 'grabbing'
        return
      }

      const touchPx = e.pointerType === 'touch' ? 24 : 10
      const hit = hitTestSel(lx, ly, selRef.current, viewRef.current.scale, touchPx)

      if (toolModeRef.current === 'pointer' || hit) {
        if (hit && hit !== 'body') {
          dragRef.current.mode = hit
          canvas.style.cursor  = HANDLE_CURSORS[hit]
        } else if (hit === 'body') {
          dragRef.current.mode = 'move'
          canvas.style.cursor  = 'move'
        } else {
          dragRef.current.mode = 'draw'
          canvas.style.cursor  = 'crosshair'
        }
      } else {
        // draw tool + pudło w zaznaczenie → rysuj nowe zaznaczenie
        dragRef.current.mode = 'draw'
        const gx = snap(Math.round(lx))
        const gy = snap(Math.round(ly))
        setSel({ x: gx, y: gy, w: 10, h: 10 })
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      activePtrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePtrsRef.current.size === 2 && pinchRef.current) {
        const [a, b] = [...activePtrsRef.current.values()]
        const newDist = Math.hypot(b.x - a.x, b.y - a.y)
        const factor = newDist / pinchRef.current.dist
        const rect = canvas.getBoundingClientRect()
        const newCx = (a.x + b.x) / 2 - rect.left
        const newCy = (a.y + b.y) / 2 - rect.top
        const prevCx = pinchRef.current.cx
        const prevCy = pinchRef.current.cy
        const { scale, offsetX, offsetY } = viewRef.current
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
        const ratio = newScale / scale
        viewRef.current.scale   = newScale
        viewRef.current.offsetX = newCx - (prevCx - offsetX) * ratio
        viewRef.current.offsetY = newCy - (prevCy - offsetY) * ratio
        pinchRef.current.dist = newDist
        pinchRef.current.cx = newCx
        pinchRef.current.cy = newCy
        setZoomPct(scaleToPct(newScale))
        scheduleRedraw()
        return
      }

      const rect = canvas.getBoundingClientRect()
      const { lx, ly } = screenToGrid(e.clientX - rect.left, e.clientY - rect.top)
      const { mode, startClient, startGrid, startSel, startView } = dragRef.current

      if (mode === 'pan') {
        viewRef.current.offsetX = startView.offsetX + (e.clientX - startClient.x)
        viewRef.current.offsetY = startView.offsetY + (e.clientY - startClient.y)
        scheduleRedraw()
        return
      }

      if (mode === 'draw') {
        const gx  = snap(Math.round(lx))
        const gy  = snap(Math.round(ly))
        const sgx = snap(Math.round(startGrid.x))
        const sgy = snap(Math.round(startGrid.y))
        const newX = Math.min(sgx, gx)
        const newY = Math.min(sgy, gy)
        setSel({
          x: newX, y: newY,
          w: Math.max(10, Math.round(Math.abs(gx - sgx) / 10) * 10),
          h: Math.max(10, Math.round(Math.abs(gy - sgy) / 10) * 10),
        })
        return
      }

      if (mode === 'move') {
        const gdx = snap(Math.round(lx - startGrid.x))
        const gdy = snap(Math.round(ly - startGrid.y))
        setSel({
          ...startSel,
          x: startSel.x + gdx,
          y: startSel.y + gdy,
        })
        return
      }

      if ((HANDLE_NAMES as string[]).includes(mode)) {
        setSel(applyResize(
          mode as Handle, startSel,
          Math.round(lx - startGrid.x),
          Math.round(ly - startGrid.y),
          snap,
        ))
        return
      }

      // Hover — update cursor
      if (toolModeRef.current === 'pointer') {
        const hit = hitTestSel(lx, ly, selRef.current, viewRef.current.scale)
        if (hit && hit !== 'body') canvas.style.cursor = HANDLE_CURSORS[hit]
        else if (hit === 'body')   canvas.style.cursor = 'move'
        else                       canvas.style.cursor = 'crosshair'
      } else if (toolModeRef.current === 'pan' || spaceRef.current) {
        canvas.style.cursor = 'grab'
      } else {
        canvas.style.cursor = 'crosshair'
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      activePtrsRef.current.delete(e.pointerId)
      if (activePtrsRef.current.size < 2) pinchRef.current = null
      const wasDrawing = dragRef.current.mode === 'draw'
      dragRef.current.mode = 'none'
      // Mobile: a freshly drawn selection is done — hand control back to panning
      if (isMobileRef.current && wasDrawing && toolModeRef.current === 'draw') {
        setToolMode('pan')
      }
      canvas.style.cursor = (toolModeRef.current === 'pan' || spaceRef.current) ? 'grab' : 'crosshair'
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('contextmenu', e => e.preventDefault())

    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [scheduleRedraw, screenToGrid, snap])

  // ─── SPACE KEY ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space' && !spaceRef.current) {
        spaceRef.current = true
        e.preventDefault()
        const c = canvasRef.current
        if (c && dragRef.current.mode === 'none') c.style.cursor = 'grab'
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false
        const c = canvasRef.current
        if (c && dragRef.current.mode === 'none') c.style.cursor = 'crosshair'
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ─── ZOOM CONTROLS ─────────────────────────────────────────────────────────

  const zoomBy = useCallback((factor: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = dprRef.current
    const cssW = canvas.width / dpr, cssH = canvas.height / dpr
    const { scale, offsetX, offsetY } = viewRef.current
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
    const ratio = newScale / scale
    viewRef.current.scale   = newScale
    viewRef.current.offsetX = cssW / 2 - (cssW / 2 - offsetX) * ratio
    viewRef.current.offsetY = cssH / 2 - (cssH / 2 - offsetY) * ratio
    setZoomPct(scaleToPct(newScale))
    scheduleRedraw()
  }, [scheduleRedraw])

  const zoomToSlider = useCallback((pct: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = dprRef.current
    const cssW = canvas.width / dpr, cssH = canvas.height / dpr
    const { scale, offsetX, offsetY } = viewRef.current
    const newScale = pctToScale(pct)
    const ratio = newScale / scale
    viewRef.current.scale   = newScale
    viewRef.current.offsetX = cssW / 2 - (cssW / 2 - offsetX) * ratio
    viewRef.current.offsetY = cssH / 2 - (cssH / 2 - offsetY) * ratio
    setZoomPct(pct)
    scheduleRedraw()
  }, [scheduleRedraw])

  // ─── SIDEBAR SIZE INPUTS ────────────────────────────────────────────────────

  const applySelW = (v: number) => {
    const w = Math.max(10, Math.round((v || 10) / 10) * 10)
    setSelW(String(w)); setSel(s => ({ ...s, w }))
  }
  const applySelH = (v: number) => {
    const h = Math.max(10, Math.round((v || 10) / 10) * 10)
    setSelH(String(h)); setSel(s => ({ ...s, h }))
  }

  // ─── IMAGE / SUBMIT ─────────────────────────────────────────────────────────

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!ownerName.trim())             { setError('Podaj nazwę właściciela.'); return }
    if (!email.trim())                 { setError('Podaj adres e-mail.'); return }
    if (!privacyConsent)               { setError('Zaakceptuj politykę prywatności, aby kontynuować.'); return }
    if (!imageFile)                    { setError('Wgraj obrazek.'); return }
    if (hasOverlap(sel.x, sel.y, sel.w, sel.h)) { setError('Ten obszar nakłada się na istniejący blok. Wybierz inne miejsce.'); return }

    setUploading(true)
    try {
      const resized = await new Promise<Blob>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = sel.w; c.height = sel.h
          c.getContext('2d')!.drawImage(img, 0, 0, sel.w, sel.h)
          c.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
        }
        img.onerror = reject
        img.src = imagePreview!
      })
      const id = crypto.randomUUID()
      const { error: upErr } = await supabase.storage.from('pixel-images').upload(`${id}.png`, resized, { contentType: 'image/png' })
      if (upErr) throw new Error(upErr.message)
      const { data: urlData } = supabase.storage.from('pixel-images').getPublicUrl(`${id}.png`)
      const { error: insErr } = await supabase.from('pixel_blocks').insert({
        id, x: sel.x, y: sel.y, width: sel.w, height: sel.h,
        image_url: urlData.publicUrl, link_url: linkUrl || null,
        owner_name: ownerName || null, alt_text: altText || null, email,
        privacy_consent: true, privacy_consent_at: new Date().toISOString(),
      })
      if (insErr) throw new Error(insErr.message)
      setSuccess(true)
      setTimeout(() => { if (onClose) onClose(); else router.push('/') }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
    } finally {
      setUploading(false)
    }
  }

  // ─── SUCCESS ───────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ height: '100%', background: '#0B0C10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', color: '#2EE6A6', fontSize: 28, fontWeight: 700 }}>Piksele są Twoje!</h2>
        <p style={{ color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13 }}>Wracam na siatkę…</p>
      </div>
    )
  }

  const isOverlap = hasOverlap(sel.x, sel.y, sel.w, sel.h)

  const toolBtnSt = (active: boolean): React.CSSProperties => ({
    width: 32, height: 32, border: 'none',
    background: active ? '#0B0C10' : 'transparent',
    color: active ? '#F5F0E6' : '#8A8676',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
  })

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

      {/* ── LEFT: canvas workspace ── */}
      <div style={{ flex: isMobile ? 'none' : 1, height: isMobile ? '65vh' : undefined, position: 'relative', background: '#05060D', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
        />

        {/* Gesture hint overlay (mobile only) */}
        {isMobile && showGestureHint && (
          <div
            onPointerDown={() => { gestureHintRef.current = false; setShowGestureHint(false) }}
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(11,12,16,0.82)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '0 28px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            <button
              onPointerDown={e => { e.stopPropagation(); gestureHintRef.current = false; setShowGestureHint(false) }}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, border: '1px solid #3A3C46',
                background: 'transparent', color: '#8A8676',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1,
              }}
              aria-label="Zamknij"
            >
              ✕
            </button>
            <p style={{ color: '#2EE6A6', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 18px' }}>
              GESTY TOUCH
            </p>
            {([
              ['1 palec',                'przesuń siatkę'],
              ['przycisk "Zaznacz"',     'włącza rysowanie obszaru'],
              ['2 palce — rozsuń',       'przybliż'],
              ['2 palce — zbliż',        'oddal'],
              ['1 palec na zaznaczeniu', 'przesuń / zmień rozmiar'],
            ] as const).map(([gesture, action]) => (
              <div key={gesture} style={{ display: 'flex', width: '100%', gap: 8, marginBottom: 10, alignItems: 'baseline' }}>
                <span style={{ color: '#F5F0E6', fontSize: 11, flexShrink: 0, minWidth: 148 }}>{gesture}</span>
                <span style={{ color: '#5A5C66', fontSize: 11 }}>→</span>
                <span style={{ color: '#B7B2A4', fontSize: 11 }}>{action}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tool mode toggle + snap toggle + help button */}
        <div style={{ position: 'absolute', top: 16, right: 16, left: isMobile ? 16 : undefined, zIndex: 5, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
          {isMobile && <ToolModeToggle mode={toolMode === 'pan' ? 'pan' : 'draw'} onChange={setToolMode} />}
          {isMobile && (
            <button
              onClick={() => { gestureHintRef.current = true; setShowGestureHint(true) }}
              title="Instrukcje gestów"
              style={{
                width: 32, height: 32, border: '1px solid #2A2C36', background: '#0B0C10',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#B7B2A4', cursor: 'pointer', padding: 0, flexShrink: 0,
                fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 14, fontWeight: 600,
              }}
            >
              ?
            </button>
          )}
          <div
            onClick={() => setSnapEnabled(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#0B0C10', border: '1px solid #2A2C36', padding: '7px 12px',
              fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, color: '#B7B2A4',
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span>SNAP DO SIATKI</span>
            <div style={{ width: 30, height: 16, background: snapEnabled ? '#2EE6A6' : '#2A2C36', borderRadius: 9, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: snapEnabled ? 16 : 2, width: 12, height: 12, background: '#fff', borderRadius: '50%', transition: 'left .15s' }} />
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px', borderTop: '1px solid #2A2C36', background: '#0B0C10',
          fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12, color: '#B7B2A4',
        }}>
          {!isMobile && <span>Przeciągnij uchwyty, aby dopasować rozmiar — lub przewiń, by przybliżyć</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => zoomBy(0.8)} style={{ width: 22, height: 22, border: '1px solid #2A2C36', background: 'transparent', color: '#B7B2A4', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <div style={{ position: 'relative', width: 90, height: 3, background: '#2A2C36' }}>
              <input
                type="range" min={1} max={100} value={zoomPct}
                onChange={e => zoomToSlider(Number(e.target.value))}
                style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '500%', top: '-200%' }}
              />
              <div style={{
                position: 'absolute', left: `${(zoomPct - 1) / 99 * 100}%`, top: '50%',
                transform: 'translate(-50%, -50%)', width: 11, height: 11,
                background: '#FFD23F', borderRadius: '50%', pointerEvents: 'none',
              }} />
            </div>
            <button onClick={() => zoomBy(1.25)} style={{ width: 22, height: 22, border: '1px solid #2A2C36', background: 'transparent', color: '#B7B2A4', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <span style={{ minWidth: 36 }}>{zoomPct}%</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: sidebar + form ── */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: isMobile ? '100%' : 340,
          flex: isMobile ? 1 : undefined,
          minHeight: isMobile ? 0 : undefined,
          flexShrink: isMobile ? undefined : 0,
          background: '#0B0C10',
          borderLeft: isMobile ? 'none' : '1px solid #1F212B',
          borderTop: isMobile ? '1px solid #1F212B' : 'none',
          overflowY: 'auto', padding: isMobile ? '20px 16px' : 24,
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 22, color: '#F5F0E6', margin: 0, letterSpacing: '-0.01em' }}>
            Dodaj obraz
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Zamknij"
              style={{
                background: 'transparent', border: '1px solid #2A2C36',
                color: '#B7B2A4', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 20, flexShrink: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Hint banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(46,230,166,0.08)', border: '1px solid rgba(46,230,166,0.25)', padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#B7B2A4', lineHeight: 1.5 }}>
          <i className="ti ti-info-circle" style={{ color: '#2EE6A6', marginTop: 1, flexShrink: 0 }} />
          <span>Przeciągnij narożniki na canvasie, by zmienić rozmiar, albo wpisz dokładne wartości poniżej — obie metody są zsynchronizowane.</span>
        </div>

        {/* Image upload */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, letterSpacing: '0.05em', color: '#B7B2A4', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Obrazek <span style={{ color: '#FF4D2E' }}>*</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(46,230,166,0.08)', border: '1px solid rgba(46,230,166,0.25)', padding: '10px 12px', marginBottom: 10, fontSize: 11, color: '#B7B2A4', lineHeight: 1.5 }}>
            <i className="ti ti-info-circle" style={{ color: '#2EE6A6', marginTop: 1, flexShrink: 0 }} />
            <span>Najlepsza jakość: gdy wymiary grafiki = wymiary zaznaczonego obszaru. Inne rozmiary mogą się przeskalować i stracić ostrość.</span>
          </div>
          <label style={{ border: '1px dashed #2A2C36', padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, background: '#1A1C24', border: '1px solid #2A2C36', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {imagePreview
                ? <img src={imagePreview} alt="" style={{ width: 38, height: 38, objectFit: 'cover' }} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A5C66" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>}
            </div>
            <div style={{ fontSize: 13, color: '#B7B2A4' }}>
              <b style={{ color: '#F5F0E6', fontWeight: 500 }}>{imageFile ? imageFile.name : 'Kliknij aby dodać obraz'}</b>
            </div>
            <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Exact size inputs */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, letterSpacing: '0.05em', color: '#B7B2A4', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Dokładny rozmiar (px)
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(46,230,166,0.08)', border: '1px solid rgba(46,230,166,0.25)', padding: '10px 12px', marginBottom: 10, fontSize: 11, color: '#B7B2A4', lineHeight: 1.5 }}>
            <i className="ti ti-info-circle" style={{ color: '#2EE6A6', marginTop: 1, flexShrink: 0 }} />
            <span>Min. 10×10 px · tylko wielokrotności 10 (np. 10, 20, 100, 250)</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, color: '#5A5C66', pointerEvents: 'none' }}>SZER</span>
              <input
                type="number" value={selW} min={10}
                onChange={e => setSelW(e.target.value)}
                onBlur={e => applySelW(Number(e.target.value))}
                style={{ width: '100%', background: '#1A1C24', border: '1px solid #2A2C36', color: '#F5F0E6', padding: '10px 10px 10px 44px', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13, outline: 'none' }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', color: '#5A5C66', fontSize: 13 }}>×</span>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, color: '#5A5C66', pointerEvents: 'none' }}>WYS</span>
              <input
                type="number" value={selH} min={10}
                onChange={e => setSelH(e.target.value)}
                onBlur={e => applySelH(Number(e.target.value))}
                style={{ width: '100%', background: '#1A1C24', border: '1px solid #2A2C36', color: '#F5F0E6', padding: '10px 10px 10px 44px', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Text fields */}
        {([
          { id: 'owner', label: 'Nazwa właściciela',          val: ownerName, set: setOwnerName, placeholder: 'Nazwa',              req: true,  type: 'text',  maxLength: 50  },
          { id: 'email', label: 'Adres e-mail',               val: email,     set: setEmail,     placeholder: 'email@gmail.com',    req: true,  type: 'email', maxLength: undefined },
          { id: 'link',  label: 'Link URL (strona, blog, etc)', val: linkUrl,   set: setLinkUrl,   placeholder: 'https://',           req: false, type: 'text',  maxLength: undefined },
          { id: 'alt',   label: 'Opis obrazka',               val: altText,   set: setAltText,   placeholder: 'Krótki opis',         req: false, type: 'text',  maxLength: 300 },
        ] as const).map(({ id, label, val, set, placeholder, req, type, maxLength }) => (
          <div key={id} style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, letterSpacing: '0.05em', color: '#B7B2A4', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              {label}{req && <span style={{ color: '#FF4D2E' }}> *</span>}
            </label>
            <input
              type={type} value={val} onChange={e => set(e.target.value)}
              placeholder={placeholder} required={req} maxLength={maxLength}
              style={{ width: '100%', background: '#1A1C24', border: '1px solid #2A2C36', color: '#F5F0E6', padding: '10px 12px', fontFamily: 'var(--font-inter), sans-serif', fontSize: 14, outline: 'none' }}
            />
          </div>
        ))}

        {/* Price summary */}
        <div style={{ background: '#1A1C24', border: '1px solid #2A2C36', padding: 16, marginBottom: 18 }}>
          {[
            { label: 'Obszar',        val: `${sel.w} × ${sel.h} px` },
            { label: 'Liczba pikseli',val: price.toLocaleString('pl-PL') },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#B7B2A4', padding: '6px 0', borderBottom: '1px solid #1F212B' }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', color: '#F5F0E6' }}>{val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12 }}>
            <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F0E6' }}>Do zapłaty</span>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontWeight: 700, fontSize: 26, color: '#2EE6A6' }}>{price.toLocaleString('pl-PL')} zł</span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,77,46,0.1)', border: '1px solid rgba(255,77,46,0.3)', padding: '12px 16px', color: '#FF4D2E', fontSize: 13, fontFamily: 'var(--font-jetbrains-mono), monospace', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Checkbox zgody */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={privacyConsent}
            onChange={e => setPrivacyConsent(e.target.checked)}
            style={{ marginTop: 3, flexShrink: 0, accentColor: '#2EE6A6', width: 14, height: 14 }}
          />
          <span style={{ color: '#B7B2A4', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono), monospace', lineHeight: 1.6 }}>
            Akceptuję{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer"
              style={{ color: '#2EE6A6', textDecoration: 'underline' }}>
              politykę prywatności
            </a>
            , w tym zgodę na wyświetlenie mojej grafiki na Times Square po wysprzedaniu centralnego obszaru siatki (dotyczy tylko pikseli z obszaru 1000×1000 px).
          </span>
        </label>

        {isOverlap && (
          <div style={{ background: 'rgba(255,77,46,0.07)', border: '1px solid rgba(255,77,46,0.25)', padding: '10px 14px', color: '#FF4D2E', fontSize: 12, fontFamily: 'var(--font-jetbrains-mono), monospace', marginBottom: 14 }}>
            ⚠ Obszar nakłada się na istniejący blok — wybierz inne miejsce.
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || isOverlap || !privacyConsent}
          style={{
            width: '100%', background: uploading || isOverlap || !privacyConsent ? '#2A2C36' : '#2EE6A6',
            color: uploading || isOverlap || !privacyConsent ? '#5A5C66' : '#1A0A05',
            fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 15,
            padding: 16, border: 'none', cursor: uploading || isOverlap || !privacyConsent ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Wgrywam…' : 'Dodaj'}
        </button>
      </form>
    </div>
  )
}
