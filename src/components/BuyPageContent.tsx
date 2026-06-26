'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { PixelBlock } from '@/types'

const GRID_W = 1600
const GRID_H = 625
const PREVIEW_W = 640
const PREVIEW_H = 250

export default function BuyPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initW = Math.max(10, Math.min(GRID_W - 10, Number(searchParams.get('w') ?? 100)))
  const initH = Math.max(10, Math.min(GRID_H - 10, Number(searchParams.get('h') ?? 80)))

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blocksRef = useRef<PixelBlock[]>([])
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const [sel, setSel] = useState({ x: 50, y: 50, w: initW, h: initH })
  const [ownerName, setOwnerName] = useState('')
  const [linkUrl, setLinkUrl] = useState('https://')
  const [altText, setAltText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const price = sel.w * sel.h

  const toGridX = (px: number) => Math.round((px / PREVIEW_W) * GRID_W)
  const toGridY = (px: number) => Math.round((px / PREVIEW_H) * GRID_H)
  const toPreviewX = (g: number) => (g / GRID_W) * PREVIEW_W
  const toPreviewY = (g: number) => (g / GRID_H) * PREVIEW_H

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H)
    ctx.fillStyle = '#FAF8F2'
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H)

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= PREVIEW_W; x += PREVIEW_W / 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PREVIEW_H); ctx.stroke()
    }
    for (let y = 0; y <= PREVIEW_H; y += PREVIEW_H / 31) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PREVIEW_W, y); ctx.stroke()
    }

    // Existing blocks
    blocksRef.current.forEach(b => {
      ctx.fillStyle = 'rgba(255,77,46,0.35)'
      ctx.fillRect(toPreviewX(b.x), toPreviewY(b.y), toPreviewX(b.width), toPreviewY(b.height))
    })

    // Current selection
    const sx = toPreviewX(sel.x)
    const sy = toPreviewY(sel.y)
    const sw = toPreviewX(sel.w)
    const sh = toPreviewY(sel.h)
    ctx.fillStyle = 'rgba(46,230,166,0.25)'
    ctx.fillRect(sx, sy, sw, sh)
    ctx.strokeStyle = '#2EE6A6'
    ctx.lineWidth = 2
    ctx.strokeRect(sx, sy, sw, sh)

    // Corner handles
    ctx.fillStyle = '#2EE6A6'
    ;[[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh]].forEach(([hx, hy]) => {
      ctx.fillRect(hx - 4, hy - 4, 8, 8)
    })

    // Label
    ctx.fillStyle = '#0B0C10'
    ctx.font = 'bold 11px monospace'
    ctx.fillText(`${sel.w}×${sel.h}`, sx + 4, sy + 14)
  }, [sel, toPreviewX, toPreviewY])

  useEffect(() => { drawPreview() }, [drawPreview])

  useEffect(() => {
    supabase.from('pixel_blocks').select('*').then(({ data }) => {
      if (data) { blocksRef.current = data as PixelBlock[]; drawPreview() }
    })
  }, [drawPreview])

  const hasOverlap = useCallback((x: number, y: number, w: number, h: number) => {
    return blocksRef.current.some(
      b => x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y
    )
  }, [])

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = PREVIEW_W / rect.width
    const scaleY = PREVIEW_H / rect.height
    return {
      x: Math.max(0, Math.min(GRID_W - 10, toGridX((e.clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(GRID_H - 10, toGridY((e.clientY - rect.top) * scaleY))),
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true
    const { x, y } = getCanvasPos(e)
    dragStart.current = { x, y }
    setSel(s => ({ ...s, x, y, w: 10, h: 10 }))
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return
    const { x, y } = getCanvasPos(e)
    const newX = Math.min(dragStart.current.x, x)
    const newY = Math.min(dragStart.current.y, y)
    const newW = Math.max(10, Math.abs(x - dragStart.current.x))
    const newH = Math.max(10, Math.abs(y - dragStart.current.y))
    setSel({ x: newX, y: newY, w: Math.min(newW, GRID_W - newX), h: Math.min(newH, GRID_H - newY) })
  }

  const onMouseUp = () => { isDragging.current = false }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!imageFile) { setError('Wgraj obrazek.'); return }
    if (!linkUrl.startsWith('http')) { setError('Link musi zaczynać się od http:// lub https://'); return }
    if (hasOverlap(sel.x, sel.y, sel.w, sel.h)) { setError('Ten obszar nakłada się na istniejący blok. Wybierz inne miejsce.'); return }

    setUploading(true)
    try {
      // Resize image to exact block dimensions
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
      const fileName = `${id}.png`

      const { error: uploadErr } = await supabase.storage
        .from('pixel-images')
        .upload(fileName, resized, { contentType: 'image/png' })

      if (uploadErr) throw new Error(uploadErr.message)

      const { data: urlData } = supabase.storage.from('pixel-images').getPublicUrl(fileName)

      const { error: insertErr } = await supabase.from('pixel_blocks').insert({
        id,
        x: sel.x,
        y: sel.y,
        width: sel.w,
        height: sel.h,
        image_url: urlData.publicUrl,
        link_url: linkUrl,
        owner_name: ownerName || null,
        alt_text: altText || null,
      })

      if (insertErr) throw new Error(insertErr.message)

      setSuccess(true)
      setTimeout(() => router.push('/'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0C10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', color: '#2EE6A6', fontSize: 28, fontWeight: 700 }}>
          Piksele są Twoje!
        </h2>
        <p style={{ color: '#B7B2A4', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13 }}>
          Wracam na siatę…
        </p>
      </div>
    )
  }

  const isOverlap = hasOverlap(sel.x, sel.y, sel.w, sel.h)

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

        {/* Left: canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11, color: '#B7B2A4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Zaznacz obszar (przeciągnij)
          </span>
          <div style={{ position: 'relative', border: isOverlap ? '2px solid #FF4D2E' : '1px solid #2A2C36', borderRadius: 8, overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              width={PREVIEW_W}
              height={PREVIEW_H}
              style={{ display: 'block', width: '100%', cursor: 'crosshair' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            />
          </div>
          {isOverlap && (
            <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12, color: '#FF4D2E' }}>
              ⚠ Obszar nakłada się na istniejący blok
            </span>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Pozycja', val: `(${sel.x}, ${sel.y})` },
              { label: 'Rozmiar', val: `${sel.w}×${sel.h}` },
              { label: 'Cena', val: `$${price.toLocaleString('en-US')}` },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex: 1, background: '#14151B', border: '1px solid #1F212B', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, color: '#5A5C66', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 14, color: '#F5F0E6', fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { id: 'owner', label: 'Nazwa właściciela', val: ownerName, set: setOwnerName, placeholder: 'np. Studio Orbit', required: false },
            { id: 'link', label: 'Link URL *', val: linkUrl, set: setLinkUrl, placeholder: 'https://twoja-strona.pl', required: true },
            { id: 'alt', label: 'Opis obrazka (alt)', val: altText, set: setAltText, placeholder: 'Krótki opis', required: false },
          ].map(({ id, label, val, set, placeholder, required }) => (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12, color: '#B7B2A4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </label>
              <input
                type="text"
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                required={required}
                style={{
                  background: '#14151B',
                  border: '1px solid #2A2C36',
                  borderRadius: 8,
                  padding: '12px 14px',
                  color: '#F5F0E6',
                  fontSize: 14,
                  fontFamily: 'var(--font-inter), sans-serif',
                  outline: 'none',
                }}
              />
            </div>
          ))}

          {/* Image upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12, color: '#B7B2A4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Obrazek *
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#14151B',
                border: '1px dashed #2A2C36',
                borderRadius: 8,
                padding: '16px 14px',
                cursor: 'pointer',
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 48, height: 48, background: '#1A1C24', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-upload" style={{ color: '#5A5C66', fontSize: 20 }} />
                </div>
              )}
              <span style={{ color: '#B7B2A4', fontSize: 14 }}>
                {imageFile ? imageFile.name : 'Kliknij, aby wgrać obrazek'}
              </span>
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            </label>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,77,46,0.1)', border: '1px solid rgba(255,77,46,0.3)', borderRadius: 8, padding: '12px 16px', color: '#FF4D2E', fontSize: 13, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || isOverlap}
            style={{
              background: uploading || isOverlap ? '#2A2C36' : '#FF4D2E',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '16px 28px',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              cursor: uploading || isOverlap ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {uploading ? 'Wgrywam…' : `Kup ${sel.w}×${sel.h} px za $${price.toLocaleString('en-US')}`}
          </button>
        </div>
      </div>
    </form>
  )
}
