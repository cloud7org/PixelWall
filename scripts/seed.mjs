/**
 * Seed — dodaje przykładowe bloki. Uruchom: node scripts/seed.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const url = env['NEXT_PUBLIC_SUPABASE_URL']
const key = env['SUPABASE_SERVICE_ROLE_KEY']

if (!url || !key || key.includes('placeholder')) {
  console.error('Uzupelnij NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

function svg(w, h, color, label) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${color}"/>
  <text x="${w/2}" y="${h/2+5}" font-size="${Math.max(8,Math.min(16,h/4))}"
    font-family="sans-serif" font-weight="bold" fill="rgba(255,255,255,0.75)" text-anchor="middle">${label}</text>
</svg>`, 'utf-8')
}

const BLOCKS = [
  { x: 20,  y: 20,  w: 80,  h: 60,  color: '#FF4D2E', owner: 'studio-orbit.com',   link: 'https://studio-orbit.com' },
  { x: 120, y: 30,  w: 60,  h: 60,  color: '#2EE6A6', owner: 'nocna-zmiana.pl',    link: 'https://nocna-zmiana.pl' },
  { x: 200, y: 10,  w: 100, h: 80,  color: '#FFD23F', owner: 'quanta.dev',          link: 'https://quanta.dev' },
  { x: 320, y: 20,  w: 70,  h: 50,  color: '#1A1C24', owner: 'redkiosk.io',         link: 'https://redkiosk.io' },
  { x: 30,  y: 120, w: 80,  h: 70,  color: '#FF4D2E', owner: 'formanagency.com',    link: 'https://formanagency.com' },
  { x: 140, y: 110, w: 110, h: 90,  color: '#2EE6A6', owner: 'pixel.studio',        link: 'https://pixel.studio' },
  { x: 280, y: 130, w: 60,  h: 60,  color: '#FFD23F', owner: 'design.io',           link: 'https://design.io' },
  { x: 360, y: 90,  w: 90,  h: 80,  color: '#FF4D2E', owner: 'alpha.co',            link: 'https://alpha.co' },
  { x: 50,  y: 220, w: 120, h: 80,  color: '#1A1C24', owner: 'beta.dev',            link: 'https://beta.dev' },
  { x: 200, y: 230, w: 80,  h: 60,  color: '#2EE6A6', owner: 'gamma.pl',            link: 'https://gamma.pl' },
]

async function seed() {
  console.log('Seed start…')
  for (const b of BLOCKS) {
    const id = crypto.randomUUID()
    const file = `${id}.svg`
    const buf = svg(b.w, b.h, b.color, `${b.w}×${b.h}`)

    const { error: upErr } = await supabase.storage
      .from('pixel-images')
      .upload(file, buf, { contentType: 'image/svg+xml' })
    if (upErr) { console.error(`Upload FAIL ${b.owner}:`, upErr.message); continue }

    const { data: urlData } = supabase.storage.from('pixel-images').getPublicUrl(file)

    const { error: inErr } = await supabase.from('pixel_blocks').insert({
      id, x: b.x, y: b.y, width: b.w, height: b.h,
      image_url: urlData.publicUrl, link_url: b.link,
      owner_name: b.owner, alt_text: `Blok ${b.owner}`,
    })
    if (inErr) console.error(`Insert FAIL ${b.owner}:`, inErr.message)
    else console.log(`OK ${b.owner} (${b.w}×${b.h} @ ${b.x},${b.y})`)
  }
  console.log('Seed done!')
}

seed().catch(console.error)
