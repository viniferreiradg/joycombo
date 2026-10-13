import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ManualWeb from '@/components/manuais/web/ManualWeb'
import { getManual } from '@/lib/manuais/publico'

// /manual/<slug>: o manual de marca do cliente (versao web). Fora do sitemap
// e sem link no site; rascunho so abre para quem esta logado.

type Props = { params: Promise<{ slug: string }> }

/** primeiro paragrafo da apresentacao, no tamanho de uma descricao */
function descricao(texto: string[] | undefined, cliente: string): string {
  const t = (texto?.[0] || `Manual de marca de ${cliente}: versões, cores, tipografia e normas de uso.`).replace(/\s+/g, ' ')
  return t.length > 160 ? `${t.slice(0, 157).replace(/\s+\S*$/, '')}…` : t
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const manual = await getManual((await params).slug)
  if (!manual) return { title: 'Manual de Marca' }
  const title = `Manual de Marca · ${manual.cliente}`
  const apresentacao = manual.paginas.find((p) => p.tipo === 'apresentacao')
  const description = descricao(apresentacao?.tipo === 'apresentacao' ? apresentacao.texto : undefined, manual.cliente)
  // ?v= muda quando o manual e salvo: o WhatsApp guarda a imagem pelo endereco
  const imagem = { url: `/manual/${manual.slug}/og.jpg?v=${Date.parse(manual.atualizado) || 1}`, width: 1200, height: 630, type: 'image/jpeg', alt: title }
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'pt_BR', siteName: 'Joycombo', url: `/manual/${manual.slug}`, images: [imagem] },
    twitter: { card: 'summary_large_image', title, description, images: [imagem.url] },
  }
}

export default async function ManualPage({ params }: Props) {
  const manual = await getManual((await params).slug)
  if (!manual) notFound()
  return <ManualWeb manual={manual} />
}
