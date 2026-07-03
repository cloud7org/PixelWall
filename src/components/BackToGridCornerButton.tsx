'use client'

import Link from 'next/link'

export default function BackToGridCornerButton() {
  return (
    <Link
      href="/"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 5,
        height: 32,
        padding: '0 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid #3A3C46',
        background: 'rgba(11,12,16,0.70)',
        color: '#8A8676',
        textDecoration: 'none',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true">←</span> Wróć do siatki
    </Link>
  )
}
