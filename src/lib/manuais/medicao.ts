// Motor de medicao dos manuais de marca: a parte pura (sem DOM).
// Recebe as caixas das partes da marca (medidas no navegador, em unidades do
// viewBox do SVG) e a configuracao do lockup, e devolve tudo que os
// diagramas precisam: unidade x, caixa total, cotas e margens.
// Sempre recalcula do zero a partir das entradas.

export type Caixa = { x: number; y: number; w: number; h: number }

/** parte: entra nas medidas; sombra: entra so se `considerarSombra`; refx: altura de referencia do x */
export type Papel = 'parte' | 'sombra' | 'refx' | 'ignorar'

export type Parte = { id: string; nome: string; papel: Papel; caixa: Caixa; cor?: string }

/** Base do x: altura/largura total, altura de uma parte ('parte:<id>') ou a camada ref-x */
export type BaseX = 'total-h' | 'total-w' | 'refx' | `parte:${string}`

export type Margens = { topo: number; direita: number; base: number; esquerda: number }

export type ConfigLockup = {
  considerarSombra: boolean
  baseX: BaseX
  /** x = medida da base / divisor */
  divisor: number
  /**
   * x vindo do arquivo de referencia do manual (mesmo x em todas as versoes).
   * Quando existe, baseX/divisor sao ignorados.
   */
  xFixo?: number
  /** bordas mais proximas que isso (em x) viram uma so */
  tolerancia: number
  margens: Margens
  /** false = cada lado com o seu valor (ajuste otico); padrao: os 4 iguais */
  margensIguais?: boolean
  /** ids de segmentos ocultos */
  ocultos: string[]
  /** rotulo manual por id de segmento */
  rotulos: Record<string, string>
}

export type Segmento = {
  id: string
  eixo: 'h' | 'v'
  de: number
  ate: number
  /** tamanho em x */
  valor: number
  rotulo: string
  /** intervalo sem nenhuma parte (espacamento): ganha faixa cinza */
  vazio: boolean
  oculto: boolean
}

export type Medicao = {
  total: Caixa
  x: number
  /** bordas (ja fundidas) usadas nas linhas-guia */
  bordasX: number[]
  bordasY: number[]
  segmentos: Segmento[]
  largura: Segmento
  altura: Segmento
  margens: Margens
}

export const CONFIG_PADRAO: ConfigLockup = {
  considerarSombra: true,
  baseX: 'total-h',
  divisor: 4,
  tolerancia: 0.1,
  margens: { topo: 1.5, direita: 1.5, base: 1.5, esquerda: 1.5 },
  ocultos: [],
  rotulos: {},
}

export function uniao(caixas: Caixa[]): Caixa {
  if (!caixas.length) return { x: 0, y: 0, w: 0, h: 0 }
  const x0 = Math.min(...caixas.map((c) => c.x))
  const y0 = Math.min(...caixas.map((c) => c.y))
  const x1 = Math.max(...caixas.map((c) => c.x + c.w))
  const y1 = Math.max(...caixas.map((c) => c.y + c.h))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Arredonda a 0,05 e escreve com virgula, sem zeros sobrando: 3,45x / 1,5x / 4x */
export function formatX(valor: number): string {
  const v = Math.round(valor * 20) / 20
  return `${v.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}x`
}

/** Funde bordas proximas. Se o grupo tem uma borda fixa (da caixa total), ela vence. */
export function fundirBordas(bordas: number[], tolerancia: number, fixas: number[]): number[] {
  const ordenadas = [...new Set(bordas)].sort((a, b) => a - b)
  const grupos: number[][] = []
  for (const b of ordenadas) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && b - ultimo[ultimo.length - 1] <= tolerancia) ultimo.push(b)
    else grupos.push([b])
  }
  return grupos.map((g) => {
    const fixa = g.find((b) => fixas.some((f) => Math.abs(f - b) < 1e-9))
    return fixa ?? g.reduce((a, b) => a + b, 0) / g.length
  })
}

export function medidaDoX(partes: Parte[], total: Caixa, baseX: BaseX, divisor: number, xFixo?: number): number {
  if (xFixo && xFixo > 0) return xFixo
  const n = divisor > 0 ? divisor : 1
  if (baseX === 'total-w') return total.w / n
  if (baseX === 'refx') {
    const ref = partes.find((p) => p.papel === 'refx')
    return (ref ? ref.caixa.h : total.h) / n
  }
  if (baseX.startsWith('parte:')) {
    const parte = partes.find((p) => p.id === baseX.slice(6))
    return (parte ? parte.caixa.h : total.h) / n
  }
  return total.h / n
}

function segmentosDoEixo(eixo: 'h' | 'v', bordas: number[], intervalos: [number, number][], x: number, cfg: ConfigLockup): Segmento[] {
  const lista: Segmento[] = []
  for (let i = 0; i < bordas.length - 1; i++) {
    const de = bordas[i]
    const ate = bordas[i + 1]
    const tamanho = ate - de
    if (tamanho <= 0) continue
    // coberto se alguma parte ocupa mais da metade do intervalo
    const coberto = intervalos.some(([a, b]) => Math.min(b, ate) - Math.max(a, de) > tamanho * 0.5)
    const id = `${eixo}${i + 1}`
    lista.push({
      id,
      eixo,
      de,
      ate,
      valor: tamanho / x,
      rotulo: cfg.rotulos[id] || formatX(tamanho / x),
      vazio: !coberto,
      oculto: cfg.ocultos.includes(id),
    })
  }
  return lista
}

export function medir(partes: Parte[], cfg: ConfigLockup): Medicao {
  const visiveis = partes.filter((p) => p.papel === 'parte' || (p.papel === 'sombra' && cfg.considerarSombra))
  const total = uniao(visiveis.map((p) => p.caixa))
  const x = medidaDoX(partes, total, cfg.baseX, cfg.divisor, cfg.xFixo) || 1
  const tol = cfg.tolerancia * x

  const bordasX = fundirBordas(
    visiveis.flatMap((p) => [p.caixa.x, p.caixa.x + p.caixa.w]),
    tol,
    [total.x, total.x + total.w],
  )
  const bordasY = fundirBordas(
    visiveis.flatMap((p) => [p.caixa.y, p.caixa.y + p.caixa.h]),
    tol,
    [total.y, total.y + total.h],
  )

  const segmentos = [
    ...segmentosDoEixo('h', bordasX, visiveis.map((p) => [p.caixa.x, p.caixa.x + p.caixa.w]), x, cfg),
    ...segmentosDoEixo('v', bordasY, visiveis.map((p) => [p.caixa.y, p.caixa.y + p.caixa.h]), x, cfg),
  ]
  const totalSeg = (id: string, eixo: 'h' | 'v', de: number, ate: number): Segmento => ({
    id,
    eixo,
    de,
    ate,
    valor: (ate - de) / x,
    rotulo: cfg.rotulos[id] || formatX((ate - de) / x),
    vazio: false,
    oculto: false,
  })

  return {
    total,
    x,
    bordasX,
    bordasY,
    segmentos,
    largura: totalSeg('largura', 'h', total.x, total.x + total.w),
    altura: totalSeg('altura', 'v', total.y, total.y + total.h),
    margens: cfg.margens,
  }
}
