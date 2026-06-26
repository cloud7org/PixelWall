'use client'

interface Props {
  hintText: string
  zoomPct: number
  onZoomChange: (pct: number) => void
  onFullscreen: () => void
}

export default function CanvasToolbar({ hintText, zoomPct, onZoomChange, onFullscreen }: Props) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="ti ti-crosshair" aria-hidden="true" />
        <span>{hintText}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className="ti ti-search" aria-hidden="true" />
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
          }}
        >
          <i className="ti ti-arrows-maximize" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
