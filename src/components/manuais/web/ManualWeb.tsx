import Image from './ImagemManual'
import { Logo } from '@/components/Brand'
import MenuLateral, { type ItemMenu } from '@/components/manuais/web/MenuLateral'
import BaixarVersao from '@/components/manuais/web/BaixarVersao'
import { COR_COTA, DiagramaDimensoes, DiagramaSeguranca, LegendaX } from '@/components/manuais/Diagramas'
import { DesenhoIncorreto, DesenhoSimples } from '@/components/manuais/Incorretos'
import type { Bloco, Fonte, Img, Manual, Pagina } from '@/lib/manuais/publico'

const TEXTO_DIMENSOES =
  'Essas são as proporções usadas na composição da marca. Conhecer essas relações ajuda a aplicar a marca fisicamente, como em letreiros e fachadas.'
const TEXTO_REDUCAO = [
  'Relação das reduções sugeridas para a reprodução da marca em meio físico e digital, mantendo sua legibilidade.',
  'Ao projetar para meios digitais, considere tanto os padrões de redução física (mm) quanto os de pixelização (px), sempre levando em conta a densidade das telas.',
  'Valores com base na largura da marca.',
]
const OBS_REDUCAO =
  'Obs.: os tamanhos da marca ao lado são meramente ilustrativos. As medidas foram definidas em testes de impressão e em tela. Respeite as medidas em milímetros e pixels para garantir a integridade da marca.'
const TEXTO_INCORRETOS =
  'Estes são exemplos de como a marca não deve ser utilizada. O correto é sempre aplicar as opções das páginas anteriores, respeitando com fidelidade cores, formas e proporções.'
const TEXTO_SEGURANCA =
  'A área de segurança é a margem externa que deve ser respeitada nas aplicações da marca. Nenhuma outra informação textual ou visual pode entrar nessa margem, para garantir a integridade da marca.'

/** Fundo escuro pede texto claro */
function escuro(hex: string) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2] < 0.45
}

// Manual de marca (versao web): paginas 16:9 em sequencia e menu lateral.
// So desenha a partir do Manual ja montado (getManual).

const dois = (n: number) => String(n).padStart(2, '0')

function Foto({ img, sizes, legenda }: { img: Img; sizes: string; legenda?: string }) {
  return (
    <div className="mn-foto">
      <Image src={img.url} alt={img.alt} fill sizes={sizes} />
      {legenda ? <span className="mn-legenda">{legenda}</span> : null}
    </div>
  )
}

function Topo({ secao, cliente, n }: { secao: string | null; cliente: string; n: number }) {
  return (
    <div className="mn-topo">
      <div>
        {secao ? <span>{secao}</span> : null}
        <span>{cliente}</span>
      </div>
      <span>{dois(n)}</span>
    </div>
  )
}

const Rodape = () => (
  <div className="mn-rodape">
    <a href="#sumario">Voltar ao sumário</a>
  </div>
)

function Paragrafos({ texto }: { texto: string[] }) {
  return (
    <>
      {texto.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  )
}

const ALFABETO = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789'

function Especime({ f }: { f: Fonte }) {
  return (
    <div>
      {f.imagem ? (
        // imagem do especime (o texto ja desenhado na fonte): no tamanho
        // original, em px da pagina de 1920; so diminui se nao couber, nunca aumenta
        <div className="mn-fonte-imagem">
          <Image
            src={f.imagem.url}
            alt={f.imagem.alt || f.nome}
            width={f.imagem.width}
            height={f.imagem.height}
            sizes="(max-width: 900px) 100vw, 60vw"
            style={{ width: `calc(var(--u) * ${f.imagem.width})` }}
          />
        </div>
      ) : (
        <>
          <div className="mn-fonte-exemplo" style={{ fontFamily: f.familia }}>
            {f.exemplo}
          </div>
          <div className="mn-fonte-alfabeto" style={{ fontFamily: f.familia }}>
            {ALFABETO}
          </div>
        </>
      )}
      <div className="mn-fonte-legenda">
        <strong>{f.nome}</strong>
        {f.papel ? <span>{f.papel}</span> : null}
        {f.link ? (
          <a href={f.link} target="_blank" rel="noopener noreferrer">
            {f.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        ) : null}
      </div>
    </div>
  )
}

function VisualDoBloco({ bloco, manual }: { bloco: Bloco; manual: Manual }) {
  switch (bloco.tipo) {
    case 'textoImagem':
      return (
        <div className={`mn-grade mn-grade-${bloco.imagens.length}`}>
          {bloco.imagens.map((img, i) => (
            <Foto key={i} img={img} sizes={bloco.imagens.length === 1 ? '(max-width: 900px) 100vw, 60vw' : '(max-width: 900px) 50vw, 30vw'} />
          ))}
        </div>
      )
    case 'antesDepois':
      return (
        <div className="mn-grade" style={{ gridTemplateRows: `repeat(${bloco.pares.length}, 1fr)` }}>
          {bloco.pares.map((p, i) => (
            <div key={i} className="mn-par">
              <Foto img={p.antes} sizes="(max-width: 900px) 50vw, 30vw" legenda="Antes" />
              <Foto img={p.depois} sizes="(max-width: 900px) 50vw, 30vw" legenda="Depois" />
            </div>
          ))}
        </div>
      )
    case 'paleta':
      return (
        <div className="mn-paleta">
          {manual.paleta.map((g, i) => (
            // o primeiro grupo (principais) em destaque; os outros menores, numa linha so
            <div key={g.nome} className={`mn-paleta-grupo ${i === 0 ? 'mn-paleta-principal' : 'mn-paleta-secundaria'}`}>
              <h3>{g.nome}</h3>
              <div
                className="mn-cores"
                style={{ gridTemplateColumns: i === 0 ? `repeat(${g.cores.length}, minmax(0, calc(var(--u) * 250)))` : `repeat(${g.cores.length}, minmax(0, 1fr))` }}
              >
                {g.cores.map((c) => (
                  <div key={c.hex + c.nome} className="mn-cor">
                    <div className="mn-cor-amostra" style={{ background: c.hex }} />
                    <strong>{c.nome}</strong>
                    HEX {c.hex}
                    <br />
                    RGB {c.rgb}
                    <br />
                    CMYK {c.cmyk}
                    {c.pantone ? (
                      <>
                        <br />
                        Pantone {c.pantone}
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    case 'tipografia':
      return (
        <div className={`mn-fontes mn-fontes-${bloco.fontes.length}`}>
          {bloco.fontes.map((f, i) => (
            <Especime key={i} f={f} />
          ))}
        </div>
      )
  }
}

function ConteudoDaPagina({ p, manual }: { p: Pagina; manual: Manual }) {
  switch (p.tipo) {
    case 'capa':
      return (
        <div className="mn-in" style={{ padding: 0 }}>
        <div className="mn-capa">
          <div className={`mn-capa-lado ${manual.capa ? '' : 'mn-cheia'}`}>
            <Logo style={{ width: 'calc(var(--u) * 150)', color: '#ffffff', opacity: 0.6 }} />
            <div>
              <h1>Manual de Marca</h1>
              <div className="mn-cliente">{manual.cliente}</div>
            </div>
          </div>
          {manual.capa ? (
            <div className="mn-capa-imagem">
              <Image src={manual.capa.url} alt={manual.capa.alt} fill sizes="(max-width: 900px) 100vw, 60vw" style={{ objectFit: 'cover' }} priority />
            </div>
          ) : null}
        </div>
        </div>
      )
    case 'apresentacao':
      return (
        <div className="mn-in">
          <div className="mn-centro">
            <Paragrafos texto={p.texto} />
          </div>
        </div>
      )
    case 'sumario': {
      return (
        <div className="mn-in">
          <Topo secao="Sumário" cliente={manual.cliente} n={p.n} />
          <div className="mn-sumario">
            {manual.sumario.map((s) => (
              <div key={s.id} className="mn-sumario-col">
                <a href={`#${s.id}`} className="mn-sumario-secao">
                  <span>{s.titulo}</span>
                  <span>{dois(s.n)}</span>
                </a>
                {s.itens.map((i) => (
                  <a key={i.id} href={`#${i.id}`} className="mn-sumario-item">
                    <span>{i.titulo}</span>
                    <span>{dois(i.n)}</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'divisoria':
      return (
        <div className="mn-in">
          <div className="mn-divisoria">
            <h2>
              {p.ordem}. {p.titulo}
            </h2>
            <Paragrafos texto={p.texto} />
          </div>
          <Rodape />
        </div>
      )
    case 'bloco':
      return (
        <div className="mn-in">
          <Topo secao={p.secao} cliente={manual.cliente} n={p.n} />
          <div className="mn-meio">
            <div className="mn-texto">
              <h2 className="mn-titulo">
                {dois(p.ordem)}. {p.bloco.titulo}
              </h2>
              <Paragrafos texto={p.bloco.texto} />
            </div>
            <div className="mn-visual">
              <VisualDoBloco bloco={p.bloco} manual={manual} />
            </div>
          </div>
          <Rodape />
        </div>
      )
    case 'aplicacao':
      return (
        <div className="mn-in mn-in-sangria" style={{ padding: 0 }}>
          <div className={`mn-sangria ${p.layout === 'dupla' ? 'mn-sangria-dupla' : ''}`}>
            {p.imagens.map((img, i) => (
              <Foto key={i} img={img} sizes={p.layout === 'dupla' ? '(max-width: 900px) 100vw, 50vw' : '100vw'} />
            ))}
          </div>
          <a href="#sumario" className="mn-voltar-flutuante">
            Voltar ao sumário
          </a>
        </div>
      )
    case 'versoes': {
      // grade fixa de 2 x 3: o tamanho das marcas e o mesmo em todas as paginas
      const altura = 170
      return (
        <div className="mn-in">
          <Topo secao={p.secao} cliente={manual.cliente} n={p.n} />
          <div className="mn-versoes">
            <div className="mn-texto">
              <h2 className="mn-titulo">{dois(p.ordem)}. Versões da Marca</h2>
              <p>{p.subtitulo}</p>
              <p className="mn-dica-baixar">Para baixar uma versão, é só clicar na marca escolhida.</p>
            </div>
            <div className="mn-versoes-grade" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}>
              {p.itens.map((item, i) => (
                <figure key={i} className="mn-versao">
                  <BaixarVersao arquivo={item.arquivo} svg={item.svg} png={item.png}>
                    <svg
                      viewBox={`${item.svg.viewBox.x} ${item.svg.viewBox.y} ${item.svg.viewBox.w} ${item.svg.viewBox.h}`}
                      style={{ height: `calc(var(--u) * ${altura})` }}
                      dangerouslySetInnerHTML={{ __html: item.svg.conteudo }}
                    />
                  </BaixarVersao>
                  <figcaption>{item.rotulo}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <Rodape />
        </div>
      )
    }
    case 'dimensoes':
    case 'seguranca': {
      const dim = p.tipo === 'dimensoes'
      // ate 4 desenhos: 1 ocupa tudo, 2 empilhados, 3 ou 4 em grade 2x2
      const n = p.desenhos.length
      const colunas = n >= 3 ? 2 : 1
      const linhas = Math.ceil(n / colunas)
      const gap = 40
      const legenda = 36
      const largura = Math.floor((1140 - gap * (colunas - 1)) / colunas)
      const altura = Math.floor((780 - gap * (linhas - 1)) / linhas) - legenda
      return (
        <div className="mn-in">
          <Topo secao={p.secao} cliente={manual.cliente} n={p.n} />
          <div className="mn-meio">
            <div className="mn-texto mn-texto-norma">
              <div>
                <h2 className="mn-titulo">
                  {dois(p.ordem)}. {dim ? 'Dimensões da Marca' : 'Área de Segurança'}
                </h2>
                <p>{dim ? TEXTO_DIMENSOES : TEXTO_SEGURANCA}</p>
              </div>
              <LegendaX texto={p.textoX} referencia={p.refX ? { marca: p.refX.svg, caixa: p.refX.caixa } : undefined} />
            </div>
            <div className="mn-visual mn-desenhos" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
              {p.desenhos.map((d, i) => (
                <figure key={i} className="mn-desenho" style={d.fundo ? { background: d.fundo } : undefined}>
                  {dim ? (
                    <DiagramaDimensoes marca={d.svg} medicao={d.medicao} largura={largura} altura={altura} />
                  ) : (
                    <DiagramaSeguranca marca={d.svg} medicao={d.medicao} largura={largura} altura={altura} />
                  )}
                  <figcaption>{d.rotulo}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <Rodape />
        </div>
      )
    }
    case 'reducao': {
      const colunas = p.itens.length > 4 ? 3 : 2
      return (
        <div className="mn-in">
          <Topo secao={p.secao} cliente={manual.cliente} n={p.n} />
          <div className="mn-meio">
            <div className="mn-texto mn-texto-norma">
              <div>
                <h2 className="mn-titulo">{dois(p.ordem)}. Redução Máxima</h2>
                {TEXTO_REDUCAO.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              <p className="mn-obs">{OBS_REDUCAO}</p>
            </div>
            <div className="mn-visual mn-reducoes" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
              {p.itens.map((it, i) => {
                // tamanho ilustrativo: cresce com a largura minima, dentro de limites
                const largura = Math.min(420, Math.max(140, (it.px || 100) * 2.4))
                const vb = it.svg.viewBox
                return (
                  <figure key={i} className="mn-reducao" style={it.fundo ? { background: it.fundo } : undefined}>
                    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} style={{ width: `calc(var(--u) * ${largura})` }} dangerouslySetInnerHTML={{ __html: it.svg.conteudo }} />
                    <svg viewBox={`0 0 ${largura} 14`} style={{ width: `calc(var(--u) * ${largura})`, overflow: 'visible' }}>
                      <line x1={0} y1={7} x2={largura} y2={7} stroke={COR_COTA} strokeWidth={1.2} />
                      <line x1={0} y1={1} x2={0} y2={13} stroke={COR_COTA} strokeWidth={1.2} />
                      <line x1={largura} y1={1} x2={largura} y2={13} stroke={COR_COTA} strokeWidth={1.2} />
                    </svg>
                    <figcaption>
                      <span className="mn-medida">{[it.px ? `${it.px}px` : '', it.mm ? `${String(it.mm).replace('.', ',')}mm` : ''].filter(Boolean).join(' / ') || 'definir medida'}</span>
                      <span>{it.rotulo}</span>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
          <Rodape />
        </div>
      )
    }
    case 'incorretos':
      return (
        <div className="mn-in">
          <Topo secao={p.secao} cliente={manual.cliente} n={p.n} />
          <div className="mn-meio">
            <div className="mn-texto mn-texto-norma">
              <div>
                <h2 className="mn-titulo">{dois(p.ordem)}. Usos Incorretos</h2>
                <p>{TEXTO_INCORRETOS}</p>
              </div>
              <div>
                <p>Abaixo, uma referência do uso correto, para comparação:</p>
                <div className="mn-correto" style={p.referencia.fundo ? { background: p.referencia.fundo } : undefined}>
                  <DesenhoSimples svg={p.referencia.svg} />
                </div>
              </div>
            </div>
            <div className="mn-visual mn-incorretos">
              {p.itens.map((it, i) => (
                <figure key={it.id} className="mn-incorreto">
                  <div className="mn-incorreto-desenho" style={it.fundo && it.tipo !== 'contraste' ? { background: it.fundo } : undefined}>
                    {it.tipo === 'personalizado' ? (
                      <DesenhoSimples svg={it.svg} />
                    ) : (
                      <DesenhoIncorreto id={`inc-${p.id}-${i}`} tipo={it.tipo} svg={it.svg} medicao={it.medicao} contraste={it.contraste} />
                    )}
                  </div>
                  <figcaption>
                    <span>{dois(i + 1 + (Number(p.id.split('-').pop()) - 1) * 6)}</span> {it.rotulo}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <Rodape />
        </div>
      )
    case 'creditos':
      return (
        <div className="mn-in">
          <div className="mn-creditos">
            <h2>Responsável pelo projeto</h2>
            <Logo className="mn-logo" style={{ color: '#ffffff' }} />
            <p style={{ marginBottom: 'calc(var(--u) * 48)' }}>
              <a href="https://joycombo.com.br" target="_blank" rel="noopener noreferrer">
                joycombo.com.br
              </a>
            </p>
            <Paragrafos texto={p.texto} />
          </div>
          <Rodape />
        </div>
      )
  }
}

const ESCURAS = new Set(['divisoria', 'creditos'])

export default function ManualWeb({ manual }: { manual: Manual }) {
  // menu: inicio + secoes (com as paginas do universo visual)
  const menu: ItemMenu[] = [
    { titulo: 'Capa', id: 'capa', n: 1 },
    { titulo: 'Apresentação', id: 'apresentacao', n: 2 },
    { titulo: 'Sumário', id: 'sumario', n: 3 },
    ...manual.sumario.map((s) => ({ titulo: s.titulo, id: s.id, n: s.n, secao: true, itens: s.itens })),
    ...manual.paginas.filter((p) => p.tipo === 'creditos').map((p) => ({ titulo: 'Créditos', id: p.id, n: p.n, secao: true })),
  ]

  return (
    <>
      {manual.fontes.map((f) => (f.googleUrl ? <link key={f.googleUrl} rel="stylesheet" href={f.googleUrl} /> : null))}
      {manual.fontes.some((f) => f.fontFace) ? <style>{manual.fontes.map((f) => f.fontFace || '').join('\n')}</style> : null}
      <MenuLateral cliente={manual.cliente} itens={menu} arquivo={`manual-de-marca-${manual.slug}`} zip={manual.zip} />
      <main className="mn-conteudo">
        {manual.paginas.map((p) => (
          <section
            key={p.id}
            id={p.id}
            data-pagina
            className={`mn-pagina ${ESCURAS.has(p.tipo) || ('fundo' in p && escuro(p.fundo)) ? 'mn-escura' : ''}`}
            style={'fundo' in p ? { background: p.fundo } : undefined}
          >
            <ConteudoDaPagina p={p} manual={manual} />
          </section>
        ))}
      </main>
      {manual.rascunho ? <div className="mn-aviso-rascunho">Rascunho: só você (logado) vê este manual</div> : null}
    </>
  )
}
