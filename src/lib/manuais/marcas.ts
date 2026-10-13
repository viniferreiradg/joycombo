// Versoes da marca do manual: o que fica salvo (campo JSON "marcas"), a
// leitura do nome dos arquivos e a escolha do fundo. Puro (sem DOM): usado
// no painel e na pagina publica.
import { type Caixa, type ConfigLockup, type Medicao, type Papel, type Parte, CONFIG_PADRAO } from './medicao'
import { slugify } from './padroes'

/** SVG ja sanitizado e com ids/classes prefixados (ver svg.ts) */
export type SvgSalvo = { conteudo: string; viewBox: Caixa }

export type Versao = {
  id: string
  arquivo: string
  /** lido do nome do arquivo; so serve para sugerir grupos */
  lockup: string
  variante: string
  /** slug da cor de fundo (paleta) ou 'branco' */
  fundo: string
  /** id do grupo (null = fora do manual) */
  grupo: string | null
  svg: SvgSalvo
}

/**
 * Grupo: versoes organizadas a mao. Cada grupo decide se aparece em Versoes,
 * Dimensoes e Area de seguranca; nas duas ultimas, cada versao do grupo ganha
 * o proprio desenho. Os ajustes (partes, sombra, margens, cotas) valem para
 * todas as versoes do grupo.
 */
export type GrupoSalvo = {
  id: string
  nome: string
  emVersoes: boolean
  emDimensoes: boolean
  emSeguranca: boolean
  /** reducao maxima: largura minima testada (nao calculada) */
  emReducao?: boolean
  reducaoPx?: number | null
  reducaoMm?: number | null
  proximidade: number
  ajustes: Record<string, { nome?: string; papel?: Papel }>
  cfg: ConfigLockup
  /** partes e medicao de cada versao do grupo (id da versao), calculadas no painel; a pagina publica nao mede */
  medidas?: Record<string, { partes: Parte[]; medicao?: Medicao }>
}

export type RefX = { nome: string; svg: SvgSalvo; caixa: Caixa }

export const TIPOS_INCORRETOS = [
  { tipo: 'condensacao', rotulo: 'Distorção por condensação' },
  { tipo: 'expansao', rotulo: 'Distorção por expansão' },
  { tipo: 'cores', rotulo: 'Distorção de cores' },
  { tipo: 'separacao', rotulo: 'Separação' },
  { tipo: 'diagonal', rotulo: 'Uso diagonal' },
  { tipo: 'contorno', rotulo: 'Contorno' },
  { tipo: 'sombra', rotulo: 'Sombra indevida' },
  { tipo: 'contraste', rotulo: 'Fundo sem contraste' },
  { tipo: 'personalizado', rotulo: 'Alterar elementos internos' },
] as const

export type TipoIncorreto = (typeof TIPOS_INCORRETOS)[number]['tipo']

/** Um uso incorreto: gerado da referencia por transformacao, ou um SVG proprio (personalizado) */
export type ItemIncorreto = { id: string; tipo: TipoIncorreto; rotulo: string; svg?: SvgSalvo | null }

export type Incorretos = { referencia: string; itens: ItemIncorreto[] }

export type MarcasData = { refX?: RefX | null; versoes: Versao[]; grupos: GrupoSalvo[]; incorretos?: Incorretos | null }

export const MARCAS_VAZIO: MarcasData = { refX: null, versoes: [], grupos: [], incorretos: null }

export type CorFundo = { slug: string; nome: string; hex: string; categoria: 'claro' | 'escuro' | 'colorido' }

export const BRANCO: CorFundo = { slug: 'branco', nome: 'Branco', hex: '#FFFFFF', categoria: 'claro' }

export const CATEGORIAS = [
  { valor: 'claro', titulo: 'Fundos Claros' },
  { valor: 'escuro', titulo: 'Fundos Escuros' },
  { valor: 'colorido', titulo: 'Fundos Coloridos' },
] as const

/** Branco + cores da paleta (sem repetir slug) */
export function coresDeFundo(paleta: { cores: { nome: string; hex: string; categoria: string }[] }[]): CorFundo[] {
  const lista: CorFundo[] = [BRANCO]
  for (const g of paleta) {
    for (const c of g.cores || []) {
      if (!/^#[0-9a-f]{6}$/i.test(String(c.hex || '').trim())) continue
      const slug = slugify(c.nome || '') || c.hex.replace('#', '').toLowerCase()
      if (lista.some((l) => l.slug === slug)) continue
      const categoria = (['claro', 'escuro', 'colorido'].includes(c.categoria) ? c.categoria : 'claro') as CorFundo['categoria']
      lista.push({ slug, nome: c.nome, hex: c.hex.trim().toUpperCase(), categoria })
    }
  }
  return lista
}

function luminancia(hex: string) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]
}

const ESCURO = ['preto', 'escuro', 'black', 'dark', 'negativo']
const CLARO = ['branco', 'claro', 'white', 'light', 'positivo']

/** Palavra do nome do arquivo -> cor de fundo. Sem palavra: fundo claro. */
export function escolherFundo(token: string, cores: CorFundo[]): string {
  const t = slugify(token)
  if (t) {
    const exata = cores.find((c) => c.slug === t)
    if (exata) return exata.slug
    const parecida = cores.find((c) => c.slug.includes(t) || t.includes(c.slug))
    if (parecida) return parecida.slug
    if (ESCURO.includes(t)) {
      const escuras = cores.filter((c) => c.categoria === 'escuro').sort((a, b) => luminancia(a.hex) - luminancia(b.hex))
      return (escuras[0] || [...cores].sort((a, b) => luminancia(a.hex) - luminancia(b.hex))[0]).slug
    }
    if (CLARO.includes(t)) return BRANCO.slug
  }
  // marca para fundo claro: a cor clara da paleta (ex.: creme) ou branco
  const claras = cores.filter((c) => c.categoria === 'claro' && c.slug !== BRANCO.slug)
  return (claras[0] || BRANCO).slug
}

/**
 * Nome do arquivo -> lockup, variante e fundo. Aceita os dois jeitos:
 *   vertical_sombra_vermelho.svg (convencao do plano: lockup_variante_fundo)
 *   cereja-bloom-horizontal-sombra-fundo-preto.svg (nome do cliente na frente, "fundo-<cor>")
 */
export function lerNomeDoArquivo(arquivo: string, cliente: string, cores: CorFundo[]): Pick<Versao, 'lockup' | 'variante' | 'fundo'> {
  const base = arquivo.replace(/\.svg$/i, '').replace(/[_ ](\d+)$/, '')
  const porUnderline = base.split('_').filter(Boolean)
  if (porUnderline.length === 3 && !/fundo/i.test(base)) {
    return {
      lockup: slugify(porUnderline[0]) || 'marca',
      variante: slugify(porUnderline[1]) || 'padrao',
      fundo: escolherFundo(porUnderline[2], cores),
    }
  }
  let tokens = slugify(base).split('-').filter(Boolean)
  // tira o nome do cliente do comeco (cereja-bloom-...)
  const doCliente = slugify(cliente).split('-').filter(Boolean)
  if (doCliente.length && doCliente.every((t, i) => tokens[i] === t) && tokens.length > doCliente.length) {
    tokens = tokens.slice(doCliente.length)
  }
  const i = tokens.indexOf('fundo')
  const lockup = tokens[0] || 'marca'
  const resto = i > 0 ? tokens.slice(1, i) : tokens.slice(1)
  const fundoToken = i > 0 ? tokens.slice(i + 1).join('-') : ''
  return { lockup, variante: resto.join('-') || 'padrao', fundo: escolherFundo(fundoToken, cores) }
}

/** "sombra-vermelho" -> "Sombra vermelho" */
export function legivel(slug: string): string {
  const t = slug.replace(/-/g, ' ').trim()
  if (!t || t === 'padrao') return 'Padrão'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const temSombra = (v: Versao) => /sombra|shadow/.test(v.variante)

/** Defesa extra no servidor: o SVG ja foi sanitizado no painel, mas so entra sem script/eventos */
export function svgSeguro(conteudo: string): string {
  return conteudo
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href\s*=\s*["'])\s*javascript:[^"']*/gi, '$1#')
}

export function novoGrupo(nome: string): GrupoSalvo {
  return {
    id: crypto.randomUUID(),
    nome,
    emVersoes: true,
    emDimensoes: false,
    emSeguranca: false,
    proximidade: 0.03,
    ajustes: {},
    cfg: { ...CONFIG_PADRAO },
  }
}

/** Sugestao de grupos pelos nomes dos arquivos: lockup + "com sombra" */
export function sugerirGrupos(dados: MarcasData): MarcasData {
  const grupos = [...dados.grupos]
  const versoes = dados.versoes.map((v) => {
    if (v.grupo && grupos.some((g) => g.id === v.grupo)) return v
    const nome = `${legivel(v.lockup)}${temSombra(v) ? ' com sombra' : ''}`
    let g = grupos.find((x) => x.nome === nome)
    if (!g) {
      g = novoGrupo(nome)
      grupos.push(g)
    }
    return { ...v, grupo: g.id }
  })
  return { ...dados, versoes, grupos }
}

// ------------------------------------------------------------ PNGs das versoes

/** nome do arquivo sem extensao, normalizado (Cereja Bloom.SVG = cereja-bloom) */
const chaveArquivo = (nome: string) => slugify(nome.replace(/\.[a-z0-9]+$/i, ''))

/**
 * Liga cada PNG enviado a versao de mesmo nome (o SVG). Se o painel renomeou
 * um repetido (nome-1.png), tenta tambem sem o numero. Devolve a URL do PNG por
 * versao e os PNGs que nao combinaram com nenhuma.
 */
export function ligarPngs(versoes: Pick<Versao, 'id' | 'arquivo'>[], pngs: { filename: string; url: string }[]) {
  const porChave = new Map(versoes.map((v) => [chaveArquivo(v.arquivo), v.id]))
  const porVersao = new Map<string, string>()
  const soltos: string[] = []
  for (const p of pngs) {
    const k = chaveArquivo(p.filename)
    const id = porChave.get(k) ?? porChave.get(k.replace(/-\d+$/, ''))
    if (id && !porVersao.has(id)) porVersao.set(id, p.url)
    else soltos.push(p.filename)
  }
  return { porVersao, soltos }
}

/** arquivo .svg completo a partir do SVG salvo (para baixar) */
export function arquivoSvg(svg: SvgSalvo): string {
  const { x, y, w, h } = svg.viewBox
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${svg.conteudo}</svg>\n`
}
