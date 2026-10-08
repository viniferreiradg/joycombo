import type { Metadata } from 'next'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { ArrowLeft } from 'pixelarticons/react'
import { Logo } from '@/components/Brand'
import { getClient, getSeo, getSettings } from '@/lib/data'

export const revalidate = 60

// Titulo e descricao vem do menu SEO (aba Outras paginas)
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo()
  return {
    title: seo.privacyTitle,
    description: seo.privacyDescription,
    alternates: { canonical: '/politica-de-privacidade' },
    openGraph: { title: seo.privacyTitle, description: seo.privacyDescription },
  }
}

export default async function PrivacyPage() {
  const payload = await getClient()
  const [doc, settings] = await Promise.all([
    payload.findGlobal({ slug: 'privacy' }).catch(() => null) as Promise<{ body?: SerializedEditorState | null; updatedOn?: string | null } | null>,
    getSettings(),
  ])
  const hasBody = Boolean(doc?.body?.root?.children?.some((c) => 'children' in c && Array.isArray(c.children) && c.children.length))
  const updated = doc?.updatedOn ? new Date(doc.updatedOn).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null
  const contact = settings.email || `WhatsApp +${settings.whatsapp}`

  return (
    <div className="on-light min-h-screen bg-white text-black">
      <header className="border-b border-line-light">
        <div className="container-site flex h-16 items-center justify-between">
          <Link href="/" aria-label="Joycombo, página inicial">
            <Logo className="h-4 w-auto md:h-5" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold">
            <ArrowLeft className="h-5 w-5" aria-hidden /> Voltar
          </Link>
        </div>
      </header>
      <main className="container-site max-w-3xl py-16 md:py-24">
        <h1 className="title title-sm mb-3">Política de Privacidade</h1>
        {updated && <p className="mb-10 text-sm text-muted-light">Última atualização: {updated}</p>}
        <div className="prose-joy space-y-4 leading-relaxed">
          {hasBody ? <RichText data={doc!.body!} /> : <DefaultPolicy contact={contact} />}
        </div>
      </main>
    </div>
  )
}

// Texto padrao enquanto a politica nao for escrita no admin
function DefaultPolicy({ contact }: { contact: string }) {
  return (
    <>
      <p>
        Esta política explica como o Joycombo, estúdio de design de Vini Ferreira, trata os dados de quem visita o site joycombo.com.br,
        de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>
      <h2>Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Formulário de contato:</strong> nome, número de WhatsApp e segmento do negócio, informados por você.
        </li>
        <li>
          <strong>Origem da visita:</strong> parâmetros do link de anúncio (como utm_source, gclid e fbclid), para saber qual campanha trouxe o contato.
        </li>
        <li>
          <strong>Cookies de medição:</strong> só depois que você aceita no aviso de cookies, usamos o Google (Analytics e Google Ads) e o Pixel da Meta
          para medir visitas e o resultado dos anúncios.
        </li>
      </ul>
      <h2>Para que usamos</h2>
      <ul>
        <li>Responder o seu contato e enviar a proposta do serviço.</li>
        <li>Entender quais anúncios e páginas funcionam melhor.</li>
      </ul>
      <p>Não vendemos nem compartilhamos os seus dados com terceiros para outros fins.</p>
      <h2>Com quem compartilhamos</h2>
      <p>
        Com as ferramentas necessárias para o site funcionar: hospedagem, WhatsApp (Meta), Google e Meta (somente com cookies aceitos). Cada uma segue a
        própria política de privacidade.
      </p>
      <h2>Por quanto tempo guardamos</h2>
      <p>Os dados do formulário ficam guardados enquanto houver conversa sobre o serviço e, depois, pelo prazo exigido por lei.</p>
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir a qualquer momento para ver, corrigir ou apagar os seus dados, e pode recusar ou mudar a escolha de cookies pelo link
        &quot;Cookies&quot; no rodapé do site. Para isso, fale com a gente: {contact}.
      </p>
    </>
  )
}
