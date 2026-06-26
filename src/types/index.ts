export interface PixelBlock {
  id: string
  x: number
  y: number
  width: number
  height: number
  image_url: string
  link_url: string
  owner_name: string | null
  alt_text: string | null
  created_at: string
}
