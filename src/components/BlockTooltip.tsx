'use client'

import { useEffect, useState } from 'react'
import type { PixelBlock } from '@/types'

interface Props {
  block: PixelBlock
  onClose: () => void
}

export default function BlockTooltip({ block, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        bottom: 80,
        left: 16,
        right: 16,
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
            href={block.link_url}
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
