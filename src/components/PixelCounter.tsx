interface Props {
  value: number
  color: 'red' | 'green'
}

function DigitBox({ digit, color }: { digit: string; color: 'red' | 'green' }) {
  return (
    <div
      style={{
        width: 24,
        height: 34,
        background: '#000',
        border: '1px solid #2A2C36',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        fontWeight: 700,
        fontSize: 18,
        color: color === 'red' ? '#FF4D2E' : '#2EE6A6',
      }}
    >
      {digit}
    </div>
  )
}

export default function PixelCounter({ value, color }: Props) {
  const digits = String(value).padStart(7, '0').slice(-7)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {digits.split('').map((d, i) => (
        <DigitBox key={i} digit={d} color={color} />
      ))}
    </div>
  )
}
