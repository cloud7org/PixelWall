import Navbar from '@/components/Navbar'
import HowItWorks from '@/components/HowItWorks'
import TimesSquare from '@/components/TimesSquare'

export default function HowPage() {
  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />
      <HowItWorks />
      <TimesSquare />
      <footer
        style={{
          borderTop: '1px solid #1F212B',
          padding: '32px 48px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 12,
          color: '#5A5C66',
        }}
      >
        <span>pixelwall — strona demonstracyjna</span>
      </footer>
    </div>
  )
}
