const STORAGE_MAX_DIM = 512
const MAX_SUPERSAMPLE = 8

export function resizeImageForStorage(imgSrc: string, w: number, h: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(1, Math.min(MAX_SUPERSAMPLE, Math.floor(STORAGE_MAX_DIM / Math.max(w, h))))
      const targetW = w * scale
      const targetH = h * scale
      const c = document.createElement('canvas')
      c.width = targetW; c.height = targetH
      const ctx = c.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetW, targetH)
      c.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
    }
    img.onerror = reject
    img.src = imgSrc
  })
}
