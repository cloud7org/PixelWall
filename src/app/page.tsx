import PixelWallClient from '@/components/PixelWallClient'
import HowItWorks from '@/components/HowItWorks'
import TimesSquare from '@/components/TimesSquare'
import PriceCalculator from '@/components/PriceCalculator'
import Link from 'next/link'

export default function Page() {
  return (
    <>
      {/* Above-fold: interactive canvas + hero overlay */}
      <PixelWallClient />

      {/* Below-fold sections (in normal document flow, under the fixed canvas) */}
      <div style={{ marginTop: '100vh', position: 'relative', zIndex: 2, background: '#0B0C10' }}>
        <HowItWorks />
        <TimesSquare />
        <PriceCalculator />

        <footer
          style={{
            borderTop: '1px solid #1F212B',
            padding: '36px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 12,
            color: '#B7B2A4',
          }}
        >
          <span>pixelwall — strona demonstracyjna</span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/owners" style={{ color: '#B7B2A4', textDecoration: 'none' }}>
              Właściciele
            </Link>
            <Link href="/buy" style={{ color: '#B7B2A4', textDecoration: 'none' }}>
              Kup piksele
            </Link>
          </div>
          <span style={{ color: '#5A5C66', fontSize: 11 }}>
            zbudowana w duchu internetu 2005 roku
          </span>
        </footer>
      </div>
    </>
  )
}
