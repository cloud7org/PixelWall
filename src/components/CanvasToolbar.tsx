'use client'

import { useBreakpoint } from '@/hooks/useBreakpoint'

interface Props {
  zoomPct: number
  onZoomChange: (pct: number) => void
  onFullscreen: () => void
}

export default function CanvasToolbar({ zoomPct, onZoomChange, onFullscreen }: Props) {
  const { isMobile } = useBreakpoint()

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px 12px',
          borderTop: '1px solid #E3DFD3',
          background: '#FAF8F2',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          color: '#8A8676',
          flexShrink: 0,
          userSelect: 'none',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 70, height: 3, background: '#E3DFD3' }}>
            <input
              type="range"
              min={10}
              max={100}
              value={zoomPct}
              onChange={e => onZoomChange(Number(e.target.value))}
              style={{
                position: 'absolute', inset: 0, width: '100%',
                opacity: 0, cursor: 'pointer', height: '400%', top: '-150%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${(zoomPct - 10) / 90 * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 10, height: 10,
                background: '#FFD23F', borderRadius: '50%', pointerEvents: 'none',
              }}
            />
          </div>
          <span style={{ minWidth: 32 }}>{zoomPct}%</span>
          <button
            onClick={onFullscreen}
            title="Pełny ekran"
            style={{
              width: 28, height: 28,
              border: '1px solid #E3DFD3',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8A8676', cursor: 'pointer', padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        height: 38,
        borderTop: '1px solid #E3DFD3',
        background: '#FAF8F2',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 12,
        color: '#8A8676',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <div style={{ position: 'relative', width: 90, height: 3, background: '#E3DFD3' }}>
          <input
            type="range"
            min={10}
            max={100}
            value={zoomPct}
            onChange={e => onZoomChange(Number(e.target.value))}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              opacity: 0,
              cursor: 'pointer',
              height: '200%',
              top: '-50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${(zoomPct - 10) / 90 * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 10,
              height: 10,
              background: '#FFD23F',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </div>
        <span style={{ minWidth: 36 }}>{zoomPct}%</span>
        <button
          onClick={onFullscreen}
          title="Pełny ekran"
          style={{
            width: 26,
            height: 26,
            border: '1px solid #E3DFD3',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8A8676',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
