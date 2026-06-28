'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function Navbar() {
  const { isMobile } = useBreakpoint()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 32px',
          height: 56,
          background: '#0B0C10',
          borderBottom: '1px solid #1F212B',
          flexShrink: 0,
          zIndex: 20,
          position: 'relative',
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

        {/* Desktop: Links + CTA */}
        {!isMobile && (
          <>
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
          </>
        )}

        {/* Mobile: hamburger button */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              color: '#F5F0E6',
            }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: '#F5F0E6' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#F5F0E6' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#F5F0E6' }} />
          </button>
        )}
      </nav>

      {/* Mobile overlay menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: '#0B0C10',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Overlay header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              height: 56,
              borderBottom: '1px solid #1F212B',
            }}
          >
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
            >
              <div
                style={{
                  width: 26, height: 26,
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
              <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: '#F5F0E6' }}>
                pixel<span style={{ color: '#FF4D2E' }}>wall</span>
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Zamknij menu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#F5F0E6', padding: 8, fontSize: 24, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Overlay links */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 24px', gap: 8, flex: 1 }}>
            {[
              { href: '/',       label: 'Siatka' },
              { href: '/how',    label: 'Jak to działa' },
              { href: '/owners', label: 'Właściciele' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#F5F0E6',
                  textDecoration: 'none',
                  fontSize: 22,
                  fontWeight: 600,
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  padding: '14px 0',
                  borderBottom: '1px solid #1F212B',
                }}
              >
                {label}
              </Link>
            ))}

            <Link
              href="/buy"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                marginTop: 32,
                background: '#FF4D2E',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                padding: '16px 24px',
                borderRadius: 6,
                textDecoration: 'none',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                textAlign: 'center',
              }}
            >
              Kup pixele
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
