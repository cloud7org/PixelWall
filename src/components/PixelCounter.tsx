interface Props {
  value: number
  color: 'red' | 'green'
  compact?: boolean
}

function DigitBox({ digit, color, compact }: { digit: string; color: 'red' | 'green'; compact?: boolean }) {
  return (
    <div
      style={{
        width: compact ? 18 : 24,
        height: compact ? 26 : 34,
        background: '#000',
        border: '1px solid #2A2C36',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        fontWeight: 700,
        fontSize: compact ? 13 : 18,
        color: color === 'red' ? '#FF4D2E' : '#2EE6A6',
      }}
    >
      {digit}
    </div>
  )
}

export default function PixelCounter({ value, color, compact }: Props) {
  const digits = String(value).padStart(7, '0').slice(-7)
  return (
    <div style={{ display: 'flex', gap: compact ? 1 : 2 }}>
      {digits.split('').map((d, i) => (
        <DigitBox key={i} digit={d} color={color} compact={compact} />
      ))}
    </div>
  )
}
