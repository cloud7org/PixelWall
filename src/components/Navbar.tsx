'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const TAGLINE = 'YOUR PIXEL. YOUR STORY.'
const LETTER_MS = 45

function AnimatedTagline({ fontSize, baseDelayMs = 0 }: { fontSize: number; baseDelayMs?: number }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-space-grotesk), sans-serif',
        fontWeight: 700,
        fontSize,
        letterSpacing: '0.02em',
        color: '#F5F0E6',
        whiteSpace: 'nowrap',
      }}
    >
      {TAGLINE.split('').map((ch, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animation: `letterFlyIn 260ms ease-out ${baseDelayMs + i * LETTER_MS}ms both`,
          }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

export default function Navbar() {
  const { isMobile } = useBreakpoint()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
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
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
        >
          <img src="/logo.png" alt="Pixarium" style={{ height: 36, width: 'auto', borderRadius: 6 }} />
        </Link>

        {/* Middle: animated tagline — never covers logo or nav items */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center', margin: isMobile ? '0 10px' : '0 24px' }}>
          <AnimatedTagline fontSize={isMobile ? 13 : 15} baseDelayMs={isMobile ? 4000 : 0} />
        </div>

        {/* Desktop: Links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/" style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              Siatka
            </Link>
            <Link href="/how" style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              Jak to działa
            </Link>
            <Link href="/owners" style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              Liga
            </Link>
          </div>
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
              flexShrink: 0,
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
              <img src="/logo.png" alt="Pixarium" style={{ height: 36, width: 'auto', borderRadius: 6 }} />
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
              { href: '/owners', label: 'Liga' },
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
          </div>
        </div>
      )}
    </>
  )
}
