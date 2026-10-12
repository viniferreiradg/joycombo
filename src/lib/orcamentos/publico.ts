import { headers } from 'next/headers'
import { getClient, getLanding, type MediaDoc } from '@/lib/data'
import { fillTemplate, paragraphs } from '@/lib/format'
import { expirou, formatData } from './datas'
import { prazoTotal, type Sprint } from './propostas'

// Leitura do orcamento para a pagina do cliente e o PDF. Busca pela Local API
// (as colecoes sao fechadas para quem nao esta logado) e devolve so o que a
// pagina mostra. Rascunho so abre para quem esta logado no painel.

type Linha = Record<string, unknown>
const num = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const midia = (v: unknown) => (v && typeof v === 'object' && (v as MediaDoc).url ? (v as MediaDoc) : null)

export type PropostaView = {
  numero: number
  nome: string
  subtitulo: string
  valor: number | null
  prazo: number
  escopo1: string[]
  escopo2: string[]
  escopo3: string[]
  sprints: {
    numero: string
    nome: string
    descricao: string
    itens: { nome: string; dias: number | null }[]
    entregaIcone: string
    entregaTexto: string
  }[]
}

export type CaseView = { nome: string; subtitulo: string; texto: string[]; link: string; imagens: MediaDoc[] }
export type ContatoView = { tipo: 'whatsapp' | 'email' | 'instagram' | 'site'; label: string; href: string }

async function estaLogado(): Promise<boolean> {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await headers() }).catch(() => ({ user: null }))
  return Boolean(user)
}

function telefone(digitos: string): string {
  const m = digitos.replace(/\D/g, '').match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : digitos
}

/** Orcamento pelo token, ou null (inexistente, ou rascunho para quem nao esta logado). */
export async function getOrcamento(token: string) {
  if (!/^[A-Za-z0-9]{6,32}$/.test(token)) return null
  const payload = await getClient()
  const res = await payload.find({
    collection: 'orcamentos',
    where: { token: { equals: token } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  const doc = res.docs[0] as unknown as Linha | undefined
  if (!doc) return null
  const logado = await estaLogado()
  if (doc.status !== 'enviado' && !logado) return null

  const [landing, settings, config] = await Promise.all([
    getLanding(),
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }).catch(() => null) as Promise<Linha | null>,
    payload.findGlobal({ slug: 'orcamento-config', depth: 1, overrideAccess: true }).catch(() => null) as Promise<Linha | null>,
  ])

  const validade = num(doc.validadeDias) ? doc.validadeDias : 15

  const propostas: PropostaView[] = ((doc.propostas as Linha[]) || [])
    .filter((l) => l.proposta && typeof l.proposta === 'object')
    .map((l, i) => {
      const p = l.proposta as Linha
      const sprints = (p.sprints as Sprint[]) || []
      return {
        numero: i + 1,
        nome: texto(p.nome),
        subtitulo: texto(p.subtitulo),
        valor: num(l.valor) ? l.valor : num(p.investimento) ? p.investimento : null,
        prazo: prazoTotal(sprints),
        escopo1: paragraphs(p.escopo1 as string),
        escopo2: paragraphs(p.escopo2 as string),
        escopo3: paragraphs(p.escopo3 as string),
        sprints: sprints.map((s, n) => ({
          numero: String(n + 1).padStart(2, '0'),
          nome: texto(s.nome),
          descricao: texto(s.descricao),
          itens: (s.itens || []).filter((x) => x.nome).map((x) => ({ nome: texto(x.nome), dias: num(x.dias) ? x.dias : null })),
          entregaIcone: s.entregaIcone || 'documento',
          entregaTexto: texto(s.entregaTexto),
        })),
      }
    })

  const cases: CaseView[] = ((doc.cases as Linha[]) || [])
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      nome: texto(c.nome),
      subtitulo: texto(c.subtitulo),
      texto: paragraphs(c.texto as string),
      link: texto(c.link),
      imagens: ((c.imagens as unknown[]) || []).map(midia).filter((m): m is MediaDoc => Boolean(m)),
    }))

  // Contatos: um lugar so (Configuracoes do site), com "mostrar no orcamento"
  const mostra = (campo: string) => settings?.[campo] !== false
  const whatsapp = texto(settings?.whatsapp)
  const email = texto(settings?.email)
  const instagram = texto(settings?.instagram)
  const site = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://joycombo.com.br').replace(/\/$/, '')
  const contatos: ContatoView[] = [
    whatsapp && mostra('orcamentoWhatsapp') && { tipo: 'whatsapp' as const, label: telefone(whatsapp), href: `https://wa.me/${whatsapp}` },
    email && mostra('orcamentoEmail') && { tipo: 'email' as const, label: email, href: `mailto:${email}` },
    instagram && mostra('orcamentoInstagram') && { tipo: 'instagram' as const, label: `@${instagram}`, href: `https://instagram.com/${instagram}` },
    mostra('orcamentoSite') && { tipo: 'site' as const, label: site.replace(/^https?:\/\//, ''), href: site },
  ].filter((c): c is ContatoView => Boolean(c))

  const sobreTexto = doc.sobreTextoOrigem === 'novo' ? paragraphs(doc.sobreTexto as string) : paragraphs(landing.aboutText)

  return {
    token,
    rascunho: doc.status !== 'enviado',
    expirado: expirou(doc.dataExpiracao as string),
    cliente: texto(doc.cliente),
    tituloCapa: limparTitulo(texto(doc.tituloCapa)) || 'Orçamento completo',
    data: formatData(doc.data as string),
    validade,
    capa: doc.mostrarCapa !== false,
    sobre:
      doc.mostrarSobre !== false
        ? {
            titulo: limparTitulo(texto(doc.sobreTitulo)) || landing.aboutKicker,
            texto: sobreTexto,
            cards: doc.sobreCards !== false ? landing.aboutStats : [],
            midia: landing.aboutPhoto,
            fotoPdf: midia(doc.sobreFotoPdf),
            nome: landing.aboutName,
          }
        : null,
    cases,
    propostas,
    parcelamento:
      doc.mostrarParcelamento !== false
        ? texto(doc.parcelamento)
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        : [],
    outrasInformacoes:
      doc.mostrarOutrasInfo !== false
        ? ((config?.outrasInformacoes as Linha[]) || [])
            .map((i) => fillTemplate(texto(i.texto), { validade }))
            .filter(Boolean)
            .map((t) => {
              const [primeira, ...resto] = t.split('\n').map((l) => l.trim())
              return { texto: primeira, subitens: resto.filter(Boolean) }
            })
        : [],
    contraCapa: doc.mostrarContraCapa !== false,
    contatos,
  }
}

export type Orcamento = NonNullable<Awaited<ReturnType<typeof getOrcamento>>>

/** Nome do arquivo: orcamento-joycombo-{cliente}.pdf */
export function nomeDoPdf(o: Orcamento): string {
  const cliente = o.cliente
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `orcamento-joycombo-${cliente || 'cliente'}.pdf`
}

/** Tira { } ( ) // dos titulos: sao da identidade do Vini Ferreira, nao do Joycombo. */
export function limparTitulo(t: string): string {
  return t.replace(/\/\//g, '').replace(/[{}()]/g, '').replace(/\s+/g, ' ').trim()
}
