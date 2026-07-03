'use client'

interface Props {
  mode: 'pan' | 'draw'
  onChange: (mode: 'pan' | 'draw') => void
}

export default function ToolModeToggle({ mode, onChange }: Props) {
  const btnStyle = (activeColor: string | null): React.CSSProperties => ({
    padding: '6px 10px',
    border: 'none',
    background: activeColor ?? 'transparent',
    color: activeColor ? '#0B0C10' : '#8A8676',
    fontWeight: activeColor ? 700 : 400,
    cursor: 'pointer',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    flexShrink: 0,
  })

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {/* Pulsing glow frame around both buttons */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          background: '#FF4D2E',
          filter: 'blur(6px)',
          opacity: 0.55,
          animation: 'pulse 1.6s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', border: '2px solid #FF4D2E', background: '#0B0C10' }}>
        <button type="button" onClick={() => onChange('pan')} style={btnStyle(mode === 'pan' ? '#2EE6A6' : null)}>
          Przesuń
        </button>
        <button type="button" onClick={() => onChange('draw')} style={btnStyle(mode === 'draw' ? '#FF4D2E' : null)}>
          Zaznacz
        </button>
      </div>
    </div>
  )
}
