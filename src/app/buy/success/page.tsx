import Link from 'next/link'

export default function BuySuccessPage() {
  return (
    <div style={{
      height: '100vh', background: '#0B0C10',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: '0 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>🎉</div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', color: '#2EE6A6', fontSize: 28, fontWeight: 700 }}>
        Piksele są Twoje!
      </h1>
      <p style={{ color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13, maxWidth: 420 }}>
        Płatność potwierdzona. Twoja grafika pojawi się na siatce za chwilę.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8, background: '#FF4D2E', color: '#fff', fontWeight: 600, fontSize: 15,
          padding: '14px 28px', borderRadius: 8, textDecoration: 'none',
          fontFamily: 'var(--font-space-grotesk), sans-serif',
        }}
      >
        Wróć na siatkę →
      </Link>
    </div>
  )
}
