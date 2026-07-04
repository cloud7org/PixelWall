import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'
import { calculatePrice } from '@/lib/pricing'

function overlaps(x: number, y: number, w: number, h: number, b: { x: number; y: number; width: number; height: number }) {
  return x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { x, y, w, h, imageUrl, linkUrl, ownerName, altText, email } = body as {
    x: number; y: number; w: number; h: number
    imageUrl: string; linkUrl: string | null; ownerName: string | null
    altText: string | null; email: string
  }

  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    typeof w !== 'number' || typeof h !== 'number' ||
    w < 10 || h < 10 ||
    !imageUrl || !email
  ) {
    return NextResponse.json({ error: 'Nieprawidłowe dane zamówienia.' }, { status: 400 })
  }

  const [{ data: blocks }, { data: pending }] = await Promise.all([
    supabaseAdmin.from('pixel_blocks').select('x,y,width,height'),
    supabaseAdmin
      .from('pending_orders')
      .select('x,y,width,height')
      .eq('status', 'awaiting_payment')
      .gt('expires_at', new Date().toISOString()),
  ])

  const isOverlapping =
    (blocks ?? []).some(b => overlaps(x, y, w, h, b)) ||
    (pending ?? []).some(b => overlaps(x, y, w, h, b))

  if (isOverlapping) {
    return NextResponse.json({ error: 'Ten obszar nakłada się na istniejący blok. Wybierz inne miejsce.' }, { status: 409 })
  }

  const { price } = calculatePrice(x, y, w, h)
  const id = crypto.randomUUID()
  const origin = request.nextUrl.origin

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'pln',
        product_data: { name: `Piksele ${w}×${h} px` },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    }],
    client_reference_id: id,
    metadata: { pending_order_id: id },
    customer_email: email,
    success_url: `${origin}/buy/success?order=${id}`,
    cancel_url: `${origin}/`,
  })

  const { error: insErr } = await supabaseAdmin.from('pending_orders').insert({
    id, x, y, width: w, height: h,
    image_url: imageUrl, link_url: linkUrl,
    owner_name: ownerName, alt_text: altText, email,
    amount_pln: price, stripe_session_id: session.id,
  })

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
