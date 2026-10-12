import type { Metadata } from 'next'
import type { ComponentType, SVGProps } from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowDown, ArrowRight, Clipboard, Clock, CreditCard, Dollar, Globe, InfoBox, Instagram, Mail, Trophy, User, Whatsapp } from 'pixelarticons/react'
import MediaView from '@/components/MediaView'
import { Logo } from '@/components/Brand'
import BotaoPdf from '@/components/orcamentos/landing/BotaoPdf'
import MenuMobile from '@/components/orcamentos/landing/MenuMobile'
import { IconeEntrega } from '@/components/orcamentos/landing/Icones'
import { formatBRL } from '@/lib/format'
import { formatDias } from '@/lib/orcamentos/propostas'
import { getOrcamento, type ContatoView, type Orcamento, type PropostaView } from '@/lib/orcamentos/publico'

// Pagina do orcamento para o cliente, na identidade do Joycombo (a mesma do
// site): menu com ancoras, secoes alternando branco e cinza, titulos pretos
// com icone do pixelarticons e cantos de pixel. Sempre gerada na hora
// (status e validade mudam). Fora do sitemap e da busca.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }
type Icone = ComponentType<SVGProps<SVGSVGElement>>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await getOrcamento((await params).token)
  return { title: o ? `${o.tituloCapa} · ${o.cliente} · Joycombo` : 'Orçamento · Joycombo' }
}

const NOTA_ASTERISCO =
  '* A data da entrega final e o valor podem variar dependendo do recebimento de informações do cliente e do escopo do projeto.'

// Fundo das secoes em sequencia: branco, cinza, branco... O card de dentro
// usa a cor oposta para destacar.
const FUNDOS = [
  { secao: 'bg-white', card: 'bg-paper' },
  { secao: 'bg-paper', card: 'bg-white' },
]
type Fundo = (typeof FUNDOS)[number]

export default async function OrcamentoPage({ params }: Props) {
  const o = await getOrcamento((await params).token)
  if (!o) notFound()

  if (o.expirado) {
    return (
      <>
        <Topo itens={[]} />
        <main>
          <Secao id="expirado" fundo={FUNDOS[0]} icone={InfoBox} titulo="Esse orçamento expirou">
            <p className="max-w-2xl text-lg text-muted-light">
              Os valores e prazos podem ter mudado. Entre em contato que eu preparo um orçamento atualizado.
            </p>
            <Contatos contatos={o.contatos} className="mt-10" />
          </Secao>
        </main>
      </>
    )
  }

  // Secoes do meio, na ordem, com a ancora do menu e o fundo alternado
  type Bloco = { id: string; menu?: string; render: (fundo: Fundo) => React.ReactNode }
  const blocos: Bloco[] = []
  if (o.sobre) {
    const sobre = o.sobre
    blocos.push({ id: 'sobre', menu: sobre.titulo, render: (f) => <Sobre sobre={sobre} fundo={f} /> })
  }
  o.cases.forEach((c, i) => blocos.push({ id: `case-${i + 1}`, menu: i === 0 ? 'Cases' : undefined, render: (f) => <Case id={`case-${i + 1}`} c={c} fundo={f} /> }))
  o.propostas.forEach((p, i) =>
    blocos.push({ id: `proposta-${p.numero}`, menu: i === 0 ? 'Propostas' : undefined, render: (f) => <Proposta p={p} fundo={f} /> }),
  )
  if (o.parcelamento.length) blocos.push({ id: 'pagamento', menu: 'Pagamento', render: (f) => <Parcelamento linhas={o.parcelamento} fundo={f} /> })
  if (o.outrasInformacoes.length)
    blocos.push({ id: 'informacoes', menu: 'Informações', render: (f) => <OutrasInformacoes itens={o.outrasInformacoes} fundo={f} /> })

  const menu = [
    ...blocos.filter((b) => b.menu).map((b) => ({ href: `#${b.id}`, label: b.menu as string })),
    ...(o.contraCapa ? [{ href: '#contato', label: 'Contato' }] : []),
  ]

  return (
    <>
      {o.rascunho && (
        <p className="bg-accent px-4 py-2 text-center text-sm font-semibold text-black">
          Rascunho: só você (logado) vê esta página. Mude o status para Enviado antes de mandar o link.
        </p>
      )}
      <Topo itens={menu} token={o.token} />
      <main className="pb-24 md:pb-0">
        {o.capa && <Capa o={o} primeira={blocos[0] ? `#${blocos[0].id}` : '#contato'} />}
        {blocos.map((b, i) => (
          <div key={b.id}>{b.render(FUNDOS[i % 2])}</div>
        ))}
        {o.contraCapa && <ContraCapa contatos={o.contatos} />}
      </main>
      {/* celular: fixo no rodape (no desktop fica no menu) */}
      <BotaoPdf token={o.token} className="fixed inset-x-4 bottom-4 z-50 md:hidden" />
    </>
  )
}

// ------------------------------------------------------------------ partes

/** Menu fixo com o logo e as ancoras das secoes (como o topo do site) */
function Topo({ itens, token }: { itens: { href: string; label: string }[]; token?: string }) {
  return (
    <header className="on-dark sticky top-0 z-40 bg-black text-white">
      <div className="container-site relative flex h-16 items-center gap-6">
        <a href="#topo" aria-label="Início do orçamento" className="shrink-0">
          <Logo className="h-5 w-auto md:h-6" />
        </a>
        {!!itens.length && (
          <nav aria-label="Seções do orçamento" className="hidden flex-1 justify-end md:flex">
            <ul className="flex gap-5 whitespace-nowrap text-sm font-semibold">
              {itens.map((i) => (
                <li key={i.href}>
                  <a href={i.href} className="text-white/80 transition-colors hover:text-accent">
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {!!itens.length && <MenuMobile itens={itens} />}
        {token && <BotaoPdf token={token} className="btn-sm ml-auto hidden shrink-0 md:inline-flex" />}
      </div>
    </header>
  )
}

/** Titulo de secao: icone num quadrado verde + titulo preto, como os do site */
function Titulo({ icone: I, titulo, subtitulo, numero }: { icone: Icone; titulo: string; subtitulo?: string; numero?: number }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-start md:justify-between md:gap-6">
      {numero !== undefined && <span className="font-title text-3xl font-bold text-black md:order-2 md:text-5xl">#{numero}</span>}
      <div>
        <div className="flex items-center gap-4">
          <span className="pixel-box grid h-12 w-12 shrink-0 place-items-center bg-accent text-black md:h-14 md:w-14" style={{ ['--p' as string]: '4px' }}>
            <I className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
          </span>
          <h2 className="title text-black">{titulo}</h2>
        </div>
        {subtitulo && <p className="mt-2 pl-16 font-semibold text-muted-light md:pl-[4.5rem]">{subtitulo}</p>}
      </div>
    </div>
  )
}

function Secao({ id, fundo, icone, titulo, subtitulo, numero, children }: { id: string; fundo: Fundo; icone: Icone; titulo: string; subtitulo?: string; numero?: number; children: React.ReactNode }) {
  return (
    <section id={id} className={`section on-light scroll-mt-16 text-black ${fundo.secao}`}>
      <div className="container-site">
        <Titulo icone={icone} titulo={titulo} subtitulo={subtitulo} numero={numero} />
        {children}
      </div>
    </section>
  )
}

function Capa({ o, primeira }: { o: Orcamento; primeira: string }) {
  return (
    <section id="topo" className="on-dark relative flex min-h-[calc(100svh-4rem)] flex-col bg-black text-white">
      <div className="container-site flex flex-1 flex-col justify-center py-16">
        <Logo className="h-8 w-auto self-start md:h-12" />
        <p className="mt-10 font-semibold text-white/70 md:text-lg">{o.data}</p>
        <span className="kicker mt-6 self-start">Orçamento</span>
        <h1 className="title mt-4 max-w-4xl text-[clamp(2.4rem,1.6rem+4vw,5rem)]">{o.tituloCapa}</h1>
        {o.cliente && <p className="mt-6 text-lg text-white/70 md:text-xl">Para {o.cliente}</p>}
      </div>
      <a href={primeira} className="container-site flex items-center gap-2 pb-28 text-sm font-bold uppercase md:pb-8 tracking-[0.12em] text-white/80 transition-colors hover:text-accent">
        Visualizar orçamento
        <ArrowDown className="h-5 w-5 animate-bounce" aria-hidden />
      </a>
    </section>
  )
}

function Sobre({ sobre, fundo }: { sobre: NonNullable<Orcamento['sobre']>; fundo: Fundo }) {
  const m = sobre.midia
  return (
    <Secao id="sobre" fundo={fundo} icone={User} titulo={sobre.titulo}>
      <div className="grid items-start gap-10 md:grid-cols-[3fr_2fr] md:gap-16">
        {m?.url && (
          <div className="pixel-box relative aspect-[4/5] overflow-hidden bg-black md:order-2" style={{ ['--p' as string]: '8px' }}>
            <MediaView src={m.url} mimeType={m.mimeType} alt={m.alt || sobre.nome} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
        )}
        <div className="md:order-1">
          <h3 className="font-title text-2xl font-bold uppercase">{sobre.nome}</h3>
          <div className="mt-4 space-y-4 text-lg leading-relaxed">
            {sobre.texto.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {!!sobre.cards.length && (
            <dl className="mt-10 grid grid-cols-2 gap-3 md:gap-4">
              {sobre.cards.map((c) => (
                <div key={c.value + c.label} className={`pixel-box p-5 ${fundo.card}`} style={{ ['--p' as string]: '6px' }}>
                  <dt className="sr-only">{c.label}</dt>
                  <dd>
                    <span className="block font-title text-3xl font-bold md:text-4xl">{c.value}</span>
                    <span className="mt-1 block text-sm text-muted-light">{c.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </Secao>
  )
}

function Case({ id, c, fundo }: { id: string; c: Orcamento['cases'][number]; fundo: Fundo }) {
  return (
    <Secao id={id} fundo={fundo} icone={Trophy} titulo={c.nome} subtitulo={c.subtitulo}>
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-14">
        <div className="order-2 md:order-1">
          <div className="space-y-4 text-lg leading-relaxed">
            {c.texto.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {c.link && (
            <a href={c.link} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-8 hover:bg-accent hover:text-black">
              Case completo
              <ArrowRight aria-hidden />
            </a>
          )}
        </div>
        {!!c.imagens.length && (
          <div className="order-1 grid gap-3 md:order-2">
            {c.imagens.map((img) => (
              <div key={img.id} className={`pixel-box relative aspect-[16/10] overflow-hidden ${fundo.card}`} style={{ ['--p' as string]: '6px' }}>
                <Image src={img.url as string} alt={img.alt || c.nome} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Secao>
  )
}

function Proposta({ p, fundo }: { p: PropostaView; fundo: Fundo }) {
  const prazoEValor = (
    <div className="on-dark pixel-box bg-black p-6 text-white" style={{ ['--p' as string]: '6px' }}>
      <div className="flex items-center gap-4">
        <Clock className="h-7 w-7 shrink-0 text-accent" aria-hidden />
        <div>
          <p className="text-sm text-white/70">Prazo total estimado</p>
          <p className="font-title text-2xl font-bold">{formatDias(p.prazo)}*</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Dollar className="h-7 w-7 shrink-0 text-accent" aria-hidden />
        <div>
          <p className="text-sm text-white/70">Investimento total</p>
          <p className="font-title text-2xl font-bold">{p.valor !== null ? `${formatBRL(p.valor)}*` : 'Sob consulta'}</p>
        </div>
      </div>
    </div>
  )

  const escopo = (
    <div className={`pixel-box p-6 text-sm leading-relaxed ${fundo.card}`} style={{ ['--p' as string]: '6px' }}>
      <h4 className="mb-2 font-bold">Escopo da proposta</h4>
      <div className="space-y-2 text-muted-light">
        {p.escopo1.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
      {!!p.escopo2.length && (
        <div className="mt-4 space-y-2 font-bold">
          {p.escopo2.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      )}
      {!!p.escopo3.length && (
        <>
          <h4 className="mb-2 mt-8 font-bold">Como funcionam os sprints?</h4>
          <div className="space-y-2 text-muted-light">
            {p.escopo3.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (
    <Secao id={`proposta-${p.numero}`} fundo={fundo} icone={Clipboard} titulo={p.nome} subtitulo={p.subtitulo} numero={p.numero}>
      {/* celular: prazo e investimento logo abaixo do titulo */}
      <div className="mb-8 md:hidden">{prazoEValor}</div>

      <div className="grid gap-8 md:grid-cols-[7fr_3fr] md:gap-10">
        <div>
          <div className="hidden grid-cols-[28%_1fr_30%] gap-4 border-b border-line-light pb-3 text-sm font-bold md:grid">
            <span>Sprints e atividades</span>
            <span className="text-right md:pr-4">Prazo</span>
            <span>Entrega</span>
          </div>
          <ol>
            {p.sprints.map((s) => (
              <li key={s.numero} className="grid gap-4 border-b border-line-light py-6 md:grid-cols-[28%_1fr_30%]">
                <div className="flex gap-3">
                  <span className="pixel-box grid h-11 w-11 shrink-0 place-items-center bg-accent font-title text-lg font-bold text-black" style={{ ['--p' as string]: '3px' }}>
                    {s.numero}
                  </span>
                  <div>
                    <h3 className="font-title text-lg font-bold uppercase leading-tight [hyphens:auto] [overflow-wrap:anywhere]">{s.nome}</h3>
                    {s.descricao && <p className="mt-1 text-sm text-muted-light">{s.descricao}</p>}
                  </div>
                </div>
                <ul className="self-start">
                  {s.itens.map((item, n) => (
                    <li key={item.nome} className={`flex justify-between gap-4 px-3 py-1.5 text-sm ${n % 2 === 0 ? fundo.card : ''}`}>
                      <span>{item.nome}</span>
                      <span className="shrink-0 text-muted-light">{formatDias(item.dias)}</span>
                    </li>
                  ))}
                </ul>
                {s.entregaTexto && (
                  <div className={`pixel-box flex items-start gap-3 self-start p-4 ${fundo.card}`} style={{ ['--p' as string]: '4px' }}>
                    <span className="pixel-box grid h-10 w-10 shrink-0 place-items-center bg-accent text-black" style={{ ['--p' as string]: '4px' }}>
                      <IconeEntrega nome={s.entregaIcone} className="h-5 w-5" />
                    </span>
                    <p className="text-sm text-muted-light">{s.entregaTexto}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <aside className="flex flex-col gap-6">
          {escopo}
          <div className="hidden md:block">{prazoEValor}</div>
        </aside>
      </div>

      <p className="mt-8 text-xs text-muted-light">{NOTA_ASTERISCO}</p>
    </Secao>
  )
}

function Parcelamento({ linhas, fundo }: { linhas: string[]; fundo: Fundo }) {
  return (
    <Secao id="pagamento" fundo={fundo} icone={CreditCard} titulo="Pagamento">
      <div className="grid max-w-4xl gap-4">
        {linhas.map((linha, i) => (
          <div key={linha} className={`pixel-box flex flex-col gap-2 p-5 md:flex-row md:items-start md:gap-4 md:p-6 ${fundo.card}`} style={{ ['--p' as string]: '6px' }}>
            <span className="font-title text-2xl font-bold">#{i + 1}</span>
            <p className="text-lg md:pt-1">{linha}</p>
          </div>
        ))}
      </div>
    </Secao>
  )
}

function OutrasInformacoes({ itens, fundo }: { itens: Orcamento['outrasInformacoes']; fundo: Fundo }) {
  return (
    <Secao id="informacoes" fundo={fundo} icone={InfoBox} titulo="Outras informações">
      <ul className="pixel-list max-w-3xl space-y-4 text-lg leading-relaxed">
        {itens.map((item) => (
          <li key={item.texto}>
            {item.texto}
            {!!item.subitens.length && (
              <ul className="pixel-list mt-3 space-y-1 text-base text-muted-light">
                {item.subitens.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Secao>
  )
}

const ICONE_CONTATO = { whatsapp: Whatsapp, email: Mail, instagram: Instagram, site: Globe }

function Contatos({ contatos, className = '', escuro = false }: { contatos: ContatoView[]; className?: string; escuro?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {contatos.map((c) => {
        const I = ICONE_CONTATO[c.tipo]
        return (
          <a
            key={c.tipo}
            href={c.href}
            target={c.tipo === 'email' ? undefined : '_blank'}
            rel="noopener noreferrer"
            className={`btn ${c.tipo === 'whatsapp' ? 'btn-accent' : escuro ? 'btn-light' : 'btn-dark'}`}
          >
            <I aria-hidden />
            {c.label}
          </a>
        )
      })}
    </div>
  )
}

function ContraCapa({ contatos }: { contatos: ContatoView[] }) {
  return (
    <section id="contato" className="on-dark scroll-mt-16 bg-black py-24 text-white md:py-32">
      <div className="container-site">
        <Logo className="h-8 w-auto md:h-10" />
        <h2 className="title mt-10">Obrigado pela atenção!</h2>
        <p className="mt-4 text-lg text-white/70 md:text-xl">Qualquer dúvida, é só chamar:</p>
        <Contatos contatos={contatos} className="mt-8" escuro />
      </div>
    </section>
  )
}
