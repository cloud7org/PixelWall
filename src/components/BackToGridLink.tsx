'use client'

import Link from 'next/link'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function BackToGridLink() {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{ background: '#0B0C10', padding: isMobile ? '16px 16px 0' : '20px 32px 0' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#B7B2A4',
          textDecoration: 'none',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span aria-hidden="true">←</span> Wróć do siatki
      </Link>
    </div>
  )
}
