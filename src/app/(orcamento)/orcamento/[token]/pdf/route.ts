import { createElement, type ReactElement } from 'react'
import sharp from 'sharp'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { OrcamentoPdf, type Imagens, type Layout } from '@/components/orcamentos/pdf/OrcamentoPdf'
import { getOrcamento, nomeDoPdf } from '@/lib/orcamentos/publico'

// PDF do orcamento: /orcamento/<token>/pdf?layout=desktop|mobile
// Mesmas regras da pagina: rascunho (sem login) e token inexistente = 404;
// expirado = sem PDF.
export const dynamic = 'force-dynamic'

// Baixa a imagem e entrega em JPG ate 1600px (o react-pdf so le JPG e PNG, e
// o PDF fica leve mesmo com as fotos grandes do painel)
async function imagem(url: string | null | undefined, origem: string): Promise<Buffer | null> {
  if (!url) return null
  try {
    const res = await fetch(new URL(url, origem), { cache: 'no-store' })
    if (!res.ok) return null
    const entrada = Buffer.from(await res.arrayBuffer())
    return await sharp(entrada)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82 })
      .toBuffer()
  } catch {
    return null
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const o = await getOrcamento((await params).token)
  if (!o) return new Response('Orçamento não encontrado', { status: 404 })
  if (o.expirado) return new Response('Esse orçamento expirou', { status: 410 })

  const layout: Layout = new URL(request.url).searchParams.get('layout') === 'mobile' ? 'mobile' : 'desktop'
  const origem = new URL(request.url).origin

  const [sobre, ...cases] = await Promise.all([
    imagem(o.sobre?.fotoPdf?.url, origem),
    ...o.cases.map((c) => Promise.all(c.imagens.slice(0, 2).map((m) => imagem(m.url, origem)))),
  ])
  const imagens: Imagens = { sobre: sobre as Buffer | null, cases: cases as (Buffer | null)[][] }

  const doc = createElement(OrcamentoPdf, { o, layout, imagens }) as unknown as ReactElement<DocumentProps>
  const pdf = await renderToBuffer(doc)

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeDoPdf(o)}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
