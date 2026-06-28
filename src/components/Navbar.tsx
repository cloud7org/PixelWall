import Link from 'next/link'

export default function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 56,
        background: '#0B0C10',
        borderBottom: '1px solid #1F212B',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div
          style={{
            width: 26,
            height: 26,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#FF4D2E' }} />
          <div style={{ background: '#2EE6A6' }} />
          <div style={{ background: '#FFD23F' }} />
          <div style={{ background: '#F5F0E6' }} />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '-0.02em',
            color: '#F5F0E6',
          }}
        >
          pixel<span style={{ color: '#FF4D2E' }}>wall</span>
        </span>
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Link href="/" style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          Siatka
        </Link>
        <Link href="/how" style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          Jak to działa
        </Link>
        <Link href="/owners" style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          Właściciele
        </Link>
      </div>

      {/* CTA */}
      <Link
        href="/buy"
        style={{
          background: '#FF4D2E',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          padding: '9px 20px',
          borderRadius: 6,
          textDecoration: 'none',
          fontFamily: 'var(--font-space-grotesk), sans-serif',
        }}
      >
        Kup pixele
      </Link>
    </nav>
  )
}
