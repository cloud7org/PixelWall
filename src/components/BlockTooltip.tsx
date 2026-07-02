'use client'

import { useEffect, useState } from 'react'
import type { PixelBlock } from '@/types'

interface Props {
  block: PixelBlock
  anchor: { x: number; y: number; width: number; height: number }
  onClose: () => void
}

export default function BlockTooltip({ block, anchor, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Popover anchored to the clicked block, flipped above/below so it never
  // covers the fixed bottom nav/counter bar.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tooltipWidth = Math.min(280, vw - 32)
  const showAbove = anchor.y > vh * 0.55
  const left = Math.min(Math.max(anchor.x + anchor.width / 2 - tooltipWidth / 2, 16), vw - 16 - tooltipWidth)
  const verticalStyle: React.CSSProperties = showAbove
    ? { bottom: vh - anchor.y + 8 }
    : { top: anchor.y + anchor.height + 8 }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        left,
        width: tooltipWidth,
        ...verticalStyle,
        zIndex: 250,
        background: '#1A1C24',
        border: '1px solid #2A2C36',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#F5F0E6',
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 4,
        }}>
          {block.owner_name ?? 'Anonimowy'}
        </div>
        {block.alt_text && (
          <div style={{
            color: '#B7B2A4',
            fontSize: 12,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {block.alt_text}
          </div>
        )}
        {block.link_url && (
          <a
            href={/^https?:\/\//i.test(block.link_url!) ? block.link_url! : `https://${block.link_url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: '#2EE6A6',
              fontSize: 12,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              textDecoration: 'none',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {block.link_url}
          </a>
        )}
        {!block.alt_text && !block.link_url && (
          <div style={{
            color: '#5A5C66',
            fontSize: 12,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}>
            {block.width}×{block.height} px
          </div>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#5A5C66',
          cursor: 'pointer',
          fontSize: 20,
          padding: 0,
          flexShrink: 0,
          lineHeight: 1,
          fontFamily: 'sans-serif',
        }}
        aria-label="Zamknij"
      >
        ×
      </button>
    </div>
  )
}
