// Motor de medicao dos manuais de marca: a parte do navegador.
// 1) limparSvg: sanitiza, prefixa ids/classes (o Illustrator repete .cls-1
//    em todo arquivo e os estilos colidem na mesma pagina) e tira width/height.
// 2) lerFormas: renderiza o SVG escondido e mede cada forma no sistema de
//    coordenadas do viewBox (considerando transforms dos grupos).
// 3) agruparPartes: usa as camadas nomeadas (simbolo, logotipo, assinatura,
//    sombra, ref-x) quando existem; senao detecta a sombra pela cor e junta
//    as formas proximas em partes.
import DOMPurify from 'dompurify'
import { type Caixa, type Parte, uniao } from './medicao'

export type SvgLimpo = {
  /** conteudo de dentro do <svg> (ja com prefixo) */
  conteudo: string
  viewBox: Caixa
  prefixo: string
}

export type Forma = { caixa: Caixa; cor: string; camada: string | null; ordem: number }

const CAMADAS = ['simbolo', 'logotipo', 'assinatura', 'sombra', 'refx'] as const

function hash(texto: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** Nomes que o Illustrator/Figma gera sozinhos (nao sao camadas do Vini) */
const GENERICOS = /^(layer|camada|group|grupo|path|rect|cls|svg|artboard|prancheta|clippath|clip|mask|mascara|linear|radial|gradient|g)?$/

/**
 * Camada do Illustrator -> valor de data-camada.
 * Nomes reconhecidos ("Símbolo_1", "ref-x", "_x5F_sombra") viram o slug fixo;
 * qualquer outro nome dado a mao ("cereja", "bloom") vira uma parte com esse nome.
 */
function nomeDeCamada(bruto: string | null): string | null {
  if (!bruto) return null
  const legivel = bruto
    .replace(/_x([0-9A-F]{2})_/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/[_-]+\d*$/, '')
    .replace(/_/g, ' ')
    .trim()
  const n = legivel
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  const conhecida = CAMADAS.find((c) => n.startsWith(c))
  if (conhecida) return conhecida
  if (GENERICOS.test(n)) return null
  return `nome:${legivel}`
}

export function limparSvg(texto: string): SvgLimpo {
  const seguro = DOMPurify.sanitize(texto, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['foreignObject', 'script', 'a'],
  })
  const doc = new DOMParser().parseFromString(seguro, 'image/svg+xml')
  const raiz = doc.querySelector('svg')
  if (!raiz) throw new Error('Arquivo sem <svg>')

  const prefixo = `m${hash(texto)}`

  // links externos fora (so ancoras internas e imagens embutidas)
  for (const el of Array.from(raiz.querySelectorAll('*'))) {
    for (const attr of ['href', 'xlink:href']) {
      const v = el.getAttribute(attr)
      if (v && !v.startsWith('#') && !/^data:image\/(png|jpe?g|gif|webp);/i.test(v)) el.removeAttribute(attr)
    }
  }

  // guarda o nome da camada antes de prefixar
  for (const el of Array.from(raiz.querySelectorAll('[id], [data-name]'))) {
    const camada = nomeDeCamada(el.getAttribute('data-name')) || nomeDeCamada(el.getAttribute('id'))
    if (camada) el.setAttribute('data-camada', camada)
  }

  // prefixo em ids e referencias
  const ids = new Map<string, string>()
  for (const el of Array.from(raiz.querySelectorAll('[id]'))) {
    const id = el.getAttribute('id')!
    ids.set(id, `${prefixo}-${id}`)
    el.setAttribute('id', `${prefixo}-${id}`)
  }
  const trocarRefs = (v: string) => v.replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id) => (ids.has(id) ? `url(#${ids.get(id)})` : m))
  for (const el of Array.from(raiz.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.value.includes('url(')) el.setAttribute(attr.name, trocarRefs(attr.value))
      if ((attr.name === 'href' || attr.name === 'xlink:href') && attr.value.startsWith('#') && ids.has(attr.value.slice(1))) {
        el.setAttribute(attr.name, `#${ids.get(attr.value.slice(1))}`)
      }
    }
    const classe = el.getAttribute('class')
    if (classe) el.setAttribute('class', classe.split(/\s+/).filter(Boolean).map((c) => `${prefixo}-${c}`).join(' '))
  }
  for (const estilo of Array.from(raiz.querySelectorAll('style'))) {
    estilo.textContent = trocarRefs(estilo.textContent || '')
      .replace(/\.(-?[_a-zA-Z][\w-]*)/g, `.${prefixo}-$1`)
      .replace(/#([_a-zA-Z][\w-]*)/g, (m, id) => (ids.has(id) ? `#${ids.get(id)}` : m))
  }

  // viewBox (ou width/height, se o arquivo nao tiver viewBox)
  const vb = (raiz.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number)
  const viewBox: Caixa =
    vb.length === 4 && vb.every((n) => Number.isFinite(n))
      ? { x: vb[0], y: vb[1], w: vb[2], h: vb[3] }
      : { x: 0, y: 0, w: parseFloat(raiz.getAttribute('width') || '100'), h: parseFloat(raiz.getAttribute('height') || '100') }

  return { conteudo: raiz.innerHTML, viewBox, prefixo }
}

const FORMAS = 'path, rect, circle, ellipse, polygon, polyline, line, text, image, use'
const FORA = 'defs, clipPath, mask, symbol, pattern, marker'

/** Mede cada forma visivel em unidades do viewBox. Precisa do DOM (navegador). */
export function lerFormas(svg: SvgLimpo): Forma[] {
  const ns = 'http://www.w3.org/2000/svg'
  const caixa = document.createElement('div')
  // opacity (e nao visibility:hidden, que as formas herdariam e o filtro abaixo descartaria)
  caixa.style.cssText = 'position:fixed;left:-20000px;top:0;width:1000px;opacity:0;pointer-events:none'
  const raiz = document.createElementNS(ns, 'svg')
  raiz.setAttribute('viewBox', `${svg.viewBox.x} ${svg.viewBox.y} ${svg.viewBox.w} ${svg.viewBox.h}`)
  raiz.setAttribute('width', '1000')
  raiz.innerHTML = svg.conteudo
  caixa.appendChild(raiz)
  document.body.appendChild(caixa)

  try {
    const paraRaiz = raiz.getScreenCTM()?.inverse()
    if (!paraRaiz) return []
    const formas: Forma[] = []
    Array.from(raiz.querySelectorAll<SVGGraphicsElement>(FORMAS)).forEach((el, ordem) => {
      if (el.closest(FORA)) return
      const estilo = getComputedStyle(el)
      if (estilo.display === 'none' || estilo.visibility === 'hidden' || Number(estilo.opacity) === 0) return
      const semCor = (v: string) => !v || v === 'none' || v === 'transparent' || v === 'rgba(0, 0, 0, 0)'
      if (semCor(estilo.fill) && semCor(estilo.stroke) && el.tagName !== 'image' && el.tagName !== 'use') return

      const bb = el.getBBox()
      if (bb.width === 0 && bb.height === 0) return
      const ctm = el.getScreenCTM()
      if (!ctm) return
      const m = paraRaiz.multiply(ctm)
      const cantos = [
        [bb.x, bb.y],
        [bb.x + bb.width, bb.y],
        [bb.x, bb.y + bb.height],
        [bb.x + bb.width, bb.y + bb.height],
      ].map(([px, py]) => new DOMPoint(px, py).matrixTransform(m))
      const xs = cantos.map((p) => p.x)
      const ys = cantos.map((p) => p.y)
      const x0 = Math.min(...xs)
      const y0 = Math.min(...ys)
      formas.push({
        caixa: { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 },
        cor: semCor(estilo.fill) ? estilo.stroke : estilo.fill,
        camada: el.closest('[data-camada]')?.getAttribute('data-camada') || null,
        ordem,
      })
    })
    return formas
  } finally {
    caixa.remove()
  }
}

const NOMES: Record<string, string> = {
  simbolo: 'Símbolo',
  logotipo: 'Logotipo',
  assinatura: 'Assinatura',
  sombra: 'Sombra',
  refx: 'Referência x',
}

function contem(fora: Caixa, dentro: Caixa, folga: number) {
  return (
    dentro.x >= fora.x - folga &&
    dentro.y >= fora.y - folga &&
    dentro.x + dentro.w <= fora.x + fora.w + folga &&
    dentro.y + dentro.h <= fora.y + fora.h + folga
  )
}

/** Junta formas cujas caixas (aumentadas em `distancia`/2) se tocam */
function agruparPorProximidade(formas: Forma[], distancia: number): Forma[][] {
  const pai = formas.map((_, i) => i)
  const achar = (i: number): number => (pai[i] === i ? i : (pai[i] = achar(pai[i])))
  const d = distancia / 2
  for (let i = 0; i < formas.length; i++) {
    for (let j = i + 1; j < formas.length; j++) {
      const a = formas[i].caixa
      const b = formas[j].caixa
      const tocam = a.x - d <= b.x + b.w + d && b.x - d <= a.x + a.w + d && a.y - d <= b.y + b.h + d && b.y - d <= a.y + a.h + d
      if (tocam) pai[achar(i)] = achar(j)
    }
  }
  const grupos = new Map<number, Forma[]>()
  formas.forEach((f, i) => grupos.set(achar(i), [...(grupos.get(achar(i)) || []), f]))
  return [...grupos.values()]
}

/**
 * Formas -> partes.
 * `proximidade`: fracao do maior lado da marca abaixo da qual formas viram uma parte so.
 */
export function agruparPartes(formas: Forma[], proximidade: number): Parte[] {
  if (!formas.length) return []
  const partes: Parte[] = []
  const geral = uniao(formas.map((f) => f.caixa))

  // 1) camadas nomeadas
  const nomeadas = formas.filter((f) => f.camada)
  for (const camada of [...new Set(nomeadas.map((f) => f.camada!))]) {
    const doGrupo = nomeadas.filter((f) => f.camada === camada)
    const livre = camada.startsWith('nome:')
    partes.push({
      id: livre ? `c-${camada.slice(5).toLowerCase().replace(/\W+/g, '-')}` : camada,
      nome: livre ? camada.slice(5) : NOMES[camada] || camada,
      papel: camada === 'sombra' ? 'sombra' : camada === 'refx' ? 'refx' : 'parte',
      caixa: uniao(doGrupo.map((f) => f.caixa)),
      cor: doGrupo[0].cor,
    })
  }
  let resto = formas.filter((f) => !f.camada)

  // 2) sombra pela cor: a cor que fica atras e envolve todas as outras
  if (!partes.some((p) => p.papel === 'sombra')) {
    const cores = [...new Set(resto.map((f) => f.cor))]
    if (cores.length >= 2) {
      const folga = Math.max(geral.w, geral.h) * 0.01
      const candidata = cores
        .map((cor) => ({ cor, formas: resto.filter((f) => f.cor === cor) }))
        .filter(({ cor, formas: daCor }) => {
          const outras = resto.filter((f) => f.cor !== cor)
          return contem(uniao(daCor.map((f) => f.caixa)), uniao(outras.map((f) => f.caixa)), folga)
        })
        .sort((a, b) => Math.min(...a.formas.map((f) => f.ordem)) - Math.min(...b.formas.map((f) => f.ordem)))[0]
      if (candidata) {
        partes.push({ id: 'sombra', nome: 'Sombra', papel: 'sombra', caixa: uniao(candidata.formas.map((f) => f.caixa)), cor: candidata.cor })
        resto = resto.filter((f) => f.cor !== candidata.cor)
      }
    }
  }

  // 3) o resto vira partes por proximidade, em ordem de leitura
  const grupos = agruparPorProximidade(resto, Math.max(geral.w, geral.h) * proximidade)
    .map((g) => ({ caixa: uniao(g.map((f) => f.caixa)), cor: g[0].cor }))
    .sort((a, b) => {
      const mesmaLinha = Math.abs(a.caixa.y + a.caixa.h / 2 - (b.caixa.y + b.caixa.h / 2)) < Math.min(a.caixa.h, b.caixa.h) / 2
      return mesmaLinha ? a.caixa.x - b.caixa.x : a.caixa.y - b.caixa.y
    })
  grupos.forEach((g, i) => partes.push({ id: `p${i + 1}`, nome: `Parte ${i + 1}`, papel: 'parte', caixa: g.caixa, cor: g.cor }))

  return partes
}
