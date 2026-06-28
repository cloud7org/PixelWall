'use client'

import { useState, useCallback } from 'react'
import Navbar from './Navbar'
import PixelGrid from './PixelGrid'
import CanvasToolbar from './CanvasToolbar'
import PixelCounter from './PixelCounter'
import type { PixelBlock } from '@/types'

export default function PixelWallClient() {
  const [blocks, setBlocks] = useState<PixelBlock[]>([])
  const [hintText, setHintText] = useState('Najedź lub kliknij blok, aby zobaczyć szczegóły')
  const [zoomPct, setZoomPct] = useState(50)
  const [externalScale, setExternalScale] = useState<number | undefined>(undefined)

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
          padding: '14px 32px',
          background: '#0B0C10',
          borderBottom: '1px solid #1F212B',
          flexShrink: 0,
          textAlign: 'center',
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
        </h1>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <PixelGrid
          onHover={handleHover}
          onBlocksLoaded={handleBlocksLoaded}
          onNewBlock={handleNewBlock}
          onZoomChange={handleZoomChange}
          externalScale={externalScale}
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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          padding: '10px 32px',
          background: '#0B0C10',
          borderTop: '1px solid #1F212B',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, letterSpacing: '0.1em', color: '#B7B2A4', textTransform: 'uppercase' }}>
            Sprzedane pixele
          </span>
          <PixelCounter value={soldPixels} color="red" />
        </div>

        <div style={{ width: 1, height: 36, background: '#2A2C36' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, letterSpacing: '0.1em', color: '#B7B2A4', textTransform: 'uppercase' }}>
            Wolne pixele
          </span>
          <PixelCounter value={freePixels} color="green" />
        </div>

        <div style={{ width: 1, height: 36, background: '#2A2C36' }} />

        <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, color: '#5A5C66' }}>
          1 000 × 1 000 · 1 zł / px
        </span>
      </div>
    </div>
  )
}
