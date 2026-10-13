import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ManualWeb from '@/components/manuais/web/ManualWeb'
import { getManual } from '@/lib/manuais/publico'

// /manual/<slug>: o manual de marca do cliente (versao web). Fora do sitemap
// e sem link no site; rascunho so abre para quem esta logado.

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const manual = await getManual((await params).slug)
  return { title: manual ? `Manual de Marca · ${manual.cliente}` : 'Manual de Marca' }
}

export default async function ManualPage({ params }: Props) {
  const manual = await getManual((await params).slug)
  if (!manual) notFound()
  return <ManualWeb manual={manual} />
}
