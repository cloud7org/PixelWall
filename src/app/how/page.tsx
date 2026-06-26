import Navbar from '@/components/Navbar'
import HowItWorks from '@/components/HowItWorks'
import TimesSquare from '@/components/TimesSquare'
import PriceCalculator from '@/components/PriceCalculator'
import Link from 'next/link'

export default function HowPage() {
  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />
      <HowItWorks />
      <TimesSquare />
      <PriceCalculator />
      <footer
        style={{
          borderTop: '1px solid #1F212B',
          padding: '32px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 12,
          color: '#5A5C66',
        }}
      >
        <span>pixelwall — strona demonstracyjna</span>
        <Link href="/buy" style={{ color: '#FF4D2E', textDecoration: 'none' }}>
          Kup piksele →
        </Link>
      </footer>
    </div>
  )
}
