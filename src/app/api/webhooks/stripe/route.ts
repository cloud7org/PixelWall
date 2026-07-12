import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '@/lib/email'

export const runtime = 'nodejs'

function overlaps(x: number, y: number, w: number, h: number, b: { x: number; y: number; width: number; height: number }) {
  return x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err instanceof Error ? err.message : 'invalid signature'}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const pendingOrderId = session.client_reference_id

    if (pendingOrderId) {
      const { data: existing } = await supabaseAdmin
        .from('pixel_blocks')
        .select('id')
        .eq('id', pendingOrderId)
        .maybeSingle()

      if (!existing) {
        const { data: order } = await supabaseAdmin
          .from('pending_orders')
          .select('*')
          .eq('id', pendingOrderId)
          .maybeSingle()

        if (order) {
          const { data: blocks } = await supabaseAdmin.from('pixel_blocks').select('x,y,width,height')
          const isOverlapping = (blocks ?? []).some(b => overlaps(order.x, order.y, order.width, order.height, b))

          if (!isOverlapping) {
            const { error: blockInsErr } = await supabaseAdmin.from('pixel_blocks').insert({
              id: order.id,
              x: order.x, y: order.y, width: order.width, height: order.height,
              image_url: order.image_url, link_url: order.link_url,
              owner_name: order.owner_name, alt_text: order.alt_text, email: order.email,
              has_frame: order.has_frame,
              privacy_consent: true, privacy_consent_at: new Date().toISOString(),
            })
            if (blockInsErr) {
              console.error('[webhook] pixel_blocks insert failed:', blockInsErr.message, { orderId: order.id, hasFrame: order.has_frame })
            } else {
              console.log('[webhook] pixel_blocks inserted:', { orderId: order.id, hasFrame: order.has_frame })
            }

            await sendPaymentSuccessEmail({
              orderId: order.id,
              email: order.email,
              ownerName: order.owner_name,
              createdAt: order.created_at,
              amountPln: order.amount_pln,
            })
          }

          await supabaseAdmin.from('pending_orders').delete().eq('id', pendingOrderId)
        }
      }
    }
  } else if (event.type === 'checkout.session.expired') {
    // Checkout session timed out without a completed payment — the counterpart to
    // checkout.session.completed above. Requires "checkout.session.expired" to be
    // enabled on the Stripe webhook endpoint (dashboard config, not code).
    const session = event.data.object as Stripe.Checkout.Session
    const pendingOrderId = session.client_reference_id

    if (pendingOrderId) {
      const { data: order } = await supabaseAdmin
        .from('pending_orders')
        .select('*')
        .eq('id', pendingOrderId)
        .maybeSingle()

      if (order) {
        await sendPaymentFailedEmail({
          orderId: order.id,
          email: order.email,
          ownerName: order.owner_name,
          createdAt: order.created_at,
          amountPln: order.amount_pln,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
