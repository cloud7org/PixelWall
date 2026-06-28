'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PriceCalculator() {
  const [w, setW] = useState(100)
  const [h, setH] = useState(80)
  const price = w * h

  return (
    <section style={{ padding: '80px 48px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 12,
            letterSpacing: '0.1em',
            color: '#2EE6A6',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 14,
          }}
        >
          Kalkulator
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(24px, 2.5vw, 34px)',
            letterSpacing: '-0.02em',
            color: '#F5F0E6',
          }}
        >
          Ile kosztują Twoje pixele?
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'start',
        }}
      >
        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            { label: 'Szerokość', value: w, set: setW },
            { label: 'Wysokość', value: h, set: setH },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13, color: '#B7B2A4' }}>
                  {label}
                </span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13, color: '#F5F0E6', fontWeight: 600 }}>
                  {value} px
                </span>
              </div>
              <div style={{ position: 'relative', height: 6, background: '#1A1C24', borderRadius: 3 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(value - 10) / 490 * 100}%`, background: '#2EE6A6', borderRadius: 3 }} />
                <input
                  type="range"
                  min={10}
                  max={500}
                  value={value}
                  onChange={e => set(Number(e.target.value))}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '300%', top: '-100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              background: '#1A1C24',
              border: '1px solid #2A2C36',
              borderRadius: 10,
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, color: '#B7B2A4', marginBottom: 4 }}>
                {w} × {h} pixeli
              </div>
              <div style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 13, color: '#B7B2A4' }}>
                Całkowita cena
              </div>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontWeight: 700,
                fontSize: 28,
                color: '#FFD23F',
              }}
            >
              ${price.toLocaleString('en-US')}
            </span>
          </div>

          <Link
            href={`/buy?w=${w}&h=${h}`}
            style={{
              display: 'block',
              textAlign: 'center',
              background: '#FF4D2E',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              padding: '14px 28px',
              borderRadius: 8,
              textDecoration: 'none',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
            }}
          >
            Zarezerwuj ten blok →
          </Link>
        </div>

        {/* Preview canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, color: '#B7B2A4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Podgląd na siatce
          </span>
          <div
            style={{
              background: '#FAF8F2',
              border: '1px solid #E3DFD3',
              borderRadius: 8,
              padding: 16,
              aspectRatio: '1',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Grid lines */}
            <div
              style={{
                position: 'absolute',
                inset: 16,
                backgroundImage: 'repeating-linear-gradient(#E3DFD3 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #E3DFD3 0 1px, transparent 1px 100%)',
                backgroundSize: '10% 10%',
              }}
            />
            {/* Selection */}
            <div
              style={{
                position: 'absolute',
                left: `${16 + 0.05 * (300 - 32)}px`,
                top: `${16 + 0.05 * (300 - 32)}px`,
                width: `${(w / 1000) * (300 - 32)}px`,
                height: `${(h / 1000) * (300 - 32)}px`,
                background: 'rgba(255,77,46,0.25)',
                border: '2px solid #FF4D2E',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
