import sharp from 'sharp'
import { getSeo } from '@/lib/data'

// Imagem de compartilhamento (menu SEO) em JPG 1200x630. O painel converte os
// uploads para WebP, que o preview do WhatsApp/Facebook nem sempre aceita.
export const revalidate = 60

export async function GET() {
  const seo = await getSeo()
  const url = seo.ogImage?.url
  if (!url) return Response.redirect(new URL('/og-joycombo.png', process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'), 302)

  const res = await fetch(url)
  if (!res.ok) return new Response('Imagem não encontrada', { status: 404 })
  const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(1200, 630, { fit: 'cover' })
    .flatten({ background: '#000000' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()

  return new Response(new Uint8Array(jpg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
  })
}
