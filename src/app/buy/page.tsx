import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import BuyPageContent from '@/components/BuyPageContent'

export default function BuyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0B0C10' }}>
      <Navbar />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Suspense
          fallback={
            <div style={{ height: '100%', background: '#0B0C10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
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
