// Diagramas tecnicos do manual (dimensoes e area de seguranca).
// So desenham a partir da medicao ja calculada; nao medem nada.
// Tudo em px de desenho (pagina 1920x1080); o SVG escala com a pagina.
import type { Caixa, Medicao, Segmento } from '@/lib/manuais/medicao'
import { formatX } from '@/lib/manuais/medicao'

export const COR_COTA = '#00aeef'
const FAIXA = '#eceef0'
const GUIA = 'rgba(0, 174, 239, 0.35)'
const FONTE = 'Sora, sans-serif'
const LETRA = 15
const LINHA = 30

type Marca = { conteudo: string; viewBox: Caixa }

/** Desenha a marca com a caixa `area` (unidades do SVG) ocupando o retangulo em px */
function MarcaSvg({ marca, area, x, y, k }: { marca: Marca; area: Caixa; x: number; y: number; k: number }) {
  const vb = marca.viewBox
  return (
    <svg
      x={x + (vb.x - area.x) * k}
      y={y + (vb.y - area.y) * k}
      width={vb.w * k}
      height={vb.h * k}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      overflow="visible"
      dangerouslySetInnerHTML={{ __html: marca.conteudo }}
    />
  )
}

const larguraTexto = (t: string) => t.length * LETRA * 0.62 + 10

/** Distribui rotulos em fileiras para nao se sobreporem (o primeiro que cabe) */
function emFileiras(itens: { centro: number; tamanho: number }[]): number[] {
  const fimDaFileira: number[] = []
  return itens.map(({ centro, tamanho }) => {
    const ini = centro - tamanho / 2
    let f = fimDaFileira.findIndex((fim) => fim <= ini)
    if (f === -1) {
      f = fimDaFileira.length
      fimDaFileira.push(0)
    }
    fimDaFileira[f] = centro + tamanho / 2
    return f
  })
}

function Cota({ x1, y1, x2, y2, rotulo, lado }: { x1: number; y1: number; x2: number; y2: number; rotulo: string; lado: 'cima' | 'baixo' | 'esq' | 'dir' }) {
  const horizontal = y1 === y2
  const t = 6
  const tx = horizontal ? (x1 + x2) / 2 : lado === 'esq' ? x1 - 10 : x1 + 10
  const ty = horizontal ? (lado === 'cima' ? y1 - 8 : y1 + LETRA + 6) : (y1 + y2) / 2 + LETRA * 0.35
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COR_COTA} strokeWidth={1.2} />
      {horizontal ? (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} stroke={COR_COTA} strokeWidth={1.2} />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} stroke={COR_COTA} strokeWidth={1.2} />
        </>
      ) : (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} stroke={COR_COTA} strokeWidth={1.2} />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} stroke={COR_COTA} strokeWidth={1.2} />
        </>
      )}
      <text
        x={tx}
        y={ty}
        fill={COR_COTA}
        fontFamily={FONTE}
        fontSize={LETRA}
        textAnchor={horizontal ? 'middle' : lado === 'esq' ? 'end' : 'start'}
      >
        {rotulo}
      </text>
    </g>
  )
}

/**
 * Dimensoes: cotas horizontais em cima, verticais a esquerda, largura total
 * embaixo, altura total a direita; faixas cinza nos espacamentos.
 */
export function DiagramaDimensoes({ marca, medicao, largura = 900, altura = 640 }: { marca: Marca; medicao: Medicao; largura?: number; altura?: number }) {
  const { total } = medicao
  const visiveis = (eixo: 'h' | 'v') => medicao.segmentos.filter((s) => s.eixo === eixo && !s.oculto)
  // um segmento so igual ao total ja aparece na cota total
  const cotasH = visiveis('h').length > 1 ? visiveis('h') : []
  const cotasV = visiveis('v').length > 1 ? visiveis('v') : []

  // espaco das cotas em volta da marca (estimado antes de saber a escala)
  const fileirasH = cotasH.length ? Math.min(4, cotasH.length) : 0
  const colunaV = cotasV.length ? Math.max(...cotasV.map((s) => larguraTexto(s.rotulo))) + 30 : 0
  const margem = { topo: fileirasH * LINHA + 20, esq: colunaV + 20, base: 60, dir: larguraTexto(medicao.altura.rotulo) + 40 }
  const k = Math.min((largura - margem.esq - margem.dir) / total.w, (altura - margem.topo - margem.base) / total.h)
  const ox = margem.esq + (largura - margem.esq - margem.dir - total.w * k) / 2
  const oy = margem.topo + (altura - margem.topo - margem.base - total.h * k) / 2
  const X = (u: number) => ox + (u - total.x) * k
  const Y = (u: number) => oy + (u - total.y) * k
  const W = total.w * k
  const H = total.h * k

  const fileiras = emFileiras(cotasH.map((s) => ({ centro: (X(s.de) + X(s.ate)) / 2, tamanho: larguraTexto(s.rotulo) })))
  const colunas = emFileiras(cotasV.map((s) => ({ centro: (Y(s.de) + Y(s.ate)) / 2, tamanho: LETRA + 8 })))
  const larguraColuna = colunaV

  const faixa = (s: Segmento) =>
    s.eixo === 'h' ? (
      <rect key={s.id} x={X(s.de)} y={oy} width={X(s.ate) - X(s.de)} height={H} fill={FAIXA} />
    ) : (
      <rect key={s.id} x={ox} y={Y(s.de)} width={W} height={Y(s.ate) - Y(s.de)} fill={FAIXA} />
    )

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {medicao.segmentos.filter((s) => s.vazio && !s.oculto).map(faixa)}
      <MarcaSvg marca={marca} area={total} x={ox} y={oy} k={k} />
      {/* linhas-guia nas bordas */}
      {medicao.bordasX.map((b) => (
        <line key={`gx${b}`} x1={X(b)} y1={oy - (fileirasH ? 12 : 0) - Math.max(0, ...fileiras) * LINHA} x2={X(b)} y2={oy + H + 22} stroke={GUIA} strokeWidth={1} />
      ))}
      {medicao.bordasY.map((b) => (
        <line key={`gy${b}`} x1={ox - 14 - Math.max(0, ...colunas) * larguraColuna} y1={Y(b)} x2={ox + W + 22} y2={Y(b)} stroke={GUIA} strokeWidth={1} />
      ))}
      {cotasH.map((s, i) => {
        const y = oy - 14 - fileiras[i] * LINHA
        return <Cota key={s.id} x1={X(s.de)} y1={y} x2={X(s.ate)} y2={y} rotulo={s.rotulo} lado="cima" />
      })}
      {cotasV.map((s, i) => {
        const x = ox - 16 - colunas[i] * larguraColuna
        return <Cota key={s.id} x1={x} y1={Y(s.de)} x2={x} y2={Y(s.ate)} rotulo={s.rotulo} lado="esq" />
      })}
      <Cota x1={ox} y1={oy + H + 22} x2={ox + W} y2={oy + H + 22} rotulo={medicao.largura.rotulo} lado="baixo" />
      <Cota x1={ox + W + 22} y1={oy} x2={ox + W + 22} y2={oy + H} rotulo={medicao.altura.rotulo} lado="dir" />
    </svg>
  )
}

/**
 * Area de seguranca: caixa da marca, retangulo externo pelas margens,
 * quadradinhos nos cantos e o valor de cada margem.
 */
export function DiagramaSeguranca({ marca, medicao, largura = 900, altura = 640 }: { marca: Marca; medicao: Medicao; largura?: number; altura?: number }) {
  const { total, x, margens } = medicao
  const fora: Caixa = {
    x: total.x - margens.esquerda * x,
    y: total.y - margens.topo * x,
    w: total.w + (margens.esquerda + margens.direita) * x,
    h: total.h + (margens.topo + margens.base) * x,
  }
  const folga = 40
  const k = Math.min((largura - folga * 2) / fora.w, (altura - folga * 2) / fora.h)
  const ox = (largura - fora.w * k) / 2
  const oy = (altura - fora.h * k) / 2
  const X = (u: number) => ox + (u - fora.x) * k
  const Y = (u: number) => oy + (u - fora.y) * k
  const m = { t: margens.topo * x * k, r: margens.direita * x * k, b: margens.base * x * k, l: margens.esquerda * x * k }
  const ix = X(total.x)
  const iy = Y(total.y)
  const iw = total.w * k
  const ih = total.h * k
  const ow = fora.w * k
  const oh = fora.h * k

  const rotulo = (v: number, cx: number, cy: number) => (
    <text x={cx} y={cy + LETRA * 0.35} fill={COR_COTA} fontFamily={FONTE} fontSize={LETRA} textAnchor="middle">
      {formatX(v)}
    </text>
  )
  const canto = (cx: number, cy: number, w: number, h: number, chave: string) => (
    <rect key={chave} x={cx} y={cy} width={w} height={h} fill="none" stroke={COR_COTA} strokeWidth={1.2} />
  )

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {/* cinza so na faixa das margens (retangulo externo menos a caixa da marca) */}
      <path d={`M${ox} ${oy}h${ow}v${oh}h${-ow}Z M${ix} ${iy}v${ih}h${iw}v${-ih}Z`} fill={FAIXA} fillRule="evenodd" />
      <rect x={ix} y={iy} width={iw} height={ih} fill="none" stroke={COR_COTA} strokeWidth={1} strokeDasharray="5 4" />
      <MarcaSvg marca={marca} area={total} x={ix} y={iy} k={k} />
      <rect x={ox} y={oy} width={ow} height={oh} fill="none" stroke={COR_COTA} strokeWidth={1.2} />
      {canto(ox, oy, m.l, m.t, 'a')}
      {canto(ix + iw, oy, m.r, m.t, 'b')}
      {canto(ox, iy + ih, m.l, m.b, 'c')}
      {canto(ix + iw, iy + ih, m.r, m.b, 'd')}
      {rotulo(margens.topo, ix + iw / 2, oy + m.t / 2)}
      {rotulo(margens.base, ix + iw / 2, iy + ih + m.b / 2)}
      {rotulo(margens.esquerda, ox + m.l / 2, iy + ih / 2)}
      {rotulo(margens.direita, ix + iw + m.r / 2, iy + ih / 2)}
    </svg>
  )
}

/**
 * Legenda da unidade x: o desenho da referencia (ex.: o "c" da marca) com a
 * cota "x" na altura dele; sem referencia, um quadradinho "x".
 * `caixa` e o contorno real do desenho (o viewBox pode ter sobra).
 */
export function LegendaX({ texto, referencia }: { texto: string; referencia?: { marca: Marca; caixa: Caixa } }) {
  if (!referencia) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6b6b6b', fontSize: 15 }}>
        <svg width={28} height={28} viewBox="0 0 28 28" style={{ flex: 'none' }}>
          <rect x={1} y={1} width={26} height={26} fill="none" stroke={COR_COTA} strokeWidth={1.2} />
          <text x={14} y={19} fill={COR_COTA} fontFamily={FONTE} fontSize={14} textAnchor="middle">
            x
          </text>
        </svg>
        <span>{texto}</span>
      </div>
    )
  }
  const { caixa } = referencia
  const alto = 48
  const k = alto / caixa.h
  const largo = caixa.w * k
  const cota = 30
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#6b6b6b', fontSize: 15 }}>
      <svg width={largo + cota} height={alto + 2} viewBox={`0 -1 ${largo + cota} ${alto + 2}`} style={{ flex: 'none', overflow: 'visible' }}>
        <line x1={10} y1={0} x2={10} y2={alto} stroke={COR_COTA} strokeWidth={1.2} />
        <line x1={5} y1={0} x2={15} y2={0} stroke={COR_COTA} strokeWidth={1.2} />
        <line x1={5} y1={alto} x2={15} y2={alto} stroke={COR_COTA} strokeWidth={1.2} />
        <text x={0} y={alto / 2 + 5} fill={COR_COTA} fontFamily={FONTE} fontSize={15} textAnchor="end">
          x
        </text>
        <MarcaSvg marca={referencia.marca} area={caixa} x={cota} y={0} k={k} />
      </svg>
      <span>{texto}</span>
    </div>
  )
}
