'use client'
import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const [w, setW] = useState<number | null>(null)
  useEffect(() => {
    setW(window.innerWidth)
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  // null = przed pierwszym render po stronie klienta → traktuj jako desktop (pasuje do SSR)
  return { isMobile: w !== null && w < 640, isTablet: w !== null && w < 1024 }
}
