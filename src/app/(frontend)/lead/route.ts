import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/data'

// POST /lead: copia do formulario no admin (Contatos do formulario). O
// visitante ja foi para o WhatsApp; isto so evita perder quem desistiu.
const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Honeypot preenchido = robo. Responde ok para nao ensinar o robo.
  if (clean(body.website)) return NextResponse.json({ ok: true })

  const name = clean(body.name, 80)
  const whatsapp = clean(body.whatsapp, 20)
  if (!name || whatsapp.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const payload = await getClient()
    await payload.create({
      collection: 'leads',
      overrideAccess: true,
      data: {
        name,
        whatsapp,
        segment: clean(body.segment, 80),
        utmSource: clean(body.utm_source),
        utmMedium: clean(body.utm_medium),
        utmCampaign: clean(body.utm_campaign),
        utmContent: clean(body.utm_content),
        utmTerm: clean(body.utm_term),
        gclid: clean(body.gclid),
        fbclid: clean(body.fbclid),
        landingUrl: clean(body.landing_url, 500),
        priceVariant: clean(body.priceVariant, 20),
      },
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
