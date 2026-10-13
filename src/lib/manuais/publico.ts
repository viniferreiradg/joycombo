import { headers } from 'next/headers'
import { getClient, type MediaDoc } from '@/lib/data'
import { paragraphs } from '@/lib/format'
import { formatCmyk, formatRgb, hexParaRgb, hexValido, rgbParaCmyk } from './cores'
import { type GrupoSalvo, type MarcasData, type RefX, type SvgSalvo, type TipoIncorreto, CATEGORIAS, coresDeFundo, legivel, ligarPngs, svgSeguro } from './marcas'
import { corSemContraste } from '@/components/manuais/Incorretos'
import type { Medicao } from './medicao'
import { slugify } from './padroes'

// Leitura do manual para a pagina do cliente. Busca pela Local API (a
// collection e fechada para quem nao esta logado) e ja devolve as paginas na
// ordem fixa, numeradas: uma pagina por bloco, entao o sumario sai sem medir
// layout. Rascunho so abre para quem esta logado no painel.

type Linha = Record<string, unknown>
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export type Img = { url: string; alt: string; width: number; height: number }

function img(v: unknown): Img | null {
  const m = v && typeof v === 'object' ? (v as MediaDoc) : null
  if (!m?.url || !String(m.mimeType || 'image/').startsWith('image/')) return null
  return { url: m.url, alt: m.alt || '', width: m.width || 1600, height: m.height || 900 }
}

export type Cor = { nome: string; hex: string; pantone: string; rgb: string; cmyk: string; categoria: 'claro' | 'escuro' | 'colorido'; slug: string }
export type GrupoCores = { nome: string; cores: Cor[] }

export type Fonte = {
  nome: string
  papel: string
  exemplo: string
  /** font-family para usar no CSS do especime */
  familia: string
  /** folha do Google Fonts ou @font-face do arquivo enviado */
  googleUrl: string | null
  fontFace: string | null
  link: string
  /** imagem do especime (no lugar do texto renderizado na fonte) */
  imagem: Img | null
}

export type Bloco =
  | { tipo: 'textoImagem'; titulo: string; texto: string[]; imagens: Img[] }
  | { tipo: 'antesDepois'; titulo: string; texto: string[]; pares: { antes: Img; depois: Img }[] }
  | { tipo: 'paleta'; titulo: string; texto: string[] }
  | { tipo: 'tipografia'; titulo: string; texto: string[]; fontes: Fonte[] }

/** sub: titulo no sumario (so na primeira pagina de cada assunto) */
type Base = { id: string; n: number; secao: string | null; sub?: string }

/** arquivo: nome do SVG original (para o download); png: URL do PNG enviado, se houver */
export type ItemVersao = { rotulo: string; svg: SvgSalvo; arquivo: string; png: string | null }
/** fundo: cor do quadro do desenho (null = sobre o branco da pagina) */
export type Desenho = { rotulo: string; svg: SvgSalvo; medicao: Medicao; fundo: string | null }
export type ItemReducao = { rotulo: string; svg: SvgSalvo; px: number | null; mm: number | null; fundo: string | null }
export type ItemIncorretoView = { id: string; tipo: TipoIncorreto; rotulo: string; svg: SvgSalvo; medicao: Medicao | null; contraste: string; fundo: string | null }
export type Pagina = Base &
  (
    | { tipo: 'capa' }
    | { tipo: 'apresentacao'; texto: string[] }
    | { tipo: 'sumario' }
    | { tipo: 'divisoria'; ordem: number; titulo: string; texto: string[] }
    | { tipo: 'bloco'; ordem: number; bloco: Bloco }
    | { tipo: 'aplicacao'; layout: 'cheia' | 'dupla'; imagens: Img[] }
    | { tipo: 'versoes'; ordem: number; subtitulo: string; fundo: string; itens: ItemVersao[] }
    | { tipo: 'dimensoes' | 'seguranca'; ordem: number; desenhos: Desenho[]; refX: RefX | null; textoX: string }
    | { tipo: 'reducao'; ordem: number; itens: ItemReducao[] }
    | { tipo: 'incorretos'; ordem: number; referencia: { svg: SvgSalvo; fundo: string | null }; itens: ItemIncorretoView[] }
    | { tipo: 'creditos'; texto: string[] }
  )

export type ItemSumario = { titulo: string; id: string; n: number; itens: { titulo: string; id: string; n: number }[] }

async function estaLogado(): Promise<boolean> {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await headers() }).catch(() => ({ user: null }))
  return Boolean(user)
}

function fonte(l: Linha, i: number): Fonte | null {
  const nome = texto(l.nome)
  if (!nome) return null
  const base = { nome, papel: texto(l.papel), exemplo: texto(l.exemplo) || 'A essência da marca', link: texto(l.link), imagem: null }
  if (!l.origem || l.origem === 'imagem') {
    const imagem = img(l.imagem)
    // sem imagem ainda: a fonte aparece so com o texto padrao, para nao sumir do manual
    return { ...base, imagem, familia: 'inherit', googleUrl: null, fontFace: null }
  }
  const arquivo = l.arquivo && typeof l.arquivo === 'object' ? (l.arquivo as MediaDoc) : null
  if (l.origem === 'arquivo' && arquivo?.url) {
    const familia = `manual-fonte-${i}`
    const nome = `${arquivo.url} ${(arquivo as MediaDoc & { filename?: string }).filename || ''} ${arquivo.mimeType || ''}`.toLowerCase()
    const formato = /woff2/.test(nome) ? 'woff2' : /woff/.test(nome) ? 'woff' : /otf|opentype/.test(nome) ? 'opentype' : 'truetype'
    return { ...base, familia, googleUrl: null, fontFace: `@font-face{font-family:'${familia}';src:url('${arquivo.url}') format('${formato}');font-display:swap}` }
  }
  const google = texto(l.googleFamilia).replace(/[^\w\s-]/g, '')
  if (!google) return { ...base, familia: 'inherit', googleUrl: null, fontFace: null }
  const pesos = /^\d{3}(;\d{3})*$/.test(texto(l.pesos)) ? `:wght@${texto(l.pesos)}` : ''
  return {
    ...base,
    familia: `'${google}'`,
    googleUrl: `https://fonts.googleapis.com/css2?family=${google.replace(/\s+/g, '+')}${pesos}&display=swap`,
    fontFace: null,
  }
}

function bloco(l: Linha, fontesVistas: { n: number }): Bloco | null {
  const titulo = texto(l.titulo)
  const corpo = paragraphs(texto(l.texto))
  switch (l.blockType) {
    case 'textoImagem': {
      const imagens = ((l.imagens as unknown[]) || []).map(img).filter((x): x is Img => Boolean(x))
      return imagens.length ? { tipo: 'textoImagem', titulo, texto: corpo, imagens } : null
    }
    case 'antesDepois': {
      const pares = ((l.pares as Linha[]) || [])
        .map((p) => ({ antes: img(p.antes), depois: img(p.depois) }))
        .filter((p): p is { antes: Img; depois: Img } => Boolean(p.antes && p.depois))
      return pares.length ? { tipo: 'antesDepois', titulo, texto: corpo, pares } : null
    }
    case 'paleta':
      return { tipo: 'paleta', titulo, texto: corpo }
    case 'tipografia': {
      const fontes = ((l.fontes as Linha[]) || []).map((f) => fonte(f, fontesVistas.n++)).filter((f): f is Fonte => Boolean(f))
      return fontes.length ? { tipo: 'tipografia', titulo, texto: corpo, fontes } : null
    }
    default:
      return null
  }
}

const seguro = (svg: SvgSalvo): SvgSalvo => ({ conteudo: svgSeguro(svg.conteudo), viewBox: svg.viewBox })

/**
 * Paginas de normas a partir das versoes: uma pagina por cor de fundo (agrupadas
 * por categoria; com muitas variantes, quebra em mais paginas), e uma pagina de
 * dimensoes e uma de area de seguranca por lockup.
 */
function normas(marcas: MarcasData | null, paleta: GrupoCores[], secao: string, descricaoX: string, pngs: { filename: string; url: string }[]) {
  if (!marcas?.versoes?.length || !marcas.grupos?.length) return []
  const { porVersao: pngDe } = ligarPngs(marcas.versoes, pngs)
  const cores = coresDeFundo(paleta.map((g) => ({ cores: g.cores.map((c) => ({ nome: c.nome, hex: c.hex, categoria: c.categoria })) })))
  const grupos = marcas.grupos.filter((g) => marcas.versoes.some((v) => v.grupo === g.id))
  const paginas: Record<string, unknown>[] = []

  // 01. versoes da marca: uma pagina por cor de fundo (claros, escuros,
  // coloridos); as marcas seguem a ordem dos grupos e fluem por uma grade de
  // ate 6 (2 x 3), sempre no mesmo tamanho; passando de 6, continua na seguinte
  const nasVersoes = grupos.filter((g) => g.emVersoes)
  for (const cat of CATEGORIAS) {
    for (const cor of cores.filter((c) => c.categoria === cat.valor)) {
      const itens: ItemVersao[] = nasVersoes.flatMap((g) =>
        marcas.versoes
          .filter((v) => v.grupo === g.id && v.fundo === cor.slug)
          .sort((a, b) => a.arquivo.localeCompare(b.arquivo))
          .map((v) => ({ rotulo: g.nome, svg: seguro(v.svg), arquivo: v.arquivo, png: pngDe.get(v.id) ?? null })),
      )
      for (let i = 0; i < itens.length; i += 6) {
        paginas.push({
          id: `versoes-${cor.slug}-${i / 6 + 1}`,
          secao,
          tipo: 'versoes',
          ordem: 1,
          subtitulo: `${cat.titulo} · ${cor.nome}`,
          fundo: cor.hex,
          itens: itens.slice(i, i + 6),
        })
      }
    }
  }
  if (paginas.length) paginas[0].sub = 'Versões da Marca'

  // 02 e 03. dimensoes e area de seguranca: cada versao dos grupos marcados
  // ganha o proprio desenho, sobre o fundo dela; ate 4 por pagina
  const desenhosDo = (g: GrupoSalvo): Desenho[] => {
    const versoes = marcas.versoes.filter((v) => v.grupo === g.id).sort((a, b) => a.arquivo.localeCompare(b.arquivo))
    const nomeCor = (slug: string) => cores.find((c) => c.slug === slug)?.nome || slug
    return versoes.flatMap((v) => {
      const medicao = g.medidas?.[v.id]?.medicao
      if (!medicao) return []
      // duas versoes do grupo no mesmo fundo: o nome da variante desempata
      const repetido = versoes.filter((x) => x.fundo === v.fundo).length > 1
      const cor = cores.find((c) => c.slug === v.fundo)
      return [
        {
          rotulo: `${g.nome} · ${repetido ? `${legivel(v.variante)} · ` : ''}${nomeCor(v.fundo)}`,
          svg: seguro(v.svg),
          medicao,
          fundo: cor && cor.slug !== 'branco' ? cor.hex : null,
        },
      ]
    })
  }
  const refX = marcas.refX ? { ...marcas.refX, svg: seguro(marcas.refX.svg) } : null
  const textoX = descricaoX
    ? `As proporções são calculadas usando uma referência "x", que é ${descricaoX.replace(/\.$/, '')}.`
    : 'As proporções são calculadas usando como referência a unidade x.'
  for (const [tipo, ordem, titulo, marcado] of [
    ['dimensoes', 2, 'Dimensões da Marca', (g: GrupoSalvo) => g.emDimensoes],
    ['seguranca', 3, 'Área de Segurança', (g: GrupoSalvo) => g.emSeguranca],
  ] as const) {
    const desenhos = grupos.filter(marcado).flatMap(desenhosDo)
    for (let i = 0; i < desenhos.length; i += 4) {
      paginas.push({ id: `${tipo}-${i / 4 + 1}`, secao, tipo, ordem, ...(i === 0 ? { sub: titulo } : {}), desenhos: desenhos.slice(i, i + 4), refX, textoX })
    }
  }

  // 04. reducao maxima: uma marca por grupo marcado, com a largura minima testada
  const fundoDe = (slug: string) => {
    const c = cores.find((x) => x.slug === slug)
    return c && c.slug !== 'branco' ? c.hex : null
  }
  const daPaginaClara = (versoes: typeof marcas.versoes) =>
    [...versoes].sort((a, b) => {
      const claro = (slug: string) => (cores.find((c) => c.slug === slug)?.categoria === 'claro' ? 0 : 1)
      return claro(a.fundo) - claro(b.fundo) || a.arquivo.localeCompare(b.arquivo)
    })[0]
  const reducoes: ItemReducao[] = grupos
    .filter((g) => g.emReducao)
    .flatMap((g) => {
      const v = daPaginaClara(marcas.versoes.filter((x) => x.grupo === g.id))
      return v ? [{ rotulo: g.nome, svg: seguro(v.svg), px: g.reducaoPx ?? null, mm: g.reducaoMm ?? null, fundo: fundoDe(v.fundo) }] : []
    })
  for (let i = 0; i < reducoes.length; i += 6) {
    paginas.push({ id: `reducao-${i / 6 + 1}`, secao, tipo: 'reducao', ordem: 4, ...(i === 0 ? { sub: 'Redução Máxima' } : {}), itens: reducoes.slice(i, i + 6) })
  }

  // 05. usos incorretos: gerados da versao de referencia (ou SVG proprio), 6 por pagina
  const inc = marcas.incorretos
  const ref = inc?.itens?.length ? marcas.versoes.find((v) => v.id === inc.referencia) : undefined
  if (inc && ref) {
    const grupoRef = marcas.grupos.find((g) => g.id === ref.grupo)
    const medicao = grupoRef?.medidas?.[ref.id]?.medicao || null
    const svgRef = seguro(ref.svg)
    const contraste = corSemContraste(svgRef, cores.filter((c) => c.slug !== 'branco').map((c) => c.hex))
    const itens: ItemIncorretoView[] = inc.itens.flatMap((it) => {
      const svg = it.tipo === 'personalizado' ? (it.svg ? seguro(it.svg) : null) : svgRef
      return svg ? [{ id: it.id, tipo: it.tipo, rotulo: it.rotulo, svg, medicao, contraste, fundo: fundoDe(ref.fundo) }] : []
    })
    for (let i = 0; i < itens.length; i += 6) {
      paginas.push({
        id: `incorretos-${i / 6 + 1}`,
        secao,
        tipo: 'incorretos',
        ordem: 5,
        ...(i === 0 ? { sub: 'Usos Incorretos' } : {}),
        referencia: { svg: svgRef, fundo: fundoDe(ref.fundo) },
        itens: itens.slice(i, i + 6),
      })
    }
  }
  return paginas as unknown as { tipo: 'versoes' }[]
}

/** Manual pelo slug, ou null (inexistente, ou rascunho para quem nao esta logado). */
export async function getManual(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  const payload = await getClient()
  const res = await payload.find({ collection: 'manuais', where: { slug: { equals: slug } }, limit: 1, depth: 2, overrideAccess: true })
  const doc = res.docs[0] as unknown as Linha | undefined
  if (!doc) return null
  const logado = await estaLogado()
  if (doc.status !== 'publicado' && !logado) return null

  const cliente = texto(doc.cliente)

  const paleta: GrupoCores[] = ((doc.paleta as Linha[]) || [])
    .map((g) => ({
      nome: texto(g.nome),
      cores: ((g.cores as Linha[]) || [])
        .filter((c) => hexValido(c.hex))
        .map((c) => {
          const hex = String(c.hex).trim().toUpperCase()
          const rgb = hexParaRgb(hex)
          return {
            nome: texto(c.nome),
            hex,
            pantone: texto(c.pantone),
            rgb: formatRgb(rgb),
            cmyk: texto(c.cmyk) || formatCmyk(rgbParaCmyk(rgb)),
            categoria: (['claro', 'escuro', 'colorido'].includes(String(c.categoria)) ? c.categoria : 'claro') as Cor['categoria'],
            slug: slugify(texto(c.nome)),
          }
        }),
    }))
    .filter((g) => g.cores.length)

  const fontesVistas = { n: 0 }
  const blocos = ((doc.universoVisual as Linha[]) || [])
    .map((l) => bloco(l, fontesVistas))
    .filter((b): b is Bloco => Boolean(b))
    // bloco de paleta sem cores cadastradas nao vira pagina
    .filter((b) => b.tipo !== 'paleta' || paleta.length)

  const aplicacoes = ((doc.aplicacoes as Linha[]) || [])
    .map((a) => {
      const layout: 'cheia' | 'dupla' = a.layout === 'dupla' ? 'dupla' : 'cheia'
      const imagens = [img(a.imagem), layout === 'dupla' ? img(a.imagem2) : null].filter((x): x is Img => Boolean(x))
      return { layout: imagens.length === 2 ? layout : ('cheia' as const), imagens }
    })
    .filter((a) => a.imagens.length)

  const tituloNormas = texto(doc.tituloNormas) || 'Normas de Uso'

  // arquivos para baixar: PNGs das versoes e o ZIP com todas
  const arquivo = (v: unknown) => {
    const m = v && typeof v === 'object' ? (v as MediaDoc & { filename?: string }) : null
    return m?.url && m.filename ? { url: m.url, filename: m.filename } : null
  }
  const pngs = ((doc.pngsMarcas as unknown[]) || []).map(arquivo).filter((x): x is { url: string; filename: string } => Boolean(x))
  const zip = arquivo(doc.pacoteMarcas)

  // ---------------------------------------------------------- paginas na ordem fixa
  const sem = <T extends { tipo: string }>(p: T) => p
  const lista = [
    sem({ id: 'capa', secao: null, tipo: 'capa' as const }),
    sem({ id: 'apresentacao', secao: null, tipo: 'apresentacao' as const, texto: paragraphs(texto(doc.textoApresentacao)) }),
    sem({ id: 'sumario', secao: null, tipo: 'sumario' as const }),
    sem({ id: 'universo-visual', secao: null, tipo: 'divisoria' as const, ordem: 1, titulo: 'Universo Visual', texto: paragraphs(texto(doc.textoUniverso)) }),
    ...blocos.map((b, i) => sem({ id: `universo-${i + 1}-${slugify(b.titulo) || 'pagina'}`, secao: 'Universo Visual', sub: b.titulo, tipo: 'bloco' as const, ordem: i + 1, bloco: b })),
    sem({ id: 'aplicacoes', secao: null, tipo: 'divisoria' as const, ordem: 2, titulo: 'Exemplos de Aplicação', texto: paragraphs(texto(doc.textoAplicacoes)) }),
    ...aplicacoes.map((a, i) => sem({ id: `aplicacao-${i + 1}`, secao: 'Exemplos de Aplicação', tipo: 'aplicacao' as const, ...a })),
    sem({ id: 'normas', secao: null, tipo: 'divisoria' as const, ordem: 3, titulo: tituloNormas, texto: paragraphs(texto(doc.textoNormas)) }),
    ...normas(doc.marcas as MarcasData | null, paleta, tituloNormas, texto(doc.descricaoX), pngs),
    sem({ id: 'creditos', secao: null, tipo: 'creditos' as const, texto: paragraphs(texto(doc.textoCreditos)) }),
  ]
  const paginas = lista.map((p, i) => ({ ...p, n: i + 1 })) as Pagina[]

  // ---------------------------------------------------------- sumario (das divisorias)
  const sumario: ItemSumario[] = []
  for (const p of paginas) {
    if (p.tipo === 'divisoria') sumario.push({ titulo: p.titulo, id: p.id, n: p.n, itens: [] })
    else if (p.sub) sumario[sumario.length - 1]?.itens.push({ titulo: p.sub, id: p.id, n: p.n })
  }

  const fontes = blocos.flatMap((b) => (b.tipo === 'tipografia' ? b.fontes : []))

  return { slug, cliente, rascunho: doc.status !== 'publicado', capa: img(doc.capa), paleta, paginas, sumario, fontes, zip }
}

export type Manual = NonNullable<Awaited<ReturnType<typeof getManual>>>
