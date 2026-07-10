import 'server-only'
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = process.env.EMAIL_FROM ?? 'Pixarium <onboarding@resend.dev>'
const REPLY_TO = process.env.EMAIL_REPLY_TO
const SITE_URL = process.env.SITE_URL ?? 'https://pixarium.pl'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Warsaw',
  })
}

function formatAmount(amountPln: number) {
  return `${amountPln.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`
}

interface OrderEmailData {
  orderId: string
  email: string
  ownerName: string | null
  createdAt: string
  amountPln: number
}

export async function sendPaymentSuccessEmail(order: OrderEmailData) {
  const owner = order.ownerName?.trim() || 'Kliencie'
  const { error } = await resend.emails.send({
    from: FROM,
    to: order.email,
    replyTo: REPLY_TO,
    subject: 'Płatność potwierdzona — Twoje piksele są aktywne',
    html: `
      <div style="font-family: monospace; background:#0B0C10; color:#F5F0E6; padding:32px;">
        <h1 style="color:#2EE6A6; font-size:20px;">Płatność potwierdzona ✓</h1>
        <p>Cześć ${owner},</p>
        <p>Twoja płatność została pomyślnie zrealizowana i Twoje piksele są już aktywne na siatce.</p>
        <ul>
          <li><strong>Numer zamówienia:</strong> ${order.orderId}</li>
          <li><strong>Data:</strong> ${formatDate(order.createdAt)}</li>
          <li><strong>Kwota:</strong> ${formatAmount(order.amountPln)}</li>
        </ul>
        <p>Dziękujemy za zakup na Pixarium!</p>
        <p><a href="${SITE_URL}" style="color:#2EE6A6;">${SITE_URL}</a></p>
        <p>W razie pytań napisz do nas: ${REPLY_TO}</p>
      </div>
    `,
    text: `Płatność potwierdzona\n\nNumer zamówienia: ${order.orderId}\nData: ${formatDate(order.createdAt)}\nKwota: ${formatAmount(order.amountPln)}\n\nDziękujemy za zakup na Pixarium!\n\n${SITE_URL}\n\nW razie pytań napisz do nas: ${REPLY_TO}`,
  })
  if (error) console.error('Failed to send payment success email:', error)
}

export async function sendPaymentFailedEmail(order: OrderEmailData) {
  const owner = order.ownerName?.trim() || 'Kliencie'
  const { error } = await resend.emails.send({
    from: FROM,
    to: order.email,
    replyTo: REPLY_TO,
    subject: 'Płatność nie powiodła się',
    html: `
      <div style="font-family: monospace; background:#0B0C10; color:#F5F0E6; padding:32px;">
        <h1 style="color:#FF4D2E; font-size:20px;">Płatność nie powiodła się</h1>
        <p>Cześć ${owner},</p>
        <p>Niestety Twoja płatność za poniższe zamówienie nie została zrealizowana i sesja płatności wygasła.</p>
        <ul>
          <li><strong>Numer zamówienia:</strong> ${order.orderId}</li>
          <li><strong>Data próby:</strong> ${formatDate(order.createdAt)}</li>
          <li><strong>Kwota:</strong> ${formatAmount(order.amountPln)}</li>
        </ul>
        <p>Możesz spróbować ponownie, wracając na stronę i wybierając ten sam obszar (o ile nadal jest wolny).</p>
        <p><a href="${SITE_URL}" style="color:#FF4D2E;">${SITE_URL}</a></p>
        <p>W razie pytań napisz do nas: ${REPLY_TO}</p>
      </div>
    `,
    text: `Płatność nie powiodła się\n\nNumer zamówienia: ${order.orderId}\nData próby: ${formatDate(order.createdAt)}\nKwota: ${formatAmount(order.amountPln)}\n\nMożesz spróbować ponownie na stronie: ${SITE_URL}\n\nW razie pytań napisz do nas: ${REPLY_TO}`,
  })
  if (error) console.error('Failed to send payment failed email:', error)
}
