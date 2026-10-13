import sharp from 'sharp'
import { getManual } from '@/lib/manuais/publico'
import { arquivoSvg } from '@/lib/manuais/marcas'

// Imagem de compartilhamento do manual (WhatsApp, redes) em JPG 1200x630: a
// capa recortada; sem capa, a primeira versao da marca sobre o fundo dela.
// Rascunho nao tem imagem (o manual nem abre para quem nao esta logado).
const W = 1200
const H = 630

const jpg = (img: sharp.Sharp) => img.flatten({ background: '#ffffff' }).jpeg({ quality: 85, mozjpeg: true }).toBuffer()

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const manual = await getManual((await params).slug)
  if (!manual) return new Response('Manual não encontrado', { status: 404 })

  let saida: Buffer | null = null
  if (manual.capa) {
    const res = await fetch(new URL(manual.capa.url, req.url))
    if (res.ok) saida = await jpg(sharp(Buffer.from(await res.arrayBuffer())).resize(W, H, { fit: 'cover' }))
  }
  if (!saida) {
    const versoes = manual.paginas.find((p) => p.tipo === 'versoes')
    const item = versoes?.tipo === 'versoes' ? versoes.itens[0] : undefined
    if (!item) return Response.redirect(new URL('/og-joycombo.png', req.url), 302)
    // marca centralizada, com folga, sobre a cor da pagina de versoes
    const { w, h } = item.svg.viewBox
    const escala = Math.min((W * 0.6) / w, (H * 0.5) / h)
    const marca = await sharp(Buffer.from(arquivoSvg(item.svg)), { density: Math.max(72, Math.min(72 * escala, 2400)) })
      .resize(Math.round(w * escala), Math.round(h * escala), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    saida = await jpg(sharp({ create: { width: W, height: H, channels: 3, background: versoes?.tipo === 'versoes' ? versoes.fundo : '#ffffff' } }).composite([{ input: marca, gravity: 'center' }]))
  }

  return new Response(new Uint8Array(saida), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
  })
}
