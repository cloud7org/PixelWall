'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'

interface Props {
  sel: { x: number; y: number; w: number; h: number }
  file: File
  imageUrl: string
  onClose: () => void
  onSuccess: () => void
}

const PEEK_HEIGHT = 40

export default function BuyBottomSheet({ sel, file, imageUrl, onClose, onSuccess }: Props) {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const blocksRef = useRef<PixelBlock[]>([])
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startTranslate: number; moved: boolean } | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const onHandlePointerDown = (e: React.PointerEvent) => {
    const sheet = sheetRef.current
    if (!sheet) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const maxTranslate = Math.max(0, sheet.offsetHeight - PEEK_HEIGHT)
    dragRef.current = { startY: e.clientY, startTranslate: collapsed ? maxTranslate : 0, moved: false }
    sheet.style.transition = 'none'
  }

  const onHandlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    const sheet = sheetRef.current
    if (!drag || !sheet) return
    const dy = e.clientY - drag.startY
    if (Math.abs(dy) > 4) drag.moved = true
    const maxTranslate = Math.max(0, sheet.offsetHeight - PEEK_HEIGHT)
    const next = Math.min(Math.max(drag.startTranslate + dy, 0), maxTranslate)
    sheet.style.transform = `translateY(${next}px)`
  }

  const onHandlePointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current
    const sheet = sheetRef.current
    dragRef.current = null
    if (!sheet) return
    sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
    if (!drag) return
    if (!drag.moved) {
      setCollapsed(v => !v)
      return
    }
    const dy = e.clientY - drag.startY
    const maxTranslate = Math.max(0, sheet.offsetHeight - PEEK_HEIGHT)
    const currentTranslate = Math.min(Math.max(drag.startTranslate + dy, 0), maxTranslate)
    setCollapsed(currentTranslate > maxTranslate * 0.35)
  }

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
    if (!email.trim()) { setError('Podaj adres e-mail.'); return }
    if (!privacyConsent) { setError('Zaakceptuj politykę prywatności, aby kontynuować.'); return }
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
        img.src = imageUrl
      })
      const id = crypto.randomUUID()
      const { error: upErr } = await supabase.storage.from('pixel-images').upload(`${id}.png`, resized, { contentType: 'image/png' })
      if (upErr) throw new Error(upErr.message)
      const { data: urlData } = supabase.storage.from('pixel-images').getPublicUrl(`${id}.png`)
      const { error: insErr } = await supabase.from('pixel_blocks').insert({
        id, x: sel.x, y: sel.y, width: sel.w, height: sel.h,
        image_url: urlData.publicUrl, link_url: linkUrl || null,
        owner_name: ownerName || null, alt_text: altText || null, email,
        privacy_consent: true, privacy_consent_at: new Date().toISOString(),
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
    padding: '8px 12px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#B7B2A4',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 4,
  }

  return (
    <div
      ref={sheetRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        maxHeight: '72vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B0C10',
        borderTop: '2px solid #2A2C36',
        borderRadius: '16px 16px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: !visible
          ? 'translateY(100%)'
          : collapsed
          ? `translateY(calc(100% - ${PEEK_HEIGHT}px))`
          : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Drag handle — swipe down to peek at the grid below, swipe/tap up to restore */}
      <div
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', touchAction: 'none', cursor: 'grab' }}
      >
        <div style={{ width: 36, height: 4, background: '#2A2C36', borderRadius: 2 }} />
      </div>

      {success ? (
        <div style={{ padding: '8px 20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎉</div>
          <h3 style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            color: '#2EE6A6',
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 4,
          }}>
            Piksele są Twoje!
          </h3>
          <p style={{
            color: '#B7B2A4',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 11,
          }}>
            Wracam na siatkę…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable area: header + fields */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 16px 0' }}>
          {/* Header row: area info + price + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                color: '#B7B2A4',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {sel.w}×{sel.h}px · X{sel.x} Y{sel.y}
              </span>
            </div>
            <span style={{
              color: '#2EE6A6',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}>
              {price.toLocaleString('pl-PL')} zł
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5A5C66',
                fontSize: 22,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                fontFamily: 'sans-serif',
                flexShrink: 0,
              }}
              aria-label="Zamknij"
            >
              ×
            </button>
          </div>

          {/* Form fields — compact 3-column on wide, 1-column on narrow */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <label style={labelStyle}>Właściciel *</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Nazwa"
                style={inputStyle}
                maxLength={50}
                required
              />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <label style={labelStyle}>E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@gmail.com"
                style={inputStyle}
                required
              />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <label style={labelStyle}>Link</label>
              <input
                type="text"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <label style={labelStyle}>Opis / alt</label>
              <input
                type="text"
                value={altText}
                onChange={e => setAltText(e.target.value)}
                placeholder="Opis obrazu"
                style={inputStyle}
                maxLength={300}
              />
            </div>
          </div>
          </div>{/* end scrollable */}

          {/* Sticky footer: checkbox + error + button */}
          <div style={{ flexShrink: 0, padding: '8px 16px 12px', borderTop: '1px solid #2A2C36' }}>
          {/* Checkbox zgody */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={e => setPrivacyConsent(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: '#2EE6A6', width: 14, height: 14 }}
            />
            <span style={{ color: '#B7B2A4', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono), monospace', lineHeight: 1.5 }}>
              Akceptuję{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: '#2EE6A6', textDecoration: 'underline' }}>
                politykę prywatności
              </a>
              , w tym zgodę na wyświetlenie mojej grafiki na Times Square po wysprzedaniu centralnego obszaru siatki (dotyczy tylko pikseli z obszaru 1000×1000 px).
            </span>
          </label>

          {error && (
            <div style={{
              color: '#FF4D2E',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11,
              marginBottom: 8,
              padding: '6px 10px',
              background: 'rgba(255,77,46,0.1)',
              borderRadius: 4,
              border: '1px solid rgba(255,77,46,0.3)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !privacyConsent}
            style={{
              width: '100%',
              background: uploading || !privacyConsent ? '#1A1C24' : '#2EE6A6',
              color: uploading || !privacyConsent ? '#5A5C66' : '#1A0A05',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 15,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 6,
              cursor: uploading || !privacyConsent ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {uploading ? 'Wysyłam…' : 'Dodaj'}
          </button>
          </div>{/* end sticky footer */}
        </form>
      )}
    </div>
  )
}
