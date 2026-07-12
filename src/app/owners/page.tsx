'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BackToGridCornerButton from '@/components/BackToGridCornerButton'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { calculateFrameWidth } from '@/lib/pricing'

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
        setBlocks((data as PixelBlock[]) ?? [])
        setLoading(false)
      })
  }, [])

  const players = useMemo(() => {
    const groups = new Map<string, PixelBlock[]>()
    for (const block of blocks) {
      const key = block.email?.trim().toLowerCase() ?? ''
      const group = groups.get(key)
      if (group) group.push(block)
      else groups.set(key, [block])
    }
    return Array.from(groups.entries())
      .map(([email, playerBlocks]) => {
        const byDate = [...playerBlocks].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        return {
          email,
          totalPixels: playerBlocks.reduce((sum, b) => sum + b.width * b.height, 0),
          blockCount: playerBlocks.length,
          firstBlock: byDate[0],
          lastPurchaseAt: byDate[byDate.length - 1].created_at,
        }
      })
      .sort((a, b) => b.totalPixels - a.totalPixels)
  }, [blocks])

  return (
    <div style={{ background: '#0B0C10', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: isMobile ? '32px 16px' : '56px 48px' }}>
        <BackToGridCornerButton />
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
            {blocks.length} bloków w lidze
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
            Ranking Ligi
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
        ) : players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#B7B2A4', marginBottom: 24, fontSize: 16 }}>
              Liga jest jeszcze pusta. Bądź pierwszy!
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
                    {['Miejsce', 'Podgląd', 'Liczba bloków', 'Piksele', 'Email', 'Link', 'Data'].map(h => (
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
                  {players.map((player, i) => {
                    const isFirst = i === 0
                    const linkUrl = player.firstBlock.link_url
                    return (
                      <tr
                        key={player.email}
                        style={{
                          borderBottom: i < players.length - 1 ? '1px solid #1F212B' : 'none',
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
                          <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                            <img
                              src={player.firstBlock.image_url}
                              alt={player.firstBlock.alt_text ?? ''}
                              width={40}
                              height={40}
                              style={{
                                objectFit: 'cover',
                                border: `1px solid ${isFirst ? '#FFD23F' : '#2A2C36'}`,
                                borderRadius: 4,
                              }}
                            />
                            {player.firstBlock.has_frame && (
                              <>
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 4,
                                    pointerEvents: 'none',
                                    animation: 'auroraGlow 6s linear infinite',
                                    '--fw': `${calculateFrameWidth(player.firstBlock.width * player.firstBlock.height)}px`,
                                  } as React.CSSProperties}
                                />
                                <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden', pointerEvents: 'none' }}>
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'linear-gradient(100deg, transparent 15%, rgba(64,255,170,0.65) 35%, rgba(80,220,255,0.75) 50%, rgba(170,110,255,0.65) 65%, transparent 85%)',
                                      animation: 'shimmer 1.8s linear infinite',
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 12,
                            color: '#B7B2A4',
                          }}
                        >
                          {player.blockCount}
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
                          {player.totalPixels.toLocaleString('pl-PL')}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontSize: 13,
                            color: '#B7B2A4',
                          }}
                        >
                          {player.email}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {linkUrl ? (
                            <a
                              href={safeHref(linkUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#FF4D2E', textDecoration: 'none', fontSize: 13 }}
                            >
                              {linkUrl.replace(/^https?:\/\//, '').slice(0, 28)}
                              {linkUrl.length > 35 ? '…' : ''}
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
                          {new Date(player.lastPurchaseAt).toLocaleDateString('pl-PL')}
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
