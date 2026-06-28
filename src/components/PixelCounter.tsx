interface Props {
  value: number
  color: 'red' | 'green'
  digitWidth?: number
}

function DigitBox({ digit, color, w }: { digit: string; color: 'red' | 'green'; w: number }) {
  return (
    <div
      style={{
        width: w,
        height: Math.round(w * 34 / 24),
        background: '#000',
        border: '1px solid #2A2C36',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        fontWeight: 700,
        fontSize: Math.round(w * 18 / 24),
        color: color === 'red' ? '#FF4D2E' : '#2EE6A6',
      }}
    >
      {digit}
    </div>
  )
}

export default function PixelCounter({ value, color, digitWidth = 24 }: Props) {
  const digits = String(value).padStart(7, '0').slice(-7)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {digits.split('').map((d, i) => (
        <DigitBox key={i} digit={d} color={color} w={digitWidth} />
      ))}
    </div>
  )
}
