'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'

function safeHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export default function OwnersPage() {
  const { isMobile } = useBreakpoint()
  const [blocks, setBlocks] = useState<PixelBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('pixel_blocks')
      .select('*')
      .then(({ data }) => {
        const sorted = ((data as PixelBlock[]) ?? []).sort(
          (a, b) => b.width * b.height - a.width * a.height
        )
        setBlocks(sorted)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '32px 16px' : '56px 48px' }}>
        <div style={{ marginBottom: 40 }}>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              letterSpacing: '0.1em',
              color: '#2EE6A6',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 12,
            }}
          >
            {blocks.length} właścicieli
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 36px)',
              letterSpacing: '-0.02em',
              color: '#F5F0E6',
              marginBottom: 8,
            }}
          >
            Ranking właścicieli
          </h1>
          <p style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 13,
            color: '#5A5C66',
          }}>
            Sprawdź kto króluje w pixelowej lidze
          </p>
        </div>

        {loading ? (
          <div style={{ color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
            Ładowanie…
          </div>
        ) : blocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#B7B2A4', marginBottom: 24, fontSize: 16 }}>
              Nie ma jeszcze żadnych właścicieli. Bądź pierwszy!
            </p>
            <Link
              href="/buy"
              style={{
                background: '#FF4D2E',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontFamily: 'var(--font-space-grotesk), sans-serif',
              }}
            >
              Kup pixele →
            </Link>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid #1F212B',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#14151B', borderBottom: '1px solid #1F212B' }}>
                    {['Miejsce', 'Podgląd', 'Właściciel', 'Rozmiar', 'Piksele', 'Cena', 'Link', 'Data'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                          fontSize: 11,
                          letterSpacing: '0.07em',
                          color: '#B7B2A4',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block, i) => {
                    const isFirst = i === 0
                    return (
                      <tr
                        key={block.id}
                        style={{
                          borderBottom: i < blocks.length - 1 ? '1px solid #1F212B' : 'none',
                          background: isFirst
                            ? 'rgba(255,210,63,0.07)'
                            : i % 2 === 0 ? '#0B0C10' : '#0E0F14',
                          borderLeft: isFirst ? '3px solid #FFD23F' : '3px solid transparent',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: isFirst ? 18 : 13,
                            fontWeight: 700,
                            color: isFirst ? '#FFD23F' : '#5A5C66',
                          }}>
                            {isFirst ? '🥇' : `${i + 1}.`}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <img
                            src={block.image_url}
                            alt={block.alt_text ?? ''}
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover', border: `1px solid ${isFirst ? '#FFD23F' : '#2A2C36'}`, borderRadius: 4 }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', color: isFirst ? '#FFD23F' : '#F5F0E6', fontSize: 14, fontWeight: isFirst ? 700 : 400 }}>
                          {block.owner_name ?? 'Anonimowy'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 12,
                            color: '#B7B2A4',
                          }}
                        >
                          {block.width}×{block.height}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 13,
                            color: '#2EE6A6',
                            fontWeight: 600,
                          }}
                        >
                          {(block.width * block.height).toLocaleString('pl-PL')}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 13,
                            color: '#FFD23F',
                            fontWeight: 600,
                          }}
                        >
                          {(block.width * block.height).toLocaleString('pl-PL')} zł
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {block.link_url ? (
                            <a
                              href={safeHref(block.link_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#FF4D2E', textDecoration: 'none', fontSize: 13 }}
                            >
                              {block.link_url.replace(/^https?:\/\//, '').slice(0, 28)}
                              {block.link_url.length > 35 ? '…' : ''}
                            </a>
                          ) : <span style={{ color: '#54566a', fontSize: 13 }}>—</span>}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 11,
                            color: '#5A5C66',
                          }}
                        >
                          {new Date(block.created_at).toLocaleDateString('pl-PL')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
