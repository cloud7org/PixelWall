'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const goldStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg,#b8860b 0%,#FFD23F 40%,#ffe88a 60%,#FFD23F 80%,#b8860b 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  animation: 'goldShimmer 6s linear infinite',
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

        {/* Middle: headline text — clipped at both ends, never covers logo or nav items */}
        {isMobile ? (
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', margin: '0 10px' }}>
            <span
              style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                animation: 'marqueeScroll 22s linear infinite',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {/* Copy 1 */}
              <span style={{ color: '#F5F0E6' }}>
                Kup kawałek <span style={{ color: '#FF4D2E' }}>internetu</span> na zawsze{'  '}
              </span>
              <span style={goldStyle}>— Twoje logo na Times Square w Nowym Jorku{'      '}</span>
              {/* Copy 2 — seamless loop: translateX(-50%) = exactly one copy width */}
              <span style={{ color: '#F5F0E6' }}>
                Kup kawałek <span style={{ color: '#FF4D2E' }}>internetu</span> na zawsze{'  '}
              </span>
              <span style={goldStyle}>— Twoje logo na Times Square w Nowym Jorku{'      '}</span>
            </span>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', margin: '0 24px' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 600,
                fontSize: 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#F5F0E6',
              }}
            >
              Kup kawałek <span style={{ color: '#FF4D2E' }}>internetu</span> na zawsze{' '}
              <span style={goldStyle}>— Twoje logo na Times Square w Nowym Jorku</span>
            </span>
          </div>
        )}

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
              Właściciele
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
          </div>
        </div>
      )}
    </>
  )
}
