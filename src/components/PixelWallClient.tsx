'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import Navbar from './Navbar'
import PixelGrid from './PixelGrid'
import CanvasToolbar from './CanvasToolbar'
import PixelCounter from './PixelCounter'
import BuyPageContent from './BuyPageContent'
import type { PixelBlock } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function PixelWallClient() {
  const { isMobile } = useBreakpoint()
  const [blocks, setBlocks] = useState<PixelBlock[]>([])
  const [buyOpen, setBuyOpen] = useState(false)
  const [initialSel, setInitialSel] = useState<{ x: number; y: number; w: number; h: number } | undefined>(undefined)
  const [hintText, setHintText] = useState('Najedź lub kliknij blok, aby zobaczyć szczegóły')
  const [zoomPct, setZoomPct] = useState(50)
  const [externalScale, setExternalScale] = useState<number | undefined>(undefined)

  const counterBarRef = useRef<HTMLDivElement>(null)
  const [digitW, setDigitW] = useState(24)

  useEffect(() => {
    const el = counterBarRef.current
    if (!el) return
    const calc = () => {
      // overhead: 24px padding + 32px flex gaps + 1px separator + 24px inter-digit gaps (6*2 per counter * 2)
      setDigitW(Math.min(24, Math.max(10, Math.floor((el.offsetWidth - 81) / 14))))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const soldPixels = blocks.reduce((sum, b) => sum + b.width * b.height, 0)
  const freePixels = 1_000_000 - soldPixels

  const handleHover = useCallback((block: PixelBlock | null) => {
    setHintText(
      block
        ? `${block.owner_name ?? 'Anonimowy'} · ${block.width}×${block.height} px · ${(block.width * block.height).toLocaleString('pl-PL')} zł`
        : 'Najedź na siatkę, aby zobaczyć podgląd'
    )
  }, [])

  const handleBlocksLoaded = useCallback((loaded: PixelBlock[]) => setBlocks(loaded), [])
  const handleNewBlock = useCallback((block: PixelBlock) => setBlocks(prev => [...prev, block]), [])
  const handleSelectionComplete = useCallback((sel: { x: number; y: number; w: number; h: number }) => {
    setInitialSel(sel)
    setBuyOpen(true)
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

      {/* Headline */}
      <div
        style={{
          padding: isMobile ? '10px 16px' : '14px 32px',
          background: '#0B0C10',
          borderBottom: '1px solid #1F212B',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(18px, 2vw, 26px)',
            letterSpacing: '-0.025em',
            color: '#F5F0E6',
            lineHeight: 1.15,
          }}
        >
          Kup kawałek <span style={{ color: '#FF4D2E' }}>internetu</span> na zawsze
          {!isMobile && (
            <span style={{ display: 'inline-block', position: 'relative', marginLeft: 12, fontSize: '0.7em', verticalAlign: 'middle' }}>
              <span
                style={{
                  fontWeight: 600,
                  background: 'linear-gradient(90deg, #b8860b 0%, #FFD23F 40%, #ffe88a 60%, #FFD23F 80%, #b8860b 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'goldShimmer 6s linear infinite',
                }}
              >
                — Twoje logo na Times Square w Nowym Jorku
              </span>
            </span>
          )}
        </h1>
        <button
          onClick={() => setBuyOpen(true)}
          style={{
            flexShrink: 0,
            background: '#FF4D2E',
            color: '#1A0A05',
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: isMobile ? 13 : 15,
            padding: isMobile ? '8px 14px' : '10px 20px',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          + Dodaj obraz
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <PixelGrid
          onHover={handleHover}
          onBlocksLoaded={handleBlocksLoaded}
          onNewBlock={handleNewBlock}
          onZoomChange={handleZoomChange}
          externalScale={externalScale}
          reinitKey={Number(isMobile)}
          showHint={!buyOpen}
          onSelectionComplete={handleSelectionComplete}
        />
      </div>

      <CanvasToolbar
        hintText={hintText}
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

        <div style={{ width: 1, height: 36, background: '#2A2C36' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, letterSpacing: '0.1em', color: '#B7B2A4', textTransform: 'uppercase' }}>
            Wolne
          </span>
          <PixelCounter value={freePixels} color="green" digitWidth={digitW} />
        </div>

        {!isMobile && (
          <>
            <div style={{ width: 1, height: 36, background: '#2A2C36' }} />
            <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, color: '#5A5C66' }}>
              1 000 × 1 000 · 1 zł / px
            </span>
          </>
        )}
      </div>

      {/* Buy modal overlay */}
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
              onClose={() => { setBuyOpen(false); setInitialSel(undefined) }}
              initialSel={initialSel}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
