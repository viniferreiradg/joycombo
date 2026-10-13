// Usos incorretos gerados a partir da versao de referencia, so com
// transformacoes SVG (nada e medido aqui). Serve no painel e na pagina.
import type { SvgSalvo, TipoIncorreto } from '@/lib/manuais/marcas'
import type { Caixa, Medicao } from '@/lib/manuais/medicao'

/** Cores berrantes, fora de qualquer paleta, para a "distorcao de cores" */
const BERRANTES = ['#8BA03A', '#E6007E', '#FFE600', '#00B3E6', '#FF7A00']

/**
 * Classes proprias para esta copia: todas as copias da mesma marca na pagina
 * dividem os nomes de classe, e o <style> de uma vale para todas. Sem isso, a
 * troca de cores sumiria (ou pintaria as outras copias).
 */
function classesProprias(conteudo: string, sufixo: string): string {
  return conteudo
    .replace(/class="([^"]*)"/g, (_, c: string) => `class="${c.split(/\s+/).filter(Boolean).map((t) => `${t}${sufixo}`).join(' ')}"`)
    .replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (_, attrs: string, css: string) => `<style${attrs}>${css.replace(/\.(-?[_a-zA-Z][\w-]*)/g, `.$1${sufixo}`)}</style>`)
}

function trocarCores(conteudo: string, sufixo: string): string {
  const vistas: string[] = []
  return classesProprias(conteudo, sufixo).replace(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, (hex) => {
    const k = hex.toLowerCase()
    let i = vistas.indexOf(k)
    if (i < 0) {
      vistas.push(k)
      i = vistas.length - 1
    }
    return BERRANTES[i % BERRANTES.length]
  })
}

function primeiraCor(conteudo: string): string {
  return conteudo.match(/#[0-9a-f]{6}\b/i)?.[0] || '#111111'
}

/** Marca desenhada nas proprias coordenadas (o SVG por fora usa o mesmo sistema) */
function Marca({ svg, conteudo }: { svg: SvgSalvo; conteudo?: string }) {
  const vb = svg.viewBox
  return <svg x={vb.x} y={vb.y} width={vb.w} height={vb.h} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} overflow="visible" dangerouslySetInnerHTML={{ __html: conteudo ?? svg.conteudo }} />
}

const comFolga = (c: Caixa, f = 0.06): Caixa => {
  const d = Math.max(c.w, c.h) * f
  return { x: c.x - d, y: c.y - d, w: c.w + d * 2, h: c.h + d * 2 }
}

/**
 * Um uso incorreto. `id` precisa ser unico na pagina (clipPath, filtro, estilo).
 * `medicao` (opcional) ajuda a separacao a abrir o espaco entre as partes.
 * `contraste`: cor parecida com a marca, para "fundo sem contraste".
 */
export function DesenhoIncorreto({ id, tipo, svg, medicao, contraste }: { id: string; tipo: TipoIncorreto; svg: SvgSalvo; medicao?: Medicao | null; contraste?: string }) {
  const vb = svg.viewBox
  const cx = vb.x + vb.w / 2
  const cy = vb.y + vb.h / 2
  let caixa: Caixa = vb
  let corpo: React.ReactNode = <Marca svg={svg} />
  let extra: React.ReactNode = null

  switch (tipo) {
    case 'condensacao':
      corpo = <g transform={`translate(${cx} 0) scale(0.65 1) translate(${-cx} 0)`}>{corpo}</g>
      break
    case 'expansao':
      caixa = { x: cx - vb.w * 0.75, y: cy - vb.h * 0.35, w: vb.w * 1.5, h: vb.h * 0.7 }
      corpo = <g transform={`translate(${cx} ${cy}) scale(1.5 0.7) translate(${-cx} ${-cy})`}>{corpo}</g>
      break
    case 'cores':
      corpo = <Marca svg={svg} conteudo={trocarCores(svg.conteudo, `-${id}`)} />
      break
    case 'separacao': {
      // corta no maior espaco vazio entre partes; sem espaco, no meio
      const vazios = (medicao?.segmentos || []).filter((s) => s.eixo === 'h' && s.vazio).sort((a, b) => b.ate - b.de - (a.ate - a.de))
      const corte = vazios[0] ? (vazios[0].de + vazios[0].ate) / 2 : cx
      const dx = vb.w * 0.16
      caixa = { ...vb, w: vb.w + dx }
      extra = (
        <defs>
          <clipPath id={`${id}-a`}>
            <rect x={vb.x - vb.w} y={vb.y - vb.h} width={corte - vb.x + vb.w} height={vb.h * 3} />
          </clipPath>
          <clipPath id={`${id}-b`}>
            <rect x={corte} y={vb.y - vb.h} width={vb.w * 2} height={vb.h * 3} />
          </clipPath>
        </defs>
      )
      corpo = (
        <>
          <g clipPath={`url(#${id}-a)`}>{corpo}</g>
          <g transform={`translate(${dx} 0)`}>
            <g clipPath={`url(#${id}-b)`}>
              <Marca svg={svg} />
            </g>
          </g>
        </>
      )
      break
    }
    case 'diagonal': {
      const a = (20 * Math.PI) / 180
      const w = vb.w * Math.cos(a) + vb.h * Math.sin(a)
      const h = vb.w * Math.sin(a) + vb.h * Math.cos(a)
      caixa = { x: cx - w / 2, y: cy - h / 2, w, h }
      corpo = <g transform={`rotate(-20 ${cx} ${cy})`}>{corpo}</g>
      break
    }
    case 'contorno':
      extra = <style>{`#${id} *{fill:none!important;stroke:${primeiraCor(svg.conteudo)}!important;stroke-width:${Math.max(vb.w, vb.h) * 0.006}px!important}`}</style>
      corpo = <g id={id}>{corpo}</g>
      break
    case 'sombra': {
      const d = Math.max(vb.w, vb.h)
      extra = (
        <defs>
          <filter id={`${id}-f`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={d * 0.02} dy={d * 0.03} stdDeviation={d * 0.02} floodColor="#000000" floodOpacity={0.45} />
          </filter>
        </defs>
      )
      corpo = <g filter={`url(#${id}-f)`}>{corpo}</g>
      break
    }
    case 'contraste':
      break
    case 'personalizado':
      break
  }

  const fora = comFolga(caixa)
  return (
    <svg viewBox={`${fora.x} ${fora.y} ${fora.w} ${fora.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {extra}
      {tipo === 'contraste' && contraste ? <rect x={fora.x} y={fora.y} width={fora.w} height={fora.h} fill={contraste} /> : null}
      {corpo}
    </svg>
  )
}

/** Marca inteira, sem transformacao (uso correto e personalizado) */
export function DesenhoSimples({ svg }: { svg: SvgSalvo }) {
  const fora = comFolga(svg.viewBox)
  return (
    <svg viewBox={`${fora.x} ${fora.y} ${fora.w} ${fora.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <Marca svg={svg} />
    </svg>
  )
}

/**
 * Cor de "fundo sem contraste": a cor da paleta mais parecida com a marca
 * (diferente dela); sem paleta, a cor da marca clareada.
 */
export function corSemContraste(svg: SvgSalvo, paleta: string[]): string {
  const marca = primeiraCor(svg.conteudo).toUpperCase()
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const dist = (a: string, b: string) => rgb(a).reduce((s, v, i) => s + (v - rgb(b)[i]) ** 2, 0)
  const outras = paleta.map((p) => p.toUpperCase()).filter((p) => p !== marca && dist(p, marca) > 200)
  const perto = outras.sort((a, b) => dist(a, marca) - dist(b, marca))[0]
  if (perto && dist(perto, marca) < 30000) return perto
  const [r, g, b] = rgb(marca).map((v) => Math.round(v + (255 - v) * 0.35))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
