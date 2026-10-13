'use client'

// Fase 1: laboratorio do motor de medicao. Nao salva nada: solta um ou mais
// SVGs, ajusta as partes, o x e as margens, e ve os diagramas de dimensoes
// e area de seguranca numa pagina 16:9 do manual.
import { useEffect, useMemo, useRef, useState } from 'react'
import { DiagramaDimensoes, DiagramaSeguranca, LegendaX, COR_COTA } from '@/components/manuais/Diagramas'
import { type BaseX, type Caixa, type ConfigLockup, type Margens, type Papel, CONFIG_PADRAO, formatX, medir, uniao } from '@/lib/manuais/medicao'
import { type Forma, type SvgLimpo, agruparPartes, lerFormas, limparSvg } from '@/lib/manuais/svg'

const REF_X = /(^|[-_ ])(ref-?x|referencia-?x|unidade-?x|x)\.svg$/i

type Arquivo = { nome: string; svg: SvgLimpo; formas: Forma[] }

const cinza = 'var(--theme-elevation-500)'
const borda = '1px solid var(--theme-elevation-150)'
const input: React.CSSProperties = {
  background: 'var(--theme-input-bg)',
  border: borda,
  borderRadius: 4,
  color: 'var(--theme-text)',
  padding: '6px 8px',
  fontSize: 13,
  // sem isso os campos tem largura minima propria e estouram a coluna
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}

/** Luminancia de "rgb(r, g, b)" ou "#rrggbb" (0 a 1) */
function luminancia(cor?: string): number {
  if (!cor) return 0
  const n = cor.startsWith('#')
    ? [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16))
    : (cor.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
  if (n.length < 3) return 0
  return (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / 255
}

/** Pagina 16:9 desenhada em 1920x1080 e escalada para a largura disponivel */
function Pagina16x9({ fundo, children }: { fundo: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0.4)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setEscala(e.contentRect.width / 1920))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ width: '100%', aspectRatio: '16 / 9', position: 'relative', overflow: 'hidden', border: borda }}>
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${escala})`,
          transformOrigin: '0 0',
          background: fundo,
          color: luminancia(fundo) < 0.5 ? '#ffffff' : '#111111',
          fontFamily: 'Sora, sans-serif',
          position: 'absolute',
          inset: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function PaginaNorma({ fundo, cliente, numero, titulo, texto, legenda, referencia, children }: { fundo: string; cliente: string; numero: string; titulo: string; texto: string; legenda: string; referencia?: { marca: SvgLimpo; caixa: Caixa }; children: React.ReactNode }) {
  const suave = luminancia(fundo) < 0.5 ? 'rgba(255,255,255,0.6)' : '#6b6b6b'
  return (
    <Pagina16x9 fundo={fundo}>
      <div style={{ position: 'absolute', left: 80, top: 64, right: 80, display: 'flex', justifyContent: 'space-between', fontSize: 16, color: suave }}>
        <span>
          Normas de Uso <span style={{ marginLeft: 48 }}>{cliente}</span>
        </span>
        <span>{numero}</span>
      </div>
      <div style={{ position: 'absolute', left: 80, top: 190, width: 520 }}>
        <div style={{ fontSize: 34, fontWeight: 600, marginBottom: 28 }}>{titulo}</div>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: suave, margin: 0 }}>{texto}</p>
      </div>
      <div style={{ position: 'absolute', left: 80, bottom: 120, width: 520 }}>
        <LegendaX texto={legenda} referencia={referencia} />
      </div>
      <div style={{ position: 'absolute', left: 700, top: 190, width: 1140, height: 760, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', right: 80, bottom: 56, fontSize: 14, color: suave }}>Voltar ao sumário</div>
    </Pagina16x9>
  )
}

export default function Lab() {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [ativo, setAtivo] = useState(0)
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const [proximidade, setProximidade] = useState(0.03)
  const [ajustes, setAjustes] = useState<Record<string, { nome?: string; papel?: Papel }>>({})
  const [cfg, setCfg] = useState<ConfigLockup>(CONFIG_PADRAO)
  const [travar, setTravar] = useState(true)
  const [cliente, setCliente] = useState('Cliente')
  const [fundoManual, setFundoManual] = useState('')
  // referencia x do manual: um arquivo so (ex.: o "c" da marca) cuja altura e o x de todas as versoes
  const [refX, setRefX] = useState<{ nome: string; altura: number; svg: SvgLimpo; caixa: Caixa } | null>(null)

  const arquivo = arquivos[ativo]

  const lerArquivo = async (f: File): Promise<Arquivo> => {
    const svg = limparSvg(await f.text())
    return { nome: f.name, svg, formas: lerFormas(svg) }
  }
  const usarComoRefX = (a: Arquivo) => {
    const caixa = uniao(a.formas.map((f) => f.caixa))
    if (!caixa.h) throw new Error('referência x sem formas visíveis')
    setRefX({ nome: a.nome, altura: caixa.h, svg: a.svg, caixa })
  }

  const carregar = async (lista: FileList | File[]) => {
    setErro('')
    const novos: Arquivo[] = []
    for (const f of Array.from(lista)) {
      if (!f.name.toLowerCase().endsWith('.svg')) continue
      try {
        const lido = await lerArquivo(f)
        // arquivo com nome de referencia x (ref-x.svg, referencia-x.svg, unidade-x.svg, x.svg) vai para o campo proprio
        if (REF_X.test(f.name)) usarComoRefX(lido)
        else novos.push(lido)
      } catch (e) {
        setErro(`${f.name}: ${(e as Error).message}`)
      }
    }
    if (!novos.length) return
    setArquivos((a) => [...a, ...novos].sort((x, y) => x.nome.localeCompare(y.nome)))
    setAtivo(0)
    setAjustes({})
  }

  // trocar de arquivo ou de agrupamento recalcula as partes do zero
  const partesBrutas = useMemo(() => (arquivo ? agruparPartes(arquivo.formas, proximidade) : []), [arquivo, proximidade])
  const partes = useMemo(
    () => partesBrutas.map((p) => ({ ...p, nome: ajustes[p.id]?.nome ?? p.nome, papel: ajustes[p.id]?.papel ?? p.papel })),
    [partesBrutas, ajustes],
  )
  const cfgEfetiva = useMemo(() => (refX ? { ...cfg, xFixo: refX.altura } : cfg), [cfg, refX])
  const medicao = useMemo(() => (partes.some((p) => p.papel === 'parte') ? medir(partes, cfgEfetiva) : null), [partes, cfgEfetiva])

  // Conferencia de escala: versoes com o mesmo desenho (mesma proporcao das
  // letras, sem a sombra) precisam ter o mesmo tamanho, senao o x nao vale
  const foraDeEscala = useMemo(() => {
    const medidas = arquivos
      .map((a) => {
        const caixa = uniao(agruparPartes(a.formas, proximidade).filter((p) => p.papel === 'parte').map((p) => p.caixa))
        return { nome: a.nome, w: caixa.w, h: caixa.h }
      })
      .filter((m) => m.h > 0)
    const grupos: (typeof medidas)[] = []
    for (const m of medidas) {
      const g = grupos.find((g) => Math.abs(g[0].w / g[0].h - m.w / m.h) / (m.w / m.h) < 0.015)
      if (g) g.push(m)
      else grupos.push([m])
    }
    return grupos
      .filter((g) => g.length > 1 && Math.max(...g.map((m) => m.h)) / Math.min(...g.map((m) => m.h)) > 1.01)
      .map((g) => {
        const maior = Math.max(...g.map((m) => m.h))
        return g.map((m) => ({ nome: m.nome, escala: m.h / maior }))
      })
  }, [arquivos, proximidade])

  // fundo automatico: marca clara pede fundo escuro
  // (a cor de fora conta: com sombra, e a sombra que encosta no fundo)
  const sombra = partes.find((p) => p.papel === 'sombra')
  const corMarca = (cfg.considerarSombra && sombra?.cor) || partes.find((p) => p.papel === 'parte')?.cor
  const fundo = fundoManual || (luminancia(corMarca) > 0.7 ? '#1f1f1f' : '#ffffff')

  const mudar = <K extends keyof ConfigLockup>(chave: K, valor: ConfigLockup[K]) => setCfg((c) => ({ ...c, [chave]: valor }))
  const mudarMargem = (lado: keyof Margens, valor: number) =>
    mudar('margens', travar ? { topo: valor, direita: valor, base: valor, esquerda: valor } : { ...cfg.margens, [lado]: valor })

  const opcoesX: { valor: BaseX; rotulo: string }[] = [
    { valor: 'total-h', rotulo: 'Altura total da marca' },
    { valor: 'total-w', rotulo: 'Largura total da marca' },
    ...partes.filter((p) => p.papel === 'parte').map((p) => ({ valor: `parte:${p.id}` as BaseX, rotulo: `Altura de "${p.nome}"` })),
    ...(partes.some((p) => p.papel === 'refx') ? [{ valor: 'refx' as BaseX, rotulo: 'Camada ref-x' }] : []),
  ]

  const baseTexto = (opcoesX.find((o) => o.valor === cfg.baseX)?.rotulo || 'Altura total da marca').toLowerCase()
  const textoX = refX
    ? 'As proporções são calculadas usando como referência a unidade x, que é a medida mostrada ao lado.'
    : `As proporções usam como referência a unidade x: ${baseTexto}${cfg.divisor === 1 ? '' : ` dividida por ${String(cfg.divisor).replace('.', ',')}`}.`

  return (
    <div style={{ padding: '24px 0 80px', display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0 }}>Laboratório do manual de marca</h1>
        <p style={{ color: cinza, margin: '6px 0 0', maxWidth: 760 }}>
          Fase 1: teste do motor de medição. Solte os SVGs de uma marca e a referência x (um arquivo chamado ref-x.svg é reconhecido sozinho), confira as partes e ajuste as margens. Nada aqui é salvo.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          carregar(e.dataTransfer.files)
        }}
        style={{
          display: 'block',
          border: `2px dashed ${arrastando ? COR_COTA : 'var(--theme-elevation-250)'}`,
          borderRadius: 6,
          padding: 28,
          textAlign: 'center',
          cursor: 'pointer',
          color: cinza,
        }}
      >
        <input type="file" accept=".svg,image/svg+xml" multiple hidden onChange={(e) => e.target.files && carregar(e.target.files)} />
        Arraste os arquivos .svg aqui (pode soltar vários) ou clique para escolher
      </label>
      {erro ? <p style={{ color: 'var(--theme-error-500)', margin: 0 }}>{erro}</p> : null}

      {arquivos.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {arquivos.map((a, i) => {
            const fundoMini = luminancia(a.formas[0]?.cor) > 0.7 ? '#1f1f1f' : '#ffffff'
            return (
              <button
                key={a.nome + i}
                type="button"
                onClick={() => {
                  setAtivo(i)
                  setAjustes({})
                }}
                style={{
                  border: i === ativo ? `2px solid ${COR_COTA}` : borda,
                  borderRadius: 4,
                  background: 'var(--theme-elevation-50)',
                  padding: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--theme-text)',
                }}
              >
                <svg
                  viewBox={`${a.svg.viewBox.x} ${a.svg.viewBox.y} ${a.svg.viewBox.w} ${a.svg.viewBox.h}`}
                  style={{ width: '100%', height: 60, background: fundoMini, display: 'block' }}
                  dangerouslySetInnerHTML={{ __html: a.svg.conteudo }}
                />
                <span style={{ fontSize: 11, wordBreak: 'break-all' }}>{a.nome}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {foraDeEscala.length ? (
        <div style={{ border: '1px solid var(--theme-warning-500, #d9a400)', background: 'var(--theme-warning-100, #fff6d6)', borderRadius: 4, padding: 12, fontSize: 13 }}>
          <strong>Versões em escalas diferentes.</strong> Estes arquivos têm o mesmo desenho mas tamanhos diferentes, então o x não vale igual para eles.
          Exporte todos na mesma escala.
          {foraDeEscala.map((g, i) => (
            <ul key={i} style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {g.map((m) => (
                <li key={m.nome}>
                  {m.nome}: {Math.round(m.escala * 100)}%
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : null}

      {arquivo && medicao ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
            {/* Controles */}
            <div style={{ display: 'grid', gap: 18, fontSize: 13, minWidth: 0 }}>
              <fieldset style={{ border: borda, borderRadius: 4, padding: 12, display: 'grid', gap: 10, minWidth: 0 }}>
                <legend>Partes detectadas</legend>
                <label style={{ display: 'grid', gap: 4 }}>
                  Juntar formas próximas: {Math.round(proximidade * 100)}%
                  <input type="range" min={0} max={0.2} step={0.005} value={proximidade} onChange={(e) => (setProximidade(Number(e.target.value)), setAjustes({}))} />
                </label>
                {partes.map((p) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 100px', gap: 6, alignItems: 'center' }}>
                    <span style={{ width: 14, height: 14, background: p.cor, border: borda, borderRadius: 2 }} />
                    <input
                      style={input}
                      value={p.nome}
                      onChange={(e) => setAjustes((a) => ({ ...a, [p.id]: { ...a[p.id], nome: e.target.value } }))}
                    />
                    <select
                      style={input}
                      value={p.papel}
                      onChange={(e) => setAjustes((a) => ({ ...a, [p.id]: { ...a[p.id], papel: e.target.value as Papel } }))}
                    >
                      <option value="parte">Parte</option>
                      <option value="sombra">Sombra</option>
                      <option value="refx">Referência x</option>
                      <option value="ignorar">Ignorar</option>
                    </select>
                  </div>
                ))}
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={cfg.considerarSombra} onChange={(e) => mudar('considerarSombra', e.target.checked)} />
                  Considerar sombra nas medidas
                </label>
              </fieldset>

              <fieldset style={{ border: borda, borderRadius: 4, padding: 12, display: 'grid', gap: 10, minWidth: 0 }}>
                <legend>Unidade x (todas as versões)</legend>
                {refX ? (
                  <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <svg
                        viewBox={`${refX.svg.viewBox.x} ${refX.svg.viewBox.y} ${refX.svg.viewBox.w} ${refX.svg.viewBox.h}`}
                        style={{ height: 40, width: 'auto', maxWidth: 80, background: '#f3f3f0', flex: 'none' }}
                        dangerouslySetInnerHTML={{ __html: refX.svg.conteudo }}
                      />
                      <span style={{ fontSize: 12, wordBreak: 'break-all' }}>
                        {refX.nome}
                        <br />
                        <span style={{ color: cinza }}>x = {refX.altura.toFixed(2)} unidades do SVG</span>
                      </span>
                    </div>
                    <button type="button" style={{ ...input, width: 'auto', cursor: 'pointer', justifySelf: 'start' }} onClick={() => setRefX(null)}>
                      Remover referência
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, color: cinza, fontSize: 12 }}>
                      Envie a referência x (ex.: o &quot;c&quot; da marca), exportada na mesma escala das versões. A altura dela vira o x de todas.
                    </p>
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        try {
                          usarComoRefX(await lerArquivo(f))
                        } catch (err) {
                          setErro(`${f.name}: ${(err as Error).message}`)
                        }
                      }}
                    />
                    <details>
                      <summary style={{ cursor: 'pointer', color: cinza, fontSize: 12 }}>Sem referência: calcular o x por versão</summary>
                      <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                        <select style={input} value={cfg.baseX} onChange={(e) => mudar('baseX', e.target.value as BaseX)}>
                          {opcoesX.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.rotulo}
                            </option>
                          ))}
                        </select>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          dividido por
                          <input style={{ ...input, width: 70, flex: 'none' }} type="number" min={0.5} step={0.5} value={cfg.divisor} onChange={(e) => mudar('divisor', Number(e.target.value) || 1)} />
                        </label>
                      </div>
                    </details>
                  </>
                )}
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  Juntar bordas a menos de
                  <input style={{ ...input, width: 70, flex: 'none' }} type="number" min={0} step={0.05} value={cfg.tolerancia} onChange={(e) => mudar('tolerancia', Number(e.target.value) || 0)} />x
                </label>
              </fieldset>

              <fieldset style={{ border: borda, borderRadius: 4, padding: 12, display: 'grid', gap: 10, minWidth: 0 }}>
                <legend>Área de segurança (em x)</legend>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={travar} onChange={(e) => setTravar(e.target.checked)} />
                  Travar os 4 lados
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['topo', 'direita', 'base', 'esquerda'] as const).map((lado) => (
                    <label key={lado} style={{ display: 'grid', gap: 4, textTransform: 'capitalize' }}>
                      {lado}
                      <input style={input} type="number" min={0} step={0.05} value={cfg.margens[lado]} onChange={(e) => mudarMargem(lado, Number(e.target.value) || 0)} />
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset style={{ border: borda, borderRadius: 4, padding: 12, display: 'grid', gap: 10, minWidth: 0 }}>
                <legend>Página</legend>
                <label style={{ display: 'grid', gap: 4 }}>
                  Cliente
                  <input style={input} value={cliente} onChange={(e) => setCliente(e.target.value)} />
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  Fundo
                  <input type="color" value={fundo} onChange={(e) => setFundoManual(e.target.value)} />
                  {fundoManual ? (
                    <button type="button" style={{ ...input, width: 'auto', cursor: 'pointer' }} onClick={() => setFundoManual('')}>
                      automático
                    </button>
                  ) : (
                    <span style={{ color: cinza }}>automático</span>
                  )}
                </label>
              </fieldset>
            </div>

            {/* Resultado */}
            <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
              <PaginaNorma
                fundo={fundo}
                cliente={cliente}
                numero="27"
                titulo="02. Dimensões da Marca"
                texto="Essas são as proporções usadas na composição da marca. Conhecer essas relações ajuda a aplicar a marca fielmente, tanto no digital quanto no impresso."
                legenda={textoX}
                referencia={refX ? { marca: refX.svg, caixa: refX.caixa } : undefined}
              >
                <DiagramaDimensoes marca={arquivo.svg} medicao={medicao} largura={1140} altura={760} />
              </PaginaNorma>
              <PaginaNorma
                fundo={fundo}
                cliente={cliente}
                numero="28"
                titulo="03. Área de Segurança"
                texto="A área de segurança é a margem mínima em volta da marca. Nenhum outro elemento, texto ou borda deve invadir esse espaço, para garantir a leitura e a integridade da marca."
                legenda={textoX}
                referencia={refX ? { marca: refX.svg, caixa: refX.caixa } : undefined}
              >
                <DiagramaSeguranca marca={arquivo.svg} medicao={medicao} largura={1140} altura={760} />
              </PaginaNorma>
            </div>
          </div>

          <fieldset style={{ border: borda, borderRadius: 4, padding: 12 }}>
            <legend>Cotas detectadas ({medicao.segmentos.length})</legend>
            <p style={{ color: cinza, margin: '0 0 10px', fontSize: 12 }}>
              x = {medicao.x.toFixed(2)} unidades do SVG. Caixa total: {formatX(medicao.total.w / medicao.x)} × {formatX(medicao.total.h / medicao.x)}. Oculte cotas ou troque o texto do rótulo.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
              {medicao.segmentos.map((s) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '20px 70px 1fr', gap: 6, alignItems: 'center', fontSize: 12, opacity: s.oculto ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    title="Mostrar"
                    checked={!s.oculto}
                    onChange={(e) => mudar('ocultos', e.target.checked ? cfg.ocultos.filter((id) => id !== s.id) : [...cfg.ocultos, s.id])}
                  />
                  <span style={{ color: cinza }}>
                    {s.eixo === 'h' ? 'Largura' : 'Altura'} {s.id.slice(1)}
                    {s.vazio ? ' ·esp.' : ''}
                  </span>
                  <input
                    style={{ ...input, padding: '3px 6px', fontSize: 12 }}
                    placeholder={formatX(s.valor)}
                    value={cfg.rotulos[s.id] || ''}
                    onChange={(e) => {
                      const rotulos = { ...cfg.rotulos }
                      if (e.target.value) rotulos[s.id] = e.target.value
                      else delete rotulos[s.id]
                      mudar('rotulos', rotulos)
                    }}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <details>
            <summary style={{ cursor: 'pointer', color: cinza }}>JSON que será salvo no lockup (fase 3)</summary>
            <pre style={{ fontSize: 11, maxHeight: 360, overflow: 'auto', background: 'var(--theme-elevation-50)', padding: 12 }}>
              {JSON.stringify({ partes: partes.map((p) => ({ ...p, caixa: arred(p.caixa) })), total: arred(uniao([medicao.total])), x: +medicao.x.toFixed(3), segmentos: medicao.segmentos.map((s) => ({ id: s.id, rotulo: s.rotulo, vazio: s.vazio, oculto: s.oculto })) }, null, 2)}
            </pre>
          </details>
        </>
      ) : null}
    </div>
  )
}

function arred(c: { x: number; y: number; w: number; h: number }) {
  const r = (n: number) => +n.toFixed(2)
  return { x: r(c.x), y: r(c.y), w: r(c.w), h: r(c.h) }
}
