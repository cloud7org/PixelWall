'use client'

import Navbar from '@/components/Navbar'
import HowItWorks from '@/components/HowItWorks'
import TimesSquare from '@/components/TimesSquare'
import PriceCalculator from '@/components/PriceCalculator'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function HowPage() {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />
      <HowItWorks />
      <TimesSquare />
      <PriceCalculator />
      <footer
        style={{
          borderTop: '1px solid #1F212B',
          padding: isMobile ? '20px 16px' : '32px 48px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 12,
          color: '#5A5C66',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <span>pixelwall — strona demonstracyjna</span>
      </footer>
    </div>
  )
}
