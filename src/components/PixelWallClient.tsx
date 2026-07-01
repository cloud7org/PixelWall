'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import Navbar from './Navbar'
import PixelGrid from './PixelGrid'
import CanvasToolbar from './CanvasToolbar'
import PixelCounter from './PixelCounter'
import BuyPageContent from './BuyPageContent'
import BuyBottomSheet from './BuyBottomSheet'
import BlockTooltip from './BlockTooltip'
import type { PixelBlock } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function PixelWallClient() {
  const { isMobile } = useBreakpoint()
  const [blocks, setBlocks] = useState<PixelBlock[]>([])
  const [buyOpen, setBuyOpen] = useState(false)
  const [fetchKey, setFetchKey] = useState<number | undefined>(undefined)
  const [zoomPct, setZoomPct] = useState(50)
  const [externalScale, setExternalScale] = useState<number | undefined>(undefined)

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [dragSel, setDragSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [sheetImageUrl, setSheetImageUrl] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<PixelBlock | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const counterBarRef = useRef<HTMLDivElement>(null)
  const [digitW, setDigitW] = useState(24)

  // Create/revoke object URL for the selected file
  useEffect(() => {
    if (!sheetFile) { setSheetImageUrl(null); return }
    const url = URL.createObjectURL(sheetFile)
    setSheetImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [sheetFile])

  useEffect(() => {
    const el = counterBarRef.current
    if (!el) return
    const calc = () => {
      setDigitW(Math.min(24, Math.max(10, Math.floor((el.offsetWidth - 81) / 14))))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const soldPixels = blocks.reduce((sum, b) => sum + b.width * b.height, 0)

  const handleHover = useCallback((_: PixelBlock | null) => {}, [])

  const handleBlocksLoaded = useCallback((loaded: PixelBlock[]) => setBlocks(loaded), [])
  const handleNewBlock = useCallback((block: PixelBlock) => setBlocks(prev => [...prev, block]), [])

  const handleDragSelectComplete = useCallback((sel: { x: number; y: number; w: number; h: number }) => {
    setDragSel(sel)
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) { setDragSel(null); return }
    setSheetFile(file)
    setBottomSheetOpen(true)
  }, [])

  const handleBlockClick = useCallback((block: PixelBlock) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setTooltip(block)
    tooltipTimerRef.current = setTimeout(() => setTooltip(null), 3500)
  }, [])

  const handleBottomSheetClose = useCallback(() => {
    setBottomSheetOpen(false)
    setSheetFile(null)
    setDragSel(null)
  }, [])

  const handleBottomSheetSuccess = useCallback(() => {
    setBottomSheetOpen(false)
    setSheetFile(null)
    setDragSel(null)
    setFetchKey(k => (k ?? 0) + 1)
  }, [])

  const handleZoomChange = useCallback((pct: number) => setZoomPct(pct), [])
  const handleSliderChange = useCallback((pct: number) => { setZoomPct(pct); setExternalScale(pct) }, [])
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B0C10' }}>
      <Navbar />

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <PixelGrid
          onHover={handleHover}
          onBlocksLoaded={handleBlocksLoaded}
          onNewBlock={handleNewBlock}
          onZoomChange={handleZoomChange}
          externalScale={externalScale}
          reinitKey={Number(isMobile)}
          fetchKey={fetchKey}
          showHint={!buyOpen && !bottomSheetOpen}
          onDragSelectComplete={handleDragSelectComplete}
          onBlockClick={handleBlockClick}
          draftSel={bottomSheetOpen ? dragSel ?? undefined : undefined}
          draftImageUrl={bottomSheetOpen && sheetImageUrl ? sheetImageUrl : undefined}
          onSelChange={setDragSel}
        />
      </div>

      <CanvasToolbar
        zoomPct={zoomPct}
        onZoomChange={handleSliderChange}
        onFullscreen={handleFullscreen}
      />

      {/* Counter bar */}
      <div
        ref={counterBarRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? 16 : 40,
          padding: isMobile ? '8px 12px' : '10px 32px',
          background: '#0B0C10',
          borderTop: '1px solid #1F212B',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, letterSpacing: '0.1em', color: '#B7B2A4', textTransform: 'uppercase' }}>
            Sprzedane
          </span>
          <PixelCounter value={soldPixels} color="red" digitWidth={digitW} />
        </div>

      </div>

      {/* Hidden file input for mobile drag-select flow */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Mobile bottom sheet (30vh, grid remains interactive above) */}
      {bottomSheetOpen && dragSel && sheetImageUrl && (
        <BuyBottomSheet
          sel={dragSel}
          file={sheetFile!}
          imageUrl={sheetImageUrl}
          onClose={handleBottomSheetClose}
          onSuccess={handleBottomSheetSuccess}
        />
      )}

      {/* Block info tooltip */}
      {tooltip && (
        <BlockTooltip
          block={tooltip}
          onClose={() => {
            if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
            setTooltip(null)
          }}
        />
      )}

      {/* Buy modal overlay (opened via "+ Dodaj obraz" button) */}
      {buyOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', background: '#0B0C10',
        }}>
          <Suspense fallback={
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>
              Ładowanie…
            </div>
          }>
            <BuyPageContent
              onClose={() => { setBuyOpen(false); setFetchKey(k => (k ?? 0) + 1) }}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
