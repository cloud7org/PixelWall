'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'
import { calculatePrice, formatPln } from '@/lib/pricing'
import { resizeImageForStorage } from '@/lib/image'

interface Props {
  sel: { x: number; y: number; w: number; h: number }
  file: File
  imageUrl: string
  onClose: () => void
  onSuccess: () => void
  onSelChange?: (sel: { x: number; y: number; w: number; h: number }) => void
}

const PEEK_HEIGHT = 40

export default function BuyBottomSheet({ sel, file, imageUrl, onClose, onSuccess, onSelChange }: Props) {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [widthInput, setWidthInput] = useState(String(sel.w))
  const [heightInput, setHeightInput] = useState(String(sel.h))
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [termsConsent, setTermsConsent]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocksRef = useRef<PixelBlock[]>([])
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startHeight: number; expandedHeight: number; moved: boolean } | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Keep the width/height inputs in sync when the selection changes from elsewhere
  // (e.g. dragging the corner handles of the draft rectangle on the canvas).
  useEffect(() => { setWidthInput(String(sel.w)) }, [sel.w])
  useEffect(() => { setHeightInput(String(sel.h)) }, [sel.h])

  const commitWidth = () => {
    const n = Number(widthInput)
    if (Number.isFinite(n) && n > 0) {
      onSelChange?.({ ...sel, w: Math.max(10, Math.round(n / 10) * 10) })
    } else {
      setWidthInput(String(sel.w))
    }
  }

  const commitHeight = () => {
    const n = Number(heightInput)
    if (Number.isFinite(n) && n > 0) {
      onSelChange?.({ ...sel, h: Math.max(10, Math.round(n / 10) * 10) })
    } else {
      setHeightInput(String(sel.h))
    }
  }

  // Settle the sheet's real `height` (not just its on-screen position) at the end of a
  // drag/tap, so the scrollable fields area (overflowY: auto) can pick up any overflow
  // instead of content just being clipped when the sheet is dragged shorter. Expanding
  // targets an explicit pixel value (not '' / auto) because CSS can't transition to
  // "auto" — onTransitionEnd below releases it back to auto once the animation lands.
  const settleHeight = (sheet: HTMLDivElement, nowCollapsed: boolean, expandedHeight: number) => {
    sheet.style.height = nowCollapsed ? `${PEEK_HEIGHT}px` : `${expandedHeight}px`
  }

  const onHandlePointerDown = (e: React.PointerEvent) => {
    const sheet = sheetRef.current
    if (!sheet) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const expandedHeight = Math.min(sheet.scrollHeight, window.innerHeight * 0.72)
    const startHeight = collapsed ? PEEK_HEIGHT : sheet.getBoundingClientRect().height
    dragRef.current = { startY: e.clientY, startHeight, expandedHeight, moved: false }
    sheet.style.transition = 'none'
    sheet.style.height = `${startHeight}px`
  }

  const onHandlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    const sheet = sheetRef.current
    if (!drag || !sheet) return
    const dy = e.clientY - drag.startY
    if (Math.abs(dy) > 4) drag.moved = true
    const next = Math.min(Math.max(drag.startHeight - dy, PEEK_HEIGHT), drag.expandedHeight)
    sheet.style.height = `${next}px`
  }

  const onHandlePointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current
    const sheet = sheetRef.current
    dragRef.current = null
    if (!sheet) return
    sheet.style.transition = 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
    if (!drag) return
    if (!drag.moved) {
      const nowCollapsed = !collapsed
      setCollapsed(nowCollapsed)
      settleHeight(sheet, nowCollapsed, drag.expandedHeight)
      return
    }
    const dy = e.clientY - drag.startY
    const next = Math.min(Math.max(drag.startHeight - dy, PEEK_HEIGHT), drag.expandedHeight)
    const range = drag.expandedHeight - PEEK_HEIGHT
    const nowCollapsed = range > 0 && (drag.expandedHeight - next) > range * 0.35
    setCollapsed(nowCollapsed)
    settleHeight(sheet, nowCollapsed, drag.expandedHeight)
  }

  const onSheetTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'height') return
    const sheet = sheetRef.current
    // Release the explicit px height back to auto (still capped by maxHeight) once the
    // expand animation lands, so later content growth (e.g. an error message) can still
    // grow the sheet instead of being stuck at a stale measured height.
    if (sheet && !collapsed) sheet.style.height = ''
  }

  useEffect(() => {
    supabase.from('pixel_blocks').select('*').then(({ data }) => {
      if (data) blocksRef.current = data as PixelBlock[]
    })
  }, [])

  const { premiumPixels, standardPixels, premiumSubtotal, standardSubtotal, price } =
    calculatePrice(sel.x, sel.y, sel.w, sel.h)

  // Consent/submit section only slides out once the required fields are filled, so
  // the sheet stays compact (~30% of viewport) and leaves more of the grid visible
  // until the user is actually ready to confirm the purchase.
  const requiredFilled = ownerName.trim() !== '' && email.trim() !== ''

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
    if (!termsConsent)   { setError('Zaakceptuj regulamin serwisu, aby kontynuować.'); return }
    if (hasOverlap()) { setError('Ten obszar nakłada się na istniejący blok. Wybierz inne miejsce.'); return }

    setUploading(true)
    try {
      const resized = await resizeImageForStorage(imageUrl, sel.w, sel.h)
      const id = crypto.randomUUID()
      const { error: upErr } = await supabase.storage.from('pixel-images').upload(`${id}.png`, resized, { contentType: 'image/png' })
      if (upErr) throw new Error(upErr.message)
      const { data: urlData } = supabase.storage.from('pixel-images').getPublicUrl(`${id}.png`)
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: sel.x, y: sel.y, w: sel.w, h: sel.h,
          imageUrl: urlData.publicUrl, linkUrl: linkUrl || null,
          ownerName: ownerName || null, altText: altText || null, email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Nie udało się utworzyć płatności.')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
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
        height: collapsed ? PEEK_HEIGHT : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0B0C10',
        borderTop: '2px solid #2A2C36',
        borderRadius: '16px 16px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: !visible ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      }}
      onTransitionEnd={onSheetTransitionEnd}
    >
      {/* Drag handle — swipe down to shrink the sheet (fields area scrolls once it no
          longer fits), swipe/tap up to restore. Fixed size so it never gets squeezed. */}
      <div
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', touchAction: 'none', cursor: 'grab', flexShrink: 0 }}
      >
        <div style={{ width: 36, height: 4, background: '#2EE6A6', borderRadius: 2, boxShadow: '0 0 8px rgba(46,230,166,0.7)' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable area: header + fields */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 16px 0' }}>
          {/* Header row: area info + price + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: premiumPixels > 0 && standardPixels > 0 ? 2 : 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                color: '#B7B2A4',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {sel.w}×{sel.h}px · <span style={{ color: '#2EE6A6' }}>{(sel.w * sel.h).toLocaleString('pl-PL')} px</span> · X{sel.x} Y{sel.y}
              </span>
            </div>
            <span style={{
              color: '#2EE6A6',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}>
              {formatPln(price)}
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

          {premiumPixels > 0 && standardPixels > 0 && (
            <div style={{
              color: '#5A5C66',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10,
              marginBottom: 8,
            }}>
              Premium: {formatPln(premiumSubtotal)} · Standard: {formatPln(standardSubtotal)}
            </div>
          )}

          {/* Form fields — compact 3-column on wide, 1-column on narrow */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 90px', minWidth: 0 }}>
              <label style={labelStyle}>Szerokość</label>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                step={10}
                value={widthInput}
                onChange={e => setWidthInput(e.target.value)}
                onBlur={commitWidth}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitWidth() } }}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 90px', minWidth: 0 }}>
              <label style={labelStyle}>Wysokość</label>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                step={10}
                value={heightInput}
                onChange={e => setHeightInput(e.target.value)}
                onBlur={commitHeight}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitHeight() } }}
                style={inputStyle}
              />
            </div>
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

          {/* Sticky footer: checkbox + error + button — slides out once required fields are filled */}
          <div
            style={{
              flexShrink: 0,
              maxHeight: requiredFilled ? 400 : 0,
              opacity: requiredFilled ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease',
            }}
          >
          <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #2A2C36' }}>
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

          {/* Checkbox regulaminu */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={termsConsent}
              onChange={e => setTermsConsent(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: '#2EE6A6', width: 14, height: 14 }}
            />
            <span style={{ color: '#B7B2A4', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono), monospace', lineHeight: 1.5 }}>
              Akceptuję{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: '#2EE6A6', textDecoration: 'underline' }}>
                regulamin serwisu
              </a>
              {' '}i przyjmuję do wiadomości, że po potwierdzeniu płatności tracę prawo do odstąpienia od umowy zgodnie z art. 38 pkt 13 ustawy o prawach konsumenta.
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
            disabled={uploading || !privacyConsent || !termsConsent}
            style={{
              width: '100%',
              background: uploading || !privacyConsent || !termsConsent ? '#1A1C24' : '#2EE6A6',
              color: uploading || !privacyConsent || !termsConsent ? '#5A5C66' : '#1A0A05',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 15,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 6,
              cursor: uploading || !privacyConsent || !termsConsent ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {uploading ? 'Wysyłam…' : 'Dodaj'}
          </button>
          </div>
          </div>{/* end sticky footer */}
        </form>
    </div>
  )
}

