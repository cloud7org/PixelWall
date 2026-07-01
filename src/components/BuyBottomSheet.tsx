'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'

interface Props {
  sel: { x: number; y: number; w: number; h: number }
  file: File
  onClose: () => void
  onSuccess: () => void
}

export default function BuyBottomSheet({ sel, file, onClose, onSuccess }: Props) {
  const [visible, setVisible] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const blocksRef = useRef<PixelBlock[]>([])

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    supabase.from('pixel_blocks').select('*').then(({ data }) => {
      if (data) blocksRef.current = data as PixelBlock[]
    })
  }, [])

  const price = sel.w * sel.h

  const hasOverlap = () =>
    blocksRef.current.some(
      b => sel.x < b.x + b.width && sel.x + sel.w > b.x &&
           sel.y < b.y + b.height && sel.y + sel.h > b.y
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!ownerName.trim()) { setError('Podaj nazwę właściciela.'); return }
    if (hasOverlap()) { setError('Ten obszar nakłada się na istniejący blok. Wybierz inne miejsce.'); return }

    setUploading(true)
    try {
      const resized = await new Promise<Blob>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = sel.w; c.height = sel.h
          c.getContext('2d')!.drawImage(img, 0, 0, sel.w, sel.h)
          c.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
        }
        img.onerror = reject
        img.src = imagePreview!
      })
      const id = crypto.randomUUID()
      const { error: upErr } = await supabase.storage.from('pixel-images').upload(`${id}.png`, resized, { contentType: 'image/png' })
      if (upErr) throw new Error(upErr.message)
      const { data: urlData } = supabase.storage.from('pixel-images').getPublicUrl(`${id}.png`)
      const { error: insErr } = await supabase.from('pixel_blocks').insert({
        id, x: sel.x, y: sel.y, width: sel.w, height: sel.h,
        image_url: urlData.publicUrl, link_url: linkUrl || null,
        owner_name: ownerName || null, alt_text: altText || null,
      })
      if (insErr) throw new Error(insErr.message)
      setSuccess(true)
      setTimeout(() => onSuccess(), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
    } finally {
      setUploading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#111318',
    border: '1px solid #2A2C36',
    borderRadius: 4,
    color: '#F5F0E6',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 13,
    padding: '10px 12px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#B7B2A4',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 299,
          background: 'rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 300,
          background: '#0B0C10',
          borderTop: '2px solid #2A2C36',
          borderRadius: '16px 16px 0 0',
          maxHeight: '88vh',
          overflowY: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#2A2C36', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 16px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 20,
            color: '#F5F0E6',
            margin: 0,
          }}>
            Dodaj obraz
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5A5C66',
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              fontFamily: 'sans-serif',
            }}
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>

        {success ? (
          <div style={{ padding: '32px 20px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h3 style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              color: '#2EE6A6',
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 8,
            }}>
              Piksele są Twoje!
            </h3>
            <p style={{
              color: '#B7B2A4',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
            }}>
              Wracam na siatkę…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '0 20px 32px' }}>
            {/* Image preview + area info */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Podgląd"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: 'cover',
                    borderRadius: 6,
                    border: '1px solid #2A2C36',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#B7B2A4',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>
                  Zaznaczony obszar
                </div>
                <div style={{
                  color: '#F5F0E6',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 13,
                  marginBottom: 2,
                }}>
                  {sel.w} × {sel.h} px
                </div>
                <div style={{
                  color: '#5A5C66',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 11,
                }}>
                  X={sel.x} Y={sel.y}
                </div>
              </div>
            </div>

            {/* Price */}
            <div style={{
              background: '#111318',
              border: '1px solid #2A2C36',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                color: '#B7B2A4',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Do zapłaty
              </span>
              <span style={{
                color: '#2EE6A6',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 20,
              }}>
                {price.toLocaleString('pl-PL')} zł
              </span>
            </div>

            {/* Owner name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Nazwa właściciela <span style={{ color: '#FF4D2E' }}>*</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Twoja firma / imię"
                style={inputStyle}
                required
              />
            </div>

            {/* Link URL */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Link (opcjonalnie)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://twoja-strona.pl"
                style={inputStyle}
              />
            </div>

            {/* Alt text */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Opis / alt (opcjonalnie)</label>
              <input
                type="text"
                value={altText}
                onChange={e => setAltText(e.target.value)}
                placeholder="Krótki opis obrazu"
                style={inputStyle}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                color: '#FF4D2E',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 12,
                marginBottom: 14,
                padding: '8px 12px',
                background: 'rgba(255,77,46,0.1)',
                borderRadius: 4,
                border: '1px solid rgba(255,77,46,0.3)',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading}
              style={{
                width: '100%',
                background: uploading ? '#1A1C24' : '#2EE6A6',
                color: uploading ? '#5A5C66' : '#1A0A05',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 16,
                padding: '14px 20px',
                border: 'none',
                borderRadius: 6,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              {uploading ? 'Wysyłam…' : `Kup piksele — ${price.toLocaleString('pl-PL')} zł`}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
