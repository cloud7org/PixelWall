'use client'

interface Props {
  mode: 'pan' | 'draw'
  onChange: (mode: 'pan' | 'draw') => void
}

export default function ToolModeToggle({ mode, onChange }: Props) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    border: 'none',
    background: active ? '#0B0C10' : 'transparent',
    color: active ? '#F5F0E6' : '#8A8676',
    cursor: 'pointer',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    flexShrink: 0,
  })

  return (
    <div style={{ display: 'flex', border: '1px solid #E3DFD3', background: '#FAF8F2', flexShrink: 0 }}>
      <button type="button" onClick={() => onChange('pan')} style={btnStyle(mode === 'pan')}>
        Przesuń
      </button>
      <button type="button" onClick={() => onChange('draw')} style={btnStyle(mode === 'draw')}>
        Zaznacz
      </button>
    </div>
  )
}
