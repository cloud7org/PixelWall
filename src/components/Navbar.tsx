'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function Navbar() {
  const { isMobile } = useBreakpoint()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Siatka' },
    { href: '/how', label: 'Jak to działa' },
    { href: '/owners', label: 'Właściciele' },
  ]

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 32px',
          height: isMobile ? 48 : 56,
          background: '#0B0C10',
          borderBottom: '1px solid #1F212B',
          flexShrink: 0,
          zIndex: 30,
          position: 'relative',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 26, height: 26,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
              borderRadius: 3, overflow: 'hidden',
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
              fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: '#F5F0E6',
            }}
          >
            pixel<span style={{ color: '#FF4D2E' }}>wall</span>
          </span>
        </Link>

        {isMobile ? (
          /* Hamburger button */
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={menuOpen}
            style={{
              width: 44, height: 44, background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#B7B2A4', cursor: 'pointer', fontSize: 22, padding: 0,
            }}
          >
            <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} />
          </button>
        ) : (
          /* Desktop nav */
          <>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ color: '#B7B2A4', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
                >
                  {label}
                </Link>
              ))}
            </div>
            <Link
              href="/buy"
              style={{
                background: '#FF4D2E', color: '#fff', fontWeight: 600, fontSize: 14,
                padding: '9px 20px', borderRadius: 6, textDecoration: 'none',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
              }}
            >
              Kup pixele
            </Link>
          </>
        )}
      </nav>

      {/* Mobile overlay menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 48, left: 0, right: 0, bottom: 0,
            zIndex: 29,
            background: '#0B0C10',
            borderTop: '1px solid #1F212B',
            display: 'flex', flexDirection: 'column',
            padding: '20px 20px 32px',
            overflowY: 'auto',
          }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: '#F5F0E6', textDecoration: 'none',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 600, fontSize: 20,
                padding: '16px 0',
                borderBottom: '1px solid #1F212B',
                display: 'block',
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/buy"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 24,
              background: '#FF4D2E', color: '#fff',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700, fontSize: 16,
              padding: '16px', borderRadius: 6, textDecoration: 'none',
              minHeight: 52,
            }}
          >
            Kup pixele
          </Link>
        </div>
      )}
    </>
  )
}
