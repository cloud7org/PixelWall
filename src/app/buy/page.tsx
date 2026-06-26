import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import BuyPageContent from '@/components/BuyPageContent'

export default function BuyPage() {
  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 48px' }}>
        <div style={{ marginBottom: 40 }}>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              letterSpacing: '0.1em',
              color: '#FF4D2E',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 12,
            }}
          >
            Zakup pixeli
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 36px)',
              letterSpacing: '-0.02em',
              color: '#F5F0E6',
            }}
          >
            Zaznacz swój obszar
          </h1>
        </div>
        <Suspense
          fallback={
            <div style={{ color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
              Ładowanie…
            </div>
          }
        >
          <BuyPageContent />
        </Suspense>
      </div>
    </div>
  )
}
