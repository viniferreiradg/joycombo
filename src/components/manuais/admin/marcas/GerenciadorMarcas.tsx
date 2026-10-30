'use client'

// Aba "Normas de uso": versoes da marca. Tudo fica no campo JSON "marcas":
// - referencia x (um SVG, ex.: o "c"), cuja altura e o x de todas as versoes;
// - fundos (nome + hex) criados a mao; cada versao escolhe o dela;
// - versoes (SVGs sanitizados e prefixados no navegador, na hora do upload);
// - grupos criados a mao, cada um dizendo se entra em Versoes, Dimensoes e
//   Area de seguranca, com a medicao de cada versao ja calculada (a pagina
//   publica so desenha, nao mede).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAllFormFields, useField } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { DiagramaDimensoes, DiagramaSeguranca, COR_COTA } from '@/components/manuais/Diagramas'
import { DesenhoIncorreto, DesenhoSimples, corSemContraste } from '@/components/manuais/Incorretos'
import {
  type CorFundo,
  type GrupoSalvo,
  type ItemIncorreto,
  type MarcasData,
  type RefX,
  type Versao,
  CATEGORIAS,
  MARCAS_VAZIO,
  TIPOS_INCORRETOS,
  ajustesDaVersao,
  alturaDoX,
  categoriaSugerida,
  ehBranco,
  fundosDoManual,
  lerNomeDoArquivo,
  novoGrupo,
  sugerirGrupos,
} from '@/lib/manuais/marcas'
import { type BaseX, type Margens, type Papel, formatX, medir, uniao } from '@/lib/manuais/medicao'
import { type Forma, type SvgLimpo, agruparPartes, lerFormas, limparSvg } from '@/lib/manuais/svg'

const REF_X = /(^|[-_ ])(ref-?x|referencia-?x|unidade-?x|x)\.svg$/i

const cinza = 'var(--theme-elevation-500)'
const borda = '1px solid var(--theme-elevation-150)'
const campo: React.CSSProperties = {
  background: 'var(--theme-input-bg)',
  border: borda,
  borderRadius: 4,
  color: 'var(--theme-text)',
  padding: '5px 8px',
  fontSize: 13,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}
const botao: React.CSSProperties = { ...campo, width: 'auto', cursor: 'pointer' }
const botaoForte: React.CSSProperties = { ...botao, background: 'var(--theme-elevation-800)', color: 'var(--theme-elevation-0)', borderColor: 'transparent' }
const caixaSecao: React.CSSProperties = { border: borda, borderRadius: 6, padding: 16, display: 'grid', gap: 12, minWidth: 0 }

function Svg({ svg, fundo, altura = 48 }: { svg: { conteudo: string; viewBox: { x: number; y: number; w: number; h: number } }; fundo?: string; altura?: number }) {
  const vb = svg.viewBox
  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      style={{ height: altura, width: '100%', background: fundo || 'transparent', display: 'block', padding: 4, boxSizing: 'border-box' }}
      dangerouslySetInnerHTML={{ __html: svg.conteudo }}
    />
  )
}

function Soltar({ rotulo, multiplo, aoSoltar }: { rotulo: string; multiplo?: boolean; aoSoltar: (f: File[]) => void }) {
  const [em, setEm] = useState(false)
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setEm(true)
      }}
      onDragLeave={() => setEm(false)}
      onDrop={(e) => {
        e.preventDefault()
        setEm(false)
        aoSoltar(Array.from(e.dataTransfer.files))
      }}
      style={{ display: 'block', border: `2px dashed ${em ? COR_COTA : 'var(--theme-elevation-250)'}`, borderRadius: 6, padding: 18, textAlign: 'center', cursor: 'pointer', color: cinza, fontSize: 13 }}
    >
      <input type="file" accept=".svg,image/svg+xml" multiple={multiplo} hidden onChange={(e) => e.target.files && aoSoltar(Array.from(e.target.files))} />
      {rotulo}
    </label>
  )
}

/** Partes e medicao de uma versao com os ajustes dela (precisa do DOM) */
function calcular(g: GrupoSalvo, versaoId: string, formas: Forma[], refX: RefX | null | undefined) {
  const aj = ajustesDaVersao(g, versaoId)
  const partes = agruparPartes(formas, aj.proximidade).map((p) => ({ ...p, nome: aj.ajustes[p.id]?.nome ?? p.nome, papel: aj.ajustes[p.id]?.papel ?? p.papel }))
  const cfg = refX ? { ...aj.cfg, xFixo: alturaDoX(refX) } : { ...aj.cfg, xFixo: undefined }
  const medicao = partes.some((p) => p.papel === 'parte') ? medir(partes, cfg) : undefined
  return { partes, medicao }
}

export default function GerenciadorMarcas({ path }: { path: string }) {
  const { value, setValue } = useField<MarcasData>({ path })
  const dados: MarcasData = useMemo(() => {
    // dados antigos (antes dos grupos) chegam com "lockups", sem "grupos" e com versoes sem "grupo"
    const { lockups: _antigo, ...v } = { ...MARCAS_VAZIO, ...(value || {}) } as MarcasData & { lockups?: unknown }
    void _antigo
    return { ...v, grupos: v.grupos || [], versoes: (v.versoes || []).map((x) => ({ ...x, grupo: x.grupo ?? null })) }
  }, [value])
  const [campos] = useAllFormFields()
  const { cliente, paleta } = useMemo(() => {
    const v = reduceFieldsToValues(campos, true) as { cliente?: string; paleta?: { cores?: { nome: string; hex: string; categoria: string }[] }[] }
    return { cliente: v.cliente || '', paleta: (v.paleta || []).map((g) => ({ cores: g.cores || [] })) }
  }, [campos])
  const cores = useMemo(() => fundosDoManual(dados, paleta), [dados, paleta])
  const corDe = (slug: string): CorFundo | undefined => cores.find((c) => c.slug === slug)

  // ids das versoes que acabaram de entrar (lista para conferir fundo e grupo)
  const [recentes, setRecentes] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState<string>('')
  // versao mostrada nos diagramas do painel, por grupo (so a previa; todas sao medidas)
  const [previa, setPrevia] = useState<Record<string, string>>({})

  // Cada acao grava uma vez so, a partir do estado atual: duas gravacoes no
  // mesmo clique usariam o mesmo estado antigo e a segunda apagaria a primeira
  const salvar = (novo: Partial<MarcasData>) => setValue({ ...dados, ...novo })

  // formas medidas por versao (cache: medir e caro e o SVG nao muda)
  const cacheFormas = useRef(new Map<string, Forma[]>())
  const formasDe = (v: Versao) => {
    let f = cacheFormas.current.get(v.id)
    if (!f) {
      f = lerFormas({ ...v.svg, prefixo: '' } as SvgLimpo)
      cacheFormas.current.set(v.id, f)
    }
    return f
  }

  // ------------------------------------------------------------ medicao de cada versao de cada grupo
  useEffect(() => {
    const grupos = dados.grupos.map((g) => {
      const medidas: NonNullable<GrupoSalvo['medidas']> = {}
      for (const v of dados.versoes.filter((x) => x.grupo === g.id)) medidas[v.id] = calcular(g, v.id, formasDe(v), dados.refX)
      // tira campos de antes (mestre, partes e medicao unicos)
      const { mestre: _m, partes: _p, medicao: _md, ...resto } = g as GrupoSalvo & { mestre?: unknown; partes?: unknown; medicao?: unknown }
      void _m
      void _p
      void _md
      return { ...resto, medidas }
    })
    if (JSON.stringify(grupos) !== JSON.stringify(dados.grupos)) salvar({ grupos })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados])

  // ------------------------------------------------------------ upload
  const receber = async (arquivos: File[]) => {
    setErro('')
    const novos: Versao[] = []
    let refX: RefX | null = null
    for (const f of arquivos) {
      if (!f.name.toLowerCase().endsWith('.svg')) continue
      try {
        const svg = limparSvg(await f.text())
        if (REF_X.test(f.name)) {
          const caixa = uniao(lerFormas(svg).map((x) => x.caixa))
          if (!caixa.h) throw new Error('sem formas visíveis')
          // reenviar o X.svg mantem a divisao escolhida
          refX = { nome: f.name, svg: { conteudo: svg.conteudo, viewBox: svg.viewBox }, caixa, divisor: dados.refX?.divisor }
          continue
        }
        const anterior = dados.versoes.find((v) => v.arquivo === f.name)
        novos.push({
          id: crypto.randomUUID(),
          arquivo: f.name,
          ...lerNomeDoArquivo(f.name, cliente),
          // reenviar um arquivo mantem o fundo e o grupo dele
          fundo: anterior?.fundo ?? '',
          grupo: anterior?.grupo ?? null,
          svg: { conteudo: svg.conteudo, viewBox: svg.viewBox },
        })
      } catch (e) {
        setErro(`${f.name}: ${(e as Error).message}`)
      }
    }
    if (!novos.length && !refX) return
    // entram direto (arquivo com o mesmo nome substitui o anterior); a lista
    // "acabaram de entrar" e so para conferir
    const nomes = new Set(novos.map((v) => v.arquivo))
    salvar({ ...(refX ? { refX } : {}), versoes: [...dados.versoes.filter((v) => !nomes.has(v.arquivo)), ...novos] })
    if (novos.length) setRecentes(novos.map((v) => v.id))
  }

  const mudarVersao = (id: string, mudanca: Partial<Versao>) =>
    salvar({ versoes: dados.versoes.map((v) => (v.id === id ? { ...v, ...mudanca } : v)) })

  const mudarGrupo = (id: string, mudanca: Partial<GrupoSalvo>) => salvar({ grupos: dados.grupos.map((g) => (g.id === id ? { ...g, ...mudanca } : g)) })
  const moverGrupo = (id: string, passo: -1 | 1) => {
    const i = dados.grupos.findIndex((g) => g.id === id)
    const j = i + passo
    if (j < 0 || j >= dados.grupos.length) return
    const grupos = [...dados.grupos]
    ;[grupos[i], grupos[j]] = [grupos[j], grupos[i]]
    salvar({ grupos })
  }
  const apagarGrupo = (id: string) =>
    salvar({ grupos: dados.grupos.filter((g) => g.id !== id), versoes: dados.versoes.map((v) => (v.grupo === id ? { ...v, grupo: null } : v)) })
  /** Cria um grupo (e, se vier uma versao, ja coloca ela nele) numa gravacao so */
  const criarGrupo = (versaoId?: string) => {
    const g = novoGrupo(`Grupo ${dados.grupos.length + 1}`)
    salvar({
      grupos: [...dados.grupos, g],
      ...(versaoId ? { versoes: dados.versoes.map((v) => (v.id === versaoId ? { ...v, grupo: g.id } : v)) } : {}),
    })
  }

  // ------------------------------------------------------------ tabela de versoes
  const seletorGrupo = (v: Versao) => (
    <select
      style={campo}
      value={v.grupo || ''}
      onChange={(e) => {
        if (e.target.value === '__novo') criarGrupo(v.id)
        else mudarVersao(v.id, { grupo: e.target.value || null })
      }}
    >
      <option value="">Sem grupo</option>
      {dados.grupos.map((g) => (
        <option key={g.id} value={g.id}>
          {g.nome}
        </option>
      ))}
      <option value="__novo">+ Novo grupo</option>
    </select>
  )

  const colunasTabela = '110px minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) 28px'
  const tabela = (lista: Versao[]) => (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: colunasTabela, gap: 8, fontSize: 12, color: cinza }}>
        <span>Prévia</span>
        <span>Arquivo</span>
        <span>Fundo</span>
        <span>Grupo</span>
        <span />
      </div>
      {lista.map((v) => (
        <div key={v.id} style={{ display: 'grid', gridTemplateColumns: colunasTabela, gap: 8, alignItems: 'center' }}>
          <div style={{ border: borda, borderRadius: 4, overflow: 'hidden' }}>
            <Svg svg={v.svg} fundo={corDe(v.fundo)?.hex} altura={42} />
          </div>
          <span style={{ fontSize: 12, wordBreak: 'break-all' }}>{v.arquivo}</span>
          <select style={campo} value={corDe(v.fundo) ? v.fundo : ''} onChange={(e) => mudarVersao(v.id, { fundo: e.target.value })}>
            <option value="">Escolha o fundo</option>
            {cores.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome} ({c.categoria})
              </option>
            ))}
          </select>
          {seletorGrupo(v)}
          <button
            type="button"
            title="Remover"
            style={{ ...botao, padding: '4px 0', textAlign: 'center' }}
            onClick={() => salvar({ versoes: dados.versoes.filter((x) => x.id !== v.id) })}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )

  // ------------------------------------------------------------ ajustes de medida de cada versao do grupo
  const painelMedidas = (g: GrupoSalvo) => {
    const versoes = dados.versoes.filter((v) => v.grupo === g.id).sort((a, b) => a.arquivo.localeCompare(b.arquivo))
    const atual = versoes.find((v) => v.id === previa[g.id]) || versoes[0]
    const medida = atual ? g.medidas?.[atual.id] : undefined
    const fundoDesenho = (atual && corDe(atual.fundo)?.hex) || '#fff'
    const partes = medida?.partes || []
    const m = medida?.medicao
    // cada versao tem os proprios ajustes (comecam iguais aos do grupo)
    const aj = atual ? ajustesDaVersao(g, atual.id) : { proximidade: g.proximidade, ajustes: g.ajustes, cfg: g.cfg }
    const mudarAjustes = (mud: Partial<typeof aj>) => atual && mudarGrupo(g.id, { porVersao: { ...g.porVersao, [atual.id]: { ...aj, ...mud } } })
    const copiarParaTodas = () => {
      if (!atual || !window.confirm('Copiar os ajustes desta versão para todas as versões do grupo? Os ajustes delas serão substituídos.')) return
      mudarGrupo(g.id, { porVersao: Object.fromEntries(versoes.map((v) => [v.id, structuredClone(aj)])) })
    }
    const cfg = aj.cfg
    const mudarCfg = (mud: Partial<typeof cfg>) => mudarAjustes({ cfg: { ...cfg, ...mud } })
    const iguais = cfg.margensIguais !== false
    const mudarMargem = (lado: keyof Margens, v: number) => mudarCfg({ margens: { ...cfg.margens, [lado]: v } })
    const opcoesX: { valor: BaseX; rotulo: string }[] = [
      { valor: 'total-h', rotulo: 'Altura total da marca' },
      { valor: 'total-w', rotulo: 'Largura total da marca' },
      ...partes.filter((p) => p.papel === 'parte').map((p) => ({ valor: `parte:${p.id}` as BaseX, rotulo: `Altura de "${p.nome}"` })),
    ]

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 12, fontSize: 13, minWidth: 0 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            Versão
            <select style={campo} value={atual?.id || ''} onChange={(e) => setPrevia((p) => ({ ...p, [g.id]: e.target.value }))}>
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.arquivo}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: cinza }}>Os ajustes abaixo valem só para esta versão. Escolha outra versão na lista para ajustar a dela.</span>
          </label>
          {versoes.length > 1 ? (
            <button type="button" style={{ ...botao, justifySelf: 'start', fontSize: 12 }} onClick={copiarParaTodas}>
              Copiar estes ajustes para as outras versões do grupo
            </button>
          ) : null}
          <div style={{ display: 'grid', gap: 6 }}>
            <span>Partes detectadas</span>
            <label style={{ display: 'grid', gap: 2, color: cinza, fontSize: 12 }}>
              Juntar formas próximas: {Math.round(aj.proximidade * 100)}%
              <input type="range" min={0} max={0.2} step={0.005} value={aj.proximidade} onChange={(e) => mudarAjustes({ proximidade: Number(e.target.value), ajustes: {} })} />
            </label>
            {partes.map((p) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) 110px', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 12, height: 12, background: p.cor, border: borda }} />
                <input style={campo} value={p.nome} onChange={(e) => mudarAjustes({ ajustes: { ...aj.ajustes, [p.id]: { ...aj.ajustes[p.id], nome: e.target.value } } })} />
                <select style={campo} value={p.papel} onChange={(e) => mudarAjustes({ ajustes: { ...aj.ajustes, [p.id]: { ...aj.ajustes[p.id], papel: e.target.value as Papel } } })}>
                  <option value="parte">Parte</option>
                  <option value="sombra">Sombra</option>
                  <option value="ignorar">Ignorar</option>
                </select>
              </div>
            ))}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={cfg.considerarSombra} onChange={(e) => mudarCfg({ considerarSombra: e.target.checked })} />
              Considerar sombra nas medidas
            </label>
          </div>
          {!dados.refX ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <span>Unidade x (sem referência)</span>
              <select style={campo} value={cfg.baseX} onChange={(e) => mudarCfg({ baseX: e.target.value as BaseX })}>
                {opcoesX.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                dividido por
                <input style={{ ...campo, width: 70 }} type="number" min={0.5} step={0.5} value={cfg.divisor} onChange={(e) => mudarCfg({ divisor: Number(e.target.value) || 1 })} />
              </label>
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 6 }}>
            <span>Área de segurança (em x)</span>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={iguais}
                onChange={(e) =>
                  mudarCfg(
                    e.target.checked
                      ? { margensIguais: true, margens: { topo: cfg.margens.topo, direita: cfg.margens.topo, base: cfg.margens.topo, esquerda: cfg.margens.topo } }
                      : { margensIguais: false },
                  )
                }
              />
              Mesmo valor nos 4 lados
            </label>
            {iguais ? (
              <input
                style={{ ...campo, width: 100 }}
                type="number"
                min={0}
                step={0.05}
                value={cfg.margens.topo}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0
                  mudarCfg({ margens: { topo: v, direita: v, base: v, esquerda: v } })
                }}
              />
            ) : (
              // em volta de um quadradinho que faz as vezes da marca: topo em cima,
              // esquerda e direita dos lados, baixo embaixo
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateAreas: '". topo ." "esquerda marca direita" ". base ."', gap: 6, alignItems: 'end' }}>
                {(
                  [
                    ['topo', 'Topo'],
                    ['esquerda', 'Esquerda'],
                    ['direita', 'Direita'],
                    ['base', 'Baixo'],
                  ] as const
                ).map(([lado, rotulo]) => (
                  <label key={lado} style={{ gridArea: lado, display: 'grid', gap: 2, fontSize: 12, color: cinza, textAlign: 'center' }}>
                    {rotulo}
                    <input style={{ ...campo, textAlign: 'center' }} type="number" min={0} step={0.05} value={cfg.margens[lado]} onChange={(e) => mudarMargem(lado, Number(e.target.value) || 0)} />
                  </label>
                ))}
                <span style={{ gridArea: 'marca', alignSelf: 'stretch', border: `1px dashed ${COR_COTA}`, borderRadius: 2, minHeight: 34, display: 'grid', placeItems: 'center', fontSize: 11, color: cinza }}>
                  marca
                </span>
              </div>
            )}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Juntar bordas a menos de
            <input style={{ ...campo, width: 70 }} type="number" min={0} step={0.05} value={cfg.tolerancia} onChange={(e) => mudarCfg({ tolerancia: Number(e.target.value) || 0 })} />x
          </label>
        </div>

        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          {atual && m ? (
            <>
              <div style={{ border: borda, borderRadius: 4, padding: 8, background: fundoDesenho }}>
                <DiagramaDimensoes marca={atual.svg} medicao={m} largura={1140} altura={620} />
              </div>
              <div style={{ border: borda, borderRadius: 4, padding: 8, background: fundoDesenho }}>
                <DiagramaSeguranca marca={atual.svg} medicao={m} largura={1140} altura={620} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13 }}>Números das cotas desta versão</span>
                <span style={{ fontSize: 12, color: cinza }}>Em branco, vale o número calculado (cinza). Escreva por cima para trocar (ex.: 2x). A caixinha oculta a cota.</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                  {/* largura e altura totais (sempre aparecem) e depois as cotas internas */}
                  {[{ ...m.largura, nome: 'Largura total' }, { ...m.altura, nome: 'Altura total' }, ...m.segmentos.map((s) => ({ ...s, nome: `${s.eixo === 'h' ? 'Largura' : 'Altura'} ${s.id.slice(1)}` }))].map((s) => {
                    const total = s.id === 'largura' || s.id === 'altura'
                    return (
                      <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '18px 84px 1fr', gap: 6, alignItems: 'center', fontSize: 12, opacity: s.oculto ? 0.5 : 1 }}>
                        {total ? (
                          <span />
                        ) : (
                          <input type="checkbox" checked={!s.oculto} onChange={(e) => mudarCfg({ ocultos: e.target.checked ? cfg.ocultos.filter((id) => id !== s.id) : [...cfg.ocultos, s.id] })} />
                        )}
                        <span style={{ color: cinza }}>{s.nome}</span>
                        <input
                          style={{ ...campo, padding: '3px 6px', fontSize: 12 }}
                          placeholder={formatX(s.valor)}
                          value={cfg.rotulos[s.id] || ''}
                          onChange={(e) => {
                            const rotulos = { ...cfg.rotulos }
                            if (e.target.value) rotulos[s.id] = e.target.value
                            else delete rotulos[s.id]
                            mudarCfg({ rotulos })
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: cinza, fontSize: 13 }}>Sem partes para medir nesta versão.</p>
          )}
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------ quadro de um grupo
  const chave = (rotulo: string, ligado: boolean, aoMudar: (v: boolean) => void) => (
    <label
      style={{
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center',
        fontSize: 12,
        padding: '4px 10px',
        borderRadius: 999,
        border: borda,
        background: ligado ? 'var(--theme-elevation-100)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <input type="checkbox" checked={ligado} onChange={(e) => aoMudar(e.target.checked)} />
      {rotulo}
    </label>
  )

  const semGrupo = dados.versoes.filter((v) => !v.grupo || !dados.grupos.some((g) => g.id === v.grupo))

  const quadroGrupo = (g: GrupoSalvo, i: number) => {
    const versoes = dados.versoes.filter((v) => v.grupo === g.id)
    return (
      <div key={g.id} style={caixaSecao}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" title="Subir" style={botao} disabled={i === 0} onClick={() => moverGrupo(g.id, -1)}>
            ↑
          </button>
          <button type="button" title="Descer" style={botao} disabled={i === dados.grupos.length - 1} onClick={() => moverGrupo(g.id, 1)}>
            ↓
          </button>
          <input style={{ ...campo, flex: '1 1 220px', width: 'auto', fontWeight: 600 }} value={g.nome} onChange={(e) => mudarGrupo(g.id, { nome: e.target.value })} />
          <button type="button" style={botao} onClick={() => window.confirm(`Apagar o grupo "${g.nome}"? As versões dele ficam sem grupo.`) && apagarGrupo(g.id)}>
            Apagar grupo
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chave('Versões da marca', g.emVersoes, (v) => mudarGrupo(g.id, { emVersoes: v }))}
          {chave('Dimensões', g.emDimensoes, (v) => mudarGrupo(g.id, { emDimensoes: v }))}
          {chave('Área de segurança', g.emSeguranca, (v) => mudarGrupo(g.id, { emSeguranca: v }))}
          {chave('Redução máxima', Boolean(g.emReducao), (v) => mudarGrupo(g.id, { emReducao: v }))}
          {g.emReducao ? (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12, color: cinza }}>
              largura mínima
              <input
                style={{ ...campo, width: 70 }}
                type="number"
                min={1}
                placeholder="px"
                value={g.reducaoPx ?? ''}
                onChange={(e) => mudarGrupo(g.id, { reducaoPx: e.target.value ? Number(e.target.value) : null })}
              />
              px
              <input
                style={{ ...campo, width: 70 }}
                type="number"
                min={1}
                step={0.5}
                placeholder="mm"
                value={g.reducaoMm ?? ''}
                onChange={(e) => mudarGrupo(g.id, { reducaoMm: e.target.value ? Number(e.target.value) : null })}
              />
              mm
            </span>
          ) : null}
          {(() => {
            const m = Object.values(g.medidas || {})[0]?.medicao
            return m ? (
              <span style={{ fontSize: 12, color: cinza, alignSelf: 'center' }}>
                {formatX(m.total.w / m.x)} × {formatX(m.total.h / m.x)}
              </span>
            ) : null
          })()}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {versoes.map((v) => (
            <div key={v.id} style={{ border: borda, borderRadius: 4, overflow: 'hidden', position: 'relative' }} title={v.arquivo}>
              <Svg svg={v.svg} fundo={corDe(v.fundo)?.hex} altura={56} />
              <div style={{ fontSize: 11, padding: '3px 6px', color: cinza, display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {corDe(v.fundo)?.nome || 'Sem fundo'}
                </span>
                <button type="button" title="Tirar do grupo" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => mudarVersao(v.id, { grupo: null })}>
                  ×
                </button>
              </div>
            </div>
          ))}
          {semGrupo.length ? (
            <select style={{ ...campo, alignSelf: 'center' }} value="" onChange={(e) => e.target.value && mudarVersao(e.target.value, { grupo: g.id })}>
              <option value="">+ Adicionar versão</option>
              {semGrupo.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.arquivo}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        {versoes.length ? (
          <>
            <button type="button" style={{ ...botao, justifySelf: 'start' }} onClick={() => setAberto((a) => (a === g.id ? '' : g.id))}>
              {aberto === g.id ? 'Fechar ajustes de medida' : 'Ajustar medidas (dimensões e área de segurança)'}
            </button>
            {aberto === g.id ? painelMedidas(g) : null}
          </>
        ) : null}
      </div>
    )
  }

  // ------------------------------------------------------------ usos incorretos
  const quadroIncorretos = () => {
    const inc = dados.incorretos || { referencia: '', itens: [] }
    const ref = dados.versoes.find((v) => v.id === inc.referencia) || dados.versoes.find((v) => v.grupo) || dados.versoes[0]
    const medicaoRef = ref ? dados.grupos.find((g) => g.id === ref.grupo)?.medidas?.[ref.id]?.medicao : undefined
    const contraste = ref ? corSemContraste(ref.svg, cores.filter((c) => !ehBranco(c)).map((c) => c.hex)) : '#eeeeee'
    const fundoRef = ref ? corDe(ref.fundo)?.hex : undefined
    const mudar = (novo: Partial<typeof inc>) => salvar({ incorretos: { ...inc, referencia: ref?.id || '', ...novo } })
    const mover = (i: number, passo: -1 | 1) => {
      const itens = [...inc.itens]
      const j = i + passo
      if (j < 0 || j >= itens.length) return
      ;[itens[i], itens[j]] = [itens[j], itens[i]]
      mudar({ itens })
    }
    const mudarItem = (id: string, m: Partial<ItemIncorreto>) => mudar({ itens: inc.itens.map((x) => (x.id === id ? { ...x, ...m } : x)) })
    const usados = new Set(inc.itens.map((x) => x.tipo))

    return (
      <div style={caixaSecao}>
        <strong>Usos incorretos ({inc.itens.length})</strong>
        <span style={{ fontSize: 12, color: cinza }}>Gerados a partir da versão de referência. O ideal são 6 (uma página com grade 3×2). A ordem daqui é a numeração no manual.</span>
        <label style={{ display: 'grid', gap: 4, fontSize: 13, maxWidth: 520 }}>
          Versão de referência (uso correto)
          <select style={campo} value={ref?.id || ''} onChange={(e) => mudar({ referencia: e.target.value })}>
            {dados.grupos.map((g) => (
              <optgroup key={g.id} label={g.nome}>
                {dados.versoes
                  .filter((v) => v.grupo === g.id)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.arquivo}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        {ref ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
            {inc.itens.map((it, i) => (
              <div key={it.id} style={{ border: borda, borderRadius: 4, padding: 8, display: 'grid', gap: 6, minWidth: 0 }}>
                <div style={{ height: 80, background: it.tipo === 'contraste' ? undefined : fundoRef }}>
                  {it.tipo === 'personalizado' ? (
                    it.svg ? (
                      <DesenhoSimples svg={it.svg} />
                    ) : (
                      <Soltar
                        rotulo="Solte o SVG"
                        aoSoltar={async (fs) => {
                          const f = fs.find((x) => x.name.toLowerCase().endsWith('.svg'))
                          if (!f) return
                          const l = limparSvg(await f.text())
                          mudarItem(it.id, { svg: { conteudo: l.conteudo, viewBox: l.viewBox } })
                        }}
                      />
                    )
                  ) : (
                    <DesenhoIncorreto id={`painel-inc-${it.id}`} tipo={it.tipo} svg={ref.svg} medicao={medicaoRef} contraste={contraste} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                  <input style={{ ...campo, padding: '3px 6px', fontSize: 12 }} value={it.rotulo} onChange={(e) => mudarItem(it.id, { rotulo: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={{ ...botao, padding: '2px 8px' }} disabled={i === 0} onClick={() => mover(i, -1)}>
                    ←
                  </button>
                  <button type="button" style={{ ...botao, padding: '2px 8px' }} disabled={i === inc.itens.length - 1} onClick={() => mover(i, 1)}>
                    →
                  </button>
                  {it.tipo === 'personalizado' && it.svg ? (
                    <button type="button" style={{ ...botao, padding: '2px 8px', fontSize: 12 }} onClick={() => mudarItem(it.id, { svg: null })}>
                      Trocar SVG
                    </button>
                  ) : null}
                  <button type="button" style={{ ...botao, padding: '2px 8px', marginLeft: 'auto' }} onClick={() => mudar({ itens: inc.itens.filter((x) => x.id !== it.id) })}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <select
          style={{ ...campo, maxWidth: 320 }}
          value=""
          onChange={(e) => {
            const t = TIPOS_INCORRETOS.find((x) => x.tipo === e.target.value)
            if (t) mudar({ itens: [...inc.itens, { id: crypto.randomUUID(), tipo: t.tipo, rotulo: t.rotulo, svg: null }] })
          }}
        >
          <option value="">+ Adicionar uso incorreto</option>
          {TIPOS_INCORRETOS.map((t) => (
            <option key={t.tipo} value={t.tipo} disabled={t.tipo !== 'personalizado' && usados.has(t.tipo)}>
              {t.rotulo}
              {t.tipo === 'personalizado' ? ' (SVG seu)' : ''}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // ------------------------------------------------------------ fundos
  // Gravam a lista inteira em "fundos" (no primeiro ajuste, a lista que vinha
  // da paleta fica salva). O slug nao muda ao renomear: e ele que liga a versao.
  const mudarFundos = (fundos: CorFundo[]) => salvar({ fundos })
  const mudarFundo = (slug: string, m: Partial<CorFundo>) => mudarFundos(cores.map((c) => (c.slug === slug ? { ...c, ...m } : c)))
  const moverFundo = (i: number, passo: -1 | 1) => {
    const j = i + passo
    if (j < 0 || j >= cores.length) return
    const lista = [...cores]
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    mudarFundos(lista)
  }
  const apagarFundo = (c: CorFundo) => {
    const usam = dados.versoes.filter((v) => v.fundo === c.slug).length
    if (usam && !window.confirm(`Apagar o fundo "${c.nome}"? ${usam} ${usam === 1 ? 'versão fica' : 'versões ficam'} sem fundo.`)) return
    salvar({ fundos: cores.filter((x) => x.slug !== c.slug), versoes: dados.versoes.map((v) => (v.fundo === c.slug ? { ...v, fundo: '' } : v)) })
  }
  const semFundo = dados.versoes.filter((v) => !corDe(v.fundo))

  const colunasFundos = '34px minmax(0,1.4fr) 110px minmax(0,1fr) 54px 64px 28px'
  const quadroFundos = () => (
    <div style={caixaSecao}>
      <strong>Fundos ({cores.length})</strong>
      <span style={{ fontSize: 12, color: cinza }}>
        Cada fundo vira uma página em Versões da marca, na ordem daqui, dentro da categoria (claros, escuros, coloridos). Cada versão escolhe o fundo dela na lista de versões.
        {dados.fundos ? null : ' Estes vieram da paleta; ao mexer, passam a ser só daqui.'}
      </span>
      {cores.length ? (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: colunasFundos, gap: 8, fontSize: 12, color: cinza }}>
            <span />
            <span>Nome</span>
            <span>HEX</span>
            <span>Categoria</span>
            <span>Versões</span>
            <span />
            <span />
          </div>
          {cores.map((c, i) => {
            const valido = /^#[0-9a-f]{6}$/i.test(c.hex)
            return (
              <div key={c.slug} style={{ display: 'grid', gridTemplateColumns: colunasFundos, gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  title="Escolher a cor"
                  value={valido ? c.hex.toLowerCase() : '#ffffff'}
                  onChange={(e) => mudarFundo(c.slug, { hex: e.target.value.toUpperCase() })}
                  style={{ width: 34, height: 30, padding: 0, border: borda, borderRadius: 4, background: 'none', cursor: 'pointer' }}
                />
                <input style={campo} value={c.nome} placeholder="Vermelho" onChange={(e) => mudarFundo(c.slug, { nome: e.target.value })} />
                <input
                  style={{ ...campo, borderColor: valido ? undefined : 'var(--theme-error-500)' }}
                  value={c.hex}
                  placeholder="#D70008"
                  onChange={(e) => {
                    const t = e.target.value.trim().toUpperCase()
                    const hex = t && !t.startsWith('#') ? `#${t}` : t
                    // categoria acompanha a cor enquanto voce digita; depois da para trocar a mao
                    mudarFundo(c.slug, /^#[0-9A-F]{6}$/.test(hex) ? { hex, categoria: categoriaSugerida(hex) } : { hex })
                  }}
                />
                <select style={campo} value={c.categoria} onChange={(e) => mudarFundo(c.slug, { categoria: e.target.value as CorFundo['categoria'] })}>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat.valor} value={cat.valor}>
                      {cat.titulo}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 12, color: cinza }}>{dados.versoes.filter((v) => v.fundo === c.slug).length}</span>
                <span style={{ display: 'flex', gap: 2 }}>
                  <button type="button" title="Subir" style={{ ...botao, padding: '2px 6px' }} disabled={i === 0} onClick={() => moverFundo(i, -1)}>
                    ↑
                  </button>
                  <button type="button" title="Descer" style={{ ...botao, padding: '2px 6px' }} disabled={i === cores.length - 1} onClick={() => moverFundo(i, 1)}>
                    ↓
                  </button>
                </span>
                <button type="button" title="Apagar fundo" style={{ ...botao, padding: '4px 0', textAlign: 'center' }} onClick={() => apagarFundo(c)}>
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ) : null}
      <button
        type="button"
        style={{ ...botao, justifySelf: 'start' }}
        onClick={() => mudarFundos([...cores, { slug: `fundo-${crypto.randomUUID().slice(0, 8)}`, nome: `Fundo ${cores.length + 1}`, hex: '#FFFFFF', categoria: 'claro' }])}
      >
        + Novo fundo
      </button>
    </div>
  )

  // ------------------------------------------------------------ tela
  const porCategoria = CATEGORIAS.map((c) => ({ ...c, n: dados.versoes.filter((v) => corDe(v.fundo)?.categoria === c.valor).length }))

  return (
    <div style={{ display: 'grid', gap: 20, margin: '8px 0 32px' }}>
      <details style={{ fontSize: 13, color: cinza }}>
        <summary style={{ cursor: 'pointer' }}>Como exportar os SVGs no Illustrator</summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Exportar como &gt; SVG. Estilo: Atributos de apresentação. Fonte: Converter em contornos. IDs de objeto: Nomes de camada. Minificar: desligado. Responsivo: ligado.</li>
          <li>Todas as versões na mesma escala (Ajustar prancheta aos limites da arte, sem redimensionar a arte).</li>
          <li>Nome do arquivo: nome-do-cliente-lockup-variante-fundo-cor.svg (ex.: cereja-bloom-horizontal-sombra-fundo-preto.svg). O lockup e a variante ajudam a sugerir os grupos; o fundo você escolhe aqui.</li>
          <li>Referência x: um arquivo chamado X.svg (ex.: só o &quot;c&quot; da marca), na mesma escala.</li>
          <li>Grupos com nome (simbolo, logotipo, assinatura, sombra ou qualquer nome seu) viram partes nas medidas. Furos vazados de verdade, sem forma branca por cima.</li>
        </ul>
      </details>

      {/* referencia x */}
      <div style={caixaSecao}>
        <strong>Referência x</strong>
        {dados.refX ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 60, border: borda, borderRadius: 4, background: '#f3f3f0' }}>
              <Svg svg={dados.refX.svg} altura={50} />
            </div>
            <span style={{ fontSize: 13 }}>
              {dados.refX.nome}
              <br />
              <span style={{ color: cinza }}>
                {(dados.refX.divisor || 1) === 1 ? 'A altura deste desenho é o x de todas as versões.' : `O x de todas as versões é a altura deste desenho dividida por ${String(dados.refX.divisor).replace('.', ',')}.`}
              </span>
            </span>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              x = altura ÷
              <input
                style={{ ...campo, width: 70 }}
                type="number"
                min={1}
                step={0.5}
                value={dados.refX.divisor || 1}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  salvar({ refX: { ...dados.refX!, divisor: n > 0 ? n : 1 } })
                }}
              />
            </label>
            <button type="button" style={botao} onClick={() => salvar({ refX: null })}>
              Remover
            </button>
          </div>
        ) : (
          <Soltar rotulo="Solte aqui o X.svg (ou envie junto com as versões: o nome X.svg é reconhecido sozinho)" aoSoltar={receber} />
        )}
      </div>

      {/* fundos */}
      {quadroFundos()}

      {/* versoes */}
      <div style={caixaSecao}>
        <strong>
          Versões da marca ({dados.versoes.length})
          {dados.versoes.length ? (
            <span style={{ fontWeight: 400, color: cinza, fontSize: 12 }}> · {porCategoria.map((c) => `${c.titulo}: ${c.n}`).join(' · ')}</span>
          ) : null}
        </strong>
        <Soltar multiplo rotulo="Arraste aqui todos os SVGs de uma vez (ou clique para escolher)" aoSoltar={receber} />
        {erro ? <p style={{ color: 'var(--theme-error-500)', margin: 0, fontSize: 13 }}>{erro}</p> : null}
        {semFundo.length ? (
          <div style={{ border: '1px solid var(--theme-warning-500, #d9a400)', background: 'var(--theme-warning-100, #fff6d6)', borderRadius: 6, padding: 12, fontSize: 13 }}>
            <strong>{semFundo.length} {semFundo.length === 1 ? 'versão sem fundo' : 'versões sem fundo'}</strong> (não aparecem em Versões da marca): {semFundo.map((v) => v.arquivo).join(', ')}
          </div>
        ) : null}

        {recentes.length ? (
          <div style={{ border: `1px solid ${COR_COTA}`, borderRadius: 6, padding: 12, display: 'grid', gap: 10 }}>
            <strong style={{ fontSize: 13 }}>Acabaram de entrar ({recentes.length}): confira</strong>
            <span style={{ fontSize: 12, color: cinza }}>
              Já estão no manual (falta só o Salvar lá em cima). Escolha o fundo e o grupo de cada uma. Arquivo com o mesmo nome substituiu o anterior (e manteve o fundo e o grupo dele).
            </span>
            {tabela(dados.versoes.filter((v) => recentes.includes(v.id)))}
            <button type="button" style={{ ...botaoForte, justifySelf: 'start' }} onClick={() => setRecentes([])}>
              Ok, conferido
            </button>
          </div>
        ) : null}

        {dados.versoes.length ? (
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 13 }}>Ver e editar todas as versões</summary>
            <div style={{ marginTop: 10 }}>{tabela([...dados.versoes].sort((a, b) => a.arquivo.localeCompare(b.arquivo)))}</div>
          </details>
        ) : null}
      </div>

      {/* grupos */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ marginRight: 'auto' }}>Grupos ({dados.grupos.length})</strong>
          {semGrupo.length ? (
            <button type="button" style={botao} onClick={() => salvar(sugerirGrupos(dados))}>
              Sugerir grupos pelos nomes
            </button>
          ) : null}
          <button type="button" style={botaoForte} onClick={() => criarGrupo()}>
            Novo grupo
          </button>
        </div>
        <span style={{ fontSize: 12, color: cinza }}>
          A ordem dos grupos é a ordem no manual. Em cada grupo, marque onde ele aparece. Em Dimensões e Área de segurança, cada versão do grupo ganha o próprio desenho (até 4 por página).
        </span>
        {semGrupo.length ? (
          <div style={{ border: '1px solid var(--theme-warning-500, #d9a400)', background: 'var(--theme-warning-100, #fff6d6)', borderRadius: 6, padding: 12, fontSize: 13 }}>
            <strong>{semGrupo.length} {semGrupo.length === 1 ? 'versão sem grupo' : 'versões sem grupo'}</strong> (não aparecem no manual): {semGrupo.map((v) => v.arquivo).join(', ')}
          </div>
        ) : null}
        {dados.grupos.map(quadroGrupo)}
      </div>

      {/* usos incorretos */}
      {dados.versoes.length ? quadroIncorretos() : null}
    </div>
  )
}
