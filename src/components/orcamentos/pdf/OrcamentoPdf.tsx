import fs from 'fs'
import path from 'path'
import { Document, Font, Image, Link, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { formatBRL } from '@/lib/format'
import { formatDias } from '@/lib/orcamentos/propostas'
import type { ContatoView, Orcamento, PropostaView } from '@/lib/orcamentos/publico'

// PDF do orcamento em paginas (react-pdf, sem navegador), na identidade do
// Joycombo, igual a pagina do cliente: fundo branco e cinza alternados,
// titulo preto com icone verde, capa e contra capa em preto.
// Um assunto por pagina: capa, quem faz, cada case, pagamento, informacoes e
// contra capa sempre cabem numa pagina (o texto diminui se precisar). So a
// proposta, no celular, pode continuar na pagina seguinte (repete o titulo).
// Desktop: paisagem 16:10. Celular: retrato 9:16. Imagens chegam em JPG.

export type Layout = 'desktop' | 'mobile'
export type Imagens = { sobre: Buffer | null; cases: (Buffer | null)[][] }

const fontes = path.resolve(process.cwd(), 'src/fonts/pdf')
Font.register({
  family: 'Sora',
  fonts: [
    { src: path.join(fontes, 'Sora-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontes, 'Sora-SemiBold.ttf'), fontWeight: 600 },
    { src: path.join(fontes, 'Sora-Bold.ttf'), fontWeight: 700 },
  ],
})
Font.register({ family: 'Joycombo', src: path.join(fontes, 'joycombo-sora-bold.ttf'), fontWeight: 700 })
// Sem hifenizacao automatica (as regras sao do ingles)
Font.registerHyphenationCallback((palavra) => [palavra])

// Icones do pixelarticons lidos do proprio pacote (os mesmos da pagina)
function pathsDoIcone(nome: string): string[] {
  try {
    const svg = fs.readFileSync(path.resolve(process.cwd(), 'node_modules/pixelarticons/svg', `${nome}.svg`), 'utf8')
    return [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])
  } catch {
    return []
  }
}
const ICONES: Record<string, string[]> = {
  documento: pathsDoIcone('file-text'),
  fluxo: pathsDoIcone('git-branch'),
  monitor: pathsDoIcone('monitor'),
  paleta: pathsDoIcone('brush'),
  pasta: pathsDoIcone('folder'),
  foguete: pathsDoIcone('upload'),
  check: pathsDoIcone('check'),
  relogio: pathsDoIcone('clock'),
  cifrao: pathsDoIcone('dollar'),
  usuario: pathsDoIcone('user'),
  trofeu: pathsDoIcone('trophy'),
  prancheta: pathsDoIcone('clipboard'),
  cartao: pathsDoIcone('credit-card'),
  info: pathsDoIcone('info-box'),
  whatsapp: pathsDoIcone('whatsapp'),
  email: pathsDoIcone('mail'),
  instagram: pathsDoIcone('instagram'),
  site: pathsDoIcone('globe'),
}

function Icone({ nome, size, color = '#000' }: { nome: string; size: number; color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      {(ICONES[nome] || ICONES.documento).map((d) => (
        <Path key={d} d={d} fill={color} />
      ))}
    </Svg>
  )
}

// Wordmark JOYCOMBO (os mesmos desenhos de src/components/Brand.tsx)
const LOGO = [
  'M734.39,0h-90.77v123.77h115.53V49.51h-24.75V0ZM726.15,90.77h-49.51s0-57.76,0-57.76h24.75v41.26h24.77v16.5Z',
  'M486.85 0 L486.86 123.77 L519.86 123.77 L519.85 33.01 L544.61 33.01 L544.62 123.77 L577.63 123.77 L577.61 33.01 L602.37 33.01 L602.38 123.77 L635.39 123.77 L635.37 0 L486.85 0 Z',
  'M288.81 41.35 L288.81 41.35 L288.8 0 L255.8 0 L255.81 41.35 L231.05 41.35 L231.04 0 L198.03 0 L198.05 41.35 L198.03 41.35 L198.03 74.3 L198.05 74.3 L226.95 74.3 L226.95 123.77 L259.9 123.77 L259.9 74.3 L288.81 74.3 L288.81 74.3 L288.81 57.09 L288.81 41.35 Z',
  'M387.83,0v123.77h90.78V0h-90.78ZM420.85,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z',
  'M99.01,0v123.77h90.78V0h-90.78ZM132.03,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z',
  'M858.16,0h-90.77v123.77h90.78V0ZM800.41,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z',
  'M297.06 123.77 L379.58 123.77 L379.58 90.77 L330.07 90.76 L330.07 33.01 L379.58 33.01 L379.58 0 L297.06 0 L297.06 123.77 Z',
  'M57.76 0 L57.76 90.77 L33 90.77 L33 74.27 L0 74.27 L0 123.77 L90.76 123.77 L90.76 74.27 L90.75 0 L57.76 0 Z',
]

function Logo({ width, color = '#ffffff' }: { width: number; color?: string }) {
  return (
    <Svg viewBox="0 0 858.17 123.77" style={{ width, height: (width * 123.77) / 858.17 }}>
      {LOGO.map((d) => (
        <Path key={d} d={d} fill={color} />
      ))}
    </Svg>
  )
}

const C = { preto: '#000000', branco: '#ffffff', verde: '#dcff01', paper: '#f3f3f0', cinza: '#5c5c5c', cinzaClaro: '#b4b4b4', linha: '#e2e2de' }
const NOTA =
  '* A data da entrega final e o valor podem variar dependendo do recebimento de informações do cliente e do escopo do projeto.'

const TAM = {
  desktop: { pagina: [960, 600] as [number, number], pad: 48, titulo: 24, cabecalho: 74 },
  mobile: { pagina: [390, 693] as [number, number], pad: 24, titulo: 17, cabecalho: 64 },
}
type Tam = (typeof TAM)[Layout]

// Fundo das paginas em sequencia: branco, cinza, branco... O card de dentro
// usa a cor oposta.
const FUNDOS = [
  { pagina: C.branco, card: C.paper },
  { pagina: C.paper, card: C.branco },
]
type Fundo = (typeof FUNDOS)[number]

const s = StyleSheet.create({
  pagina: { fontFamily: 'Sora', fontSize: 9.5, lineHeight: 1.45, color: C.preto },
  linha: { flexDirection: 'row' },
  titulo: { fontFamily: 'Joycombo', textTransform: 'uppercase', lineHeight: 1.1 },
})

/**
 * Tamanho de letra para os paragrafos caberem na area (largura x altura, em
 * pontos), entre `min` e `base`. Estimativa pela largura media da Sora.
 */
function letraQueCabe(paragrafos: string[], largura: number, altura: number, base: number, min = 6.5) {
  const caracteres = paragrafos.reduce((a, p) => a + p.length, 0) + paragrafos.length * 45
  if (!caracteres) return base
  const tamanho = Math.sqrt((altura * largura) / (caracteres * 0.56 * 1.5))
  return Math.max(min, Math.min(base, Math.floor(tamanho * 10) / 10))
}

/**
 * Pagina de um assunto: o conteudo fica num bloco da altura exata da pagina,
 * entao nunca quebra para a seguinte. (wrap={false} na Page faria a pagina
 * encolher para a altura do conteudo.)
 * Com `crescer`, a pagina tem no minimo a altura padrao e estica para caber
 * todo o conteudo, sem quebrar e sem diminuir letras.
 */
function Pagina({ z, fundo, children, style, crescer = false }: { z: Tam; fundo: string; children: React.ReactNode; style?: Style; crescer?: boolean }) {
  if (crescer) {
    return (
      <Page size={z.pagina} wrap={false} style={[s.pagina, { padding: z.pad, backgroundColor: fundo }]}>
        <View style={[{ minHeight: z.pagina[1] - z.pad * 2 }, style || {}]}>{children}</View>
      </Page>
    )
  }
  return (
    <Page size={z.pagina} style={[s.pagina, { padding: z.pad, backgroundColor: fundo }]}>
      <View style={[{ height: z.pagina[1] - z.pad * 2 }, style || {}]}>{children}</View>
    </Page>
  )
}

/** Titulo do assunto: icone num quadrado verde + titulo preto; #N a direita (no celular, em cima) */
function Cabecalho({ z, icone, titulo, subtitulo, numero, fundo, fixo = false }: { z: Tam; icone: string; titulo: string; subtitulo?: string; numero?: number; fundo?: Fundo; fixo?: boolean }) {
  const mobile = z.pagina[0] < 500
  const quadrado = mobile ? 26 : 32
  return (
    <View fixed={fixo} style={{ marginBottom: mobile ? 16 : 20, backgroundColor: fundo?.pagina }}>
      {mobile && numero !== undefined ? <Text style={[s.titulo, { fontSize: 18, marginBottom: 6 }]}>#{numero}</Text> : null}
      <View style={[s.linha, { justifyContent: 'space-between', alignItems: 'center', gap: 12 }]}>
        <View style={[s.linha, { alignItems: 'center', gap: mobile ? 8 : 12, flex: 1 }]}>
          <View style={{ width: quadrado, height: quadrado, backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
            <Icone nome={icone} size={quadrado * 0.56} />
          </View>
          <Text style={[s.titulo, { fontSize: z.titulo, flex: 1 }]}>{titulo}</Text>
        </View>
        {!mobile && numero !== undefined ? <Text style={[s.titulo, { fontSize: 30 }]}>#{numero}</Text> : null}
      </View>
      {subtitulo ? <Text style={{ fontSize: mobile ? 8 : 9, fontWeight: 600, color: C.cinza, marginTop: 4, marginLeft: quadrado + (mobile ? 8 : 12) }}>{subtitulo}</Text> : null}
    </View>
  )
}

function Capa({ z, o }: { z: Tam; o: Orcamento }) {
  const mobile = z.pagina[0] < 500
  return (
    <Pagina z={z} fundo={C.preto} style={{ justifyContent: 'center' }}>
      <Logo width={mobile ? 150 : 210} />
      <Text style={{ color: C.cinzaClaro, fontSize: mobile ? 11 : 13, fontWeight: 600, marginTop: mobile ? 26 : 34 }}>{o.data}</Text>
      <Text style={{ alignSelf: 'flex-start', backgroundColor: C.verde, color: C.preto, fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', paddingVertical: 4, paddingHorizontal: 8, marginTop: 14 }}>
        Orçamento
      </Text>
      <Text style={[s.titulo, { color: C.branco, fontSize: mobile ? 30 : 46, marginTop: 10 }]}>{o.tituloCapa}</Text>
      {o.cliente ? <Text style={{ color: C.cinzaClaro, fontSize: mobile ? 12 : 14, marginTop: 16 }}>Para {o.cliente}</Text> : null}
    </Pagina>
  )
}

function Sobre({ z, fundo, sobre, foto }: { z: Tam; fundo: Fundo; sobre: NonNullable<Orcamento['sobre']>; foto: Buffer | null }) {
  const [w, h] = z.pagina
  const mobile = w < 500
  const util = { w: w - z.pad * 2, h: h - z.pad * 2 - z.cabecalho }
  const fotoW = mobile ? util.w : 260
  const fotoH = mobile ? 190 : util.h
  const cardsH = sobre.cards.length ? (mobile ? 104 : 56) : 0
  const textoW = mobile ? util.w : util.w - fotoW - 28
  const textoH = (mobile ? util.h - fotoH - 14 : util.h) - cardsH - 30
  // no celular a letra e fixa e a pagina estica; no desktop a letra se ajusta
  const letra = mobile ? 10.5 : letraQueCabe(sobre.texto, textoW, textoH, 13)

  const fotoView = foto ? <Image src={foto} style={{ width: fotoW, height: fotoH, objectFit: 'cover', marginBottom: mobile ? 14 : 0 }} /> : null
  return (
    <Pagina z={z} fundo={fundo.pagina} crescer={mobile}>
      <Cabecalho z={z} icone="usuario" titulo={sobre.titulo} />
      <View style={mobile ? {} : [s.linha, { gap: 28, flex: 1 }]}>
        {mobile ? fotoView : null}
        <View style={{ width: textoW }}>
          <Text style={[s.titulo, { fontSize: mobile ? 12 : 14, marginBottom: 8 }]}>{sobre.nome}</Text>
          {sobre.texto.map((p) => (
            <Text key={p} style={{ fontSize: letra, marginBottom: letra * 0.7 }}>
              {p}
            </Text>
          ))}
          {sobre.cards.length ? (
            <View style={[s.linha, { flexWrap: 'wrap', gap: 6, marginTop: 8 }]}>
              {sobre.cards.map((c) => (
                <View key={c.value + c.label} style={{ width: mobile ? '48.5%' : '23.5%', backgroundColor: fundo.card, padding: 7 }}>
                  <Text style={{ fontFamily: 'Joycombo', fontSize: mobile ? 13 : 15 }}>{c.value}</Text>
                  <Text style={{ fontSize: 6.5, color: C.cinza, marginTop: 2 }}>{c.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {mobile ? null : fotoView}
      </View>
    </Pagina>
  )
}

function Case({ z, fundo, c, imagens }: { z: Tam; fundo: Fundo; c: Orcamento['cases'][number]; imagens: Buffer[] }) {
  const [w, h] = z.pagina
  const mobile = w < 500
  const util = { w: w - z.pad * 2, h: h - z.pad * 2 - z.cabecalho - (c.subtitulo ? 12 : 0) }
  const fotos = imagens.slice(0, mobile ? 1 : 2)
  const imagemH = mobile ? 170 : fotos.length > 1 ? (util.h - 8) / 2 : util.h
  const imagensW = mobile ? util.w : util.w * 0.5
  const textoW = mobile ? util.w : util.w - imagensW - 28
  const linkH = c.link ? 34 : 0
  const textoH = (mobile ? util.h - (fotos.length ? imagemH + 14 : 0) : util.h) - linkH
  const letra = mobile ? 10.5 : letraQueCabe(c.texto, textoW, textoH, 12.5)

  const imagensView = fotos.length ? (
    <View style={{ width: imagensW, gap: 8, marginBottom: mobile ? 14 : 0 }}>
      {fotos.map((b, i) => (
        <Image key={i} src={b} style={{ width: imagensW, height: imagemH, objectFit: 'cover' }} />
      ))}
    </View>
  ) : null

  return (
    <Pagina z={z} fundo={fundo.pagina} crescer={mobile}>
      <Cabecalho z={z} icone="trofeu" titulo={c.nome} subtitulo={c.subtitulo} />
      <View style={mobile ? {} : [s.linha, { gap: 28, flex: 1 }]}>
        {mobile ? imagensView : null}
        <View style={{ width: textoW }}>
          {c.texto.map((p) => (
            <Text key={p} style={{ fontSize: letra, marginBottom: letra * 0.7 }}>
              {p}
            </Text>
          ))}
          {c.link ? (
            <Link
              src={c.link}
              style={{ alignSelf: 'flex-start', backgroundColor: C.preto, color: C.branco, fontSize: 9, fontWeight: 700, paddingVertical: 7, paddingHorizontal: 12, marginTop: 6, textDecoration: 'none' }}
            >
              Case completo
            </Link>
          ) : null}
        </View>
        {mobile ? null : imagensView}
      </View>
    </Pagina>
  )
}

function CardPrazoValor({ p, mobile }: { p: PropostaView; mobile: boolean }) {
  const linha = (icone: string, rotulo: string, valor: string) => (
    <View style={[s.linha, { alignItems: 'center', gap: 10 }]}>
      <Icone nome={icone} size={mobile ? 16 : 18} color={C.verde} />
      <View>
        <Text style={{ fontSize: 7.5, color: C.cinzaClaro }}>{rotulo}</Text>
        <Text style={{ fontFamily: 'Joycombo', fontSize: mobile ? 15 : 17, color: C.branco }}>{valor}</Text>
      </View>
    </View>
  )
  return (
    <View wrap={false} style={{ backgroundColor: C.preto, padding: 12, gap: 10 }}>
      {linha('relogio', 'Prazo total estimado', `${formatDias(p.prazo)}*`)}
      {linha('cifrao', 'Investimento total', p.valor !== null ? `${formatBRL(p.valor)}*` : 'Sob consulta')}
    </View>
  )
}

function CardEscopo({ p, fundo }: { p: PropostaView; fundo: Fundo }) {
  return (
    <View wrap={false} style={{ backgroundColor: fundo.card, padding: 12 }}>
      <Text style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Escopo da proposta</Text>
      {p.escopo1.map((t) => (
        <Text key={t} style={{ fontSize: 8, color: C.cinza, marginBottom: 4 }}>
          {t}
        </Text>
      ))}
      {p.escopo2.map((t) => (
        <Text key={t} style={{ fontSize: 8, fontWeight: 700, marginBottom: 4, marginTop: 4 }}>
          {t}
        </Text>
      ))}
      {p.escopo3.length ? (
        <>
          <Text style={{ fontWeight: 700, fontSize: 9, marginTop: 12, marginBottom: 4 }}>Como funcionam os sprints?</Text>
          {p.escopo3.map((t) => (
            <Text key={t} style={{ fontSize: 8, color: C.cinza }}>
              {t}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  )
}

function Sprint({ sprint, fundo, mobile }: { sprint: PropostaView['sprints'][number]; fundo: Fundo; mobile: boolean }) {
  const cabeca = (
    <View style={[s.linha, { gap: 8, width: mobile ? '100%' : '28%' }]}>
      <View style={{ width: 24, height: 24, backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Joycombo', fontSize: 9 }}>{sprint.numero}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.titulo, { fontSize: 9.5 }]}>{sprint.nome}</Text>
        {sprint.descricao ? <Text style={{ fontSize: 7.5, color: C.cinza, marginTop: 2 }}>{sprint.descricao}</Text> : null}
      </View>
    </View>
  )
  const itens = (
    <View style={{ width: mobile ? '100%' : '38%', marginTop: mobile ? 8 : 0 }}>
      {sprint.itens.map((item, n) => (
        <View key={item.nome} style={[s.linha, { justifyContent: 'space-between', gap: 6, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: n % 2 === 0 ? fundo.card : fundo.pagina }]}>
          <Text style={{ fontSize: 8, flex: 1 }}>{item.nome}</Text>
          <Text style={{ fontSize: 8, color: C.cinza }}>{formatDias(item.dias)}</Text>
        </View>
      ))}
    </View>
  )
  const entrega = sprint.entregaTexto ? (
    <View style={[s.linha, { gap: 6, backgroundColor: fundo.card, padding: 7, width: mobile ? '100%' : '30%', marginTop: mobile ? 8 : 0, alignItems: 'flex-start' }]}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
        <Icone nome={sprint.entregaIcone} size={10} />
      </View>
      <Text style={{ fontSize: 7.5, color: C.cinza, flex: 1 }}>{sprint.entregaTexto}</Text>
    </View>
  ) : null
  return (
    <View wrap={false} style={[mobile ? {} : [s.linha, { gap: '2%' }], { borderBottomWidth: 0.6, borderBottomColor: C.linha, paddingVertical: mobile ? 10 : 9 }]}>
      {cabeca}
      {itens}
      {entrega}
    </View>
  )
}

/**
 * Proposta no celular: sempre uma pagina so. A pagina estica para baixo o
 * quanto precisar (Pagina crescer), sem diminuir letras. Layout compacto:
 * prazo e investimento lado a lado; itens a esquerda e entrega a direita.
 */
function PropostaMobile({ z, fundo, p }: { z: Tam; fundo: Fundo; p: PropostaView }) {
  // tamanhos de base x 1.2 para ficar confortavel de ler no celular
  const f = (n: number) => n * 1.2

  const cardValor = (icone: string, rotulo: string, valor: string) => (
    <View style={[s.linha, { alignItems: 'center', gap: f(7), flex: 1 }]}>
      <Icone nome={icone} size={f(15)} color={C.verde} />
      <View>
        <Text style={{ fontSize: f(6.5), color: C.cinzaClaro }}>{rotulo}</Text>
        <Text style={{ fontFamily: 'Joycombo', fontSize: f(13), color: C.branco }}>{valor}</Text>
      </View>
    </View>
  )

  return (
    <Pagina z={z} fundo={fundo.pagina} crescer>
      <Cabecalho z={z} icone="prancheta" titulo={p.nome} subtitulo={p.subtitulo} numero={p.numero} />
      <View style={[s.linha, { backgroundColor: C.preto, padding: f(10), gap: f(10) }]}>
        {cardValor('relogio', 'Prazo total estimado', `${formatDias(p.prazo)}*`)}
        {cardValor('cifrao', 'Investimento total', p.valor !== null ? `${formatBRL(p.valor)}*` : 'Sob consulta')}
      </View>

      <View style={{ marginTop: f(8) }}>
        {p.sprints.map((sp) => (
          <View key={sp.numero} style={{ borderBottomWidth: 0.6, borderBottomColor: C.linha, paddingVertical: f(9) }}>
            <View style={[s.linha, { gap: f(8) }]}>
              <View style={{ width: f(22), height: f(22), backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Joycombo', fontSize: f(8.5) }}>{sp.numero}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.titulo, { fontSize: f(9.5) }]}>{sp.nome}</Text>
                {sp.descricao ? <Text style={{ fontSize: f(7.5), color: C.cinza, marginTop: f(2) }}>{sp.descricao}</Text> : null}
              </View>
            </View>
            <View style={[s.linha, { gap: f(8), marginTop: f(6), alignItems: 'flex-start' }]}>
              <View style={{ width: '58%' }}>
                {sp.itens.map((item, n) => (
                  <View
                    key={item.nome}
                    style={[s.linha, { justifyContent: 'space-between', gap: f(6), paddingVertical: f(3), paddingHorizontal: f(5), backgroundColor: n % 2 === 0 ? fundo.card : fundo.pagina }]}
                  >
                    <Text style={{ fontSize: f(8), flex: 1 }}>{item.nome}</Text>
                    <Text style={{ fontSize: f(8), color: C.cinza }}>{formatDias(item.dias)}</Text>
                  </View>
                ))}
              </View>
              {sp.entregaTexto ? (
                <View style={[s.linha, { flex: 1, gap: f(5), backgroundColor: fundo.card, padding: f(6), alignItems: 'flex-start' }]}>
                  <View style={{ width: f(16), height: f(16), borderRadius: f(8), backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
                    <Icone nome={sp.entregaIcone} size={f(9)} />
                  </View>
                  <Text style={{ fontSize: f(7.5), color: C.cinza, flex: 1 }}>{sp.entregaTexto}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: fundo.card, padding: f(10), marginTop: f(12) }}>
        <Text style={{ fontWeight: 700, fontSize: f(9), marginBottom: f(4) }}>Escopo da proposta</Text>
        {p.escopo1.map((t) => (
          <Text key={t} style={{ fontSize: f(8), color: C.cinza, marginBottom: f(4) }}>
            {t}
          </Text>
        ))}
        {p.escopo2.map((t) => (
          <Text key={t} style={{ fontSize: f(8), fontWeight: 700, marginBottom: f(4) }}>
            {t}
          </Text>
        ))}
        {p.escopo3.length ? (
          <>
            <Text style={{ fontWeight: 700, fontSize: f(9), marginTop: f(6), marginBottom: f(4) }}>Como funcionam os sprints?</Text>
            {p.escopo3.map((t) => (
              <Text key={t} style={{ fontSize: f(8), color: C.cinza }}>
                {t}
              </Text>
            ))}
          </>
        ) : null}
      </View>
      <Text style={{ fontSize: f(6.5), color: C.cinza, marginTop: f(10) }}>{NOTA}</Text>
    </Pagina>
  )
}

/** Proposta no desktop: uma pagina, sprints a esquerda e escopo/valores a direita. */
function Proposta({ z, fundo, p }: { z: Tam; fundo: Fundo; p: PropostaView }) {
  if (z.pagina[0] < 500) return <PropostaMobile z={z} fundo={fundo} p={p} />
  return (
    <Pagina z={z} fundo={fundo.pagina}>
      <Cabecalho z={z} icone="prancheta" titulo={p.nome} subtitulo={p.subtitulo} numero={p.numero} />
      <View style={[s.linha, { gap: 22, flex: 1 }]}>
        <View style={{ width: '70%' }}>
          <View style={[s.linha, { gap: '2%', borderBottomWidth: 0.6, borderBottomColor: C.linha, paddingBottom: 5 }]}>
            <Text style={{ width: '28%', fontWeight: 700, fontSize: 8.5 }}>Sprints e atividades</Text>
            <Text style={{ width: '38%', fontWeight: 700, fontSize: 8.5, textAlign: 'right', paddingRight: 6 }}>Prazo</Text>
            <Text style={{ width: '30%', fontWeight: 700, fontSize: 8.5 }}>Entrega</Text>
          </View>
          {p.sprints.map((sp) => (
            <Sprint key={sp.numero} sprint={sp} fundo={fundo} mobile={false} />
          ))}
          <View style={{ flexGrow: 1 }} />
          <Text style={{ fontSize: 6.5, color: C.cinza, marginTop: 10 }}>{NOTA}</Text>
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          <CardEscopo p={p} fundo={fundo} />
          <CardPrazoValor p={p} mobile={false} />
        </View>
      </View>
    </Pagina>
  )
}

function Pagamento({ z, fundo, linhas }: { z: Tam; fundo: Fundo; linhas: string[] }) {
  const mobile = z.pagina[0] < 500
  return (
    <View>
      <Cabecalho z={z} icone="cartao" titulo="Pagamento" />
      {linhas.map((l, i) => (
        <View key={l} style={[mobile ? {} : s.linha, { gap: mobile ? 4 : 12, backgroundColor: fundo.card, padding: 12, marginBottom: 10 }]}>
          <Text style={[s.titulo, { fontSize: 15 }]}>#{i + 1}</Text>
          <Text style={{ fontSize: mobile ? 10 : 11, flex: mobile ? undefined : 1, paddingTop: mobile ? 0 : 2 }}>{l}</Text>
        </View>
      ))}
    </View>
  )
}

function OutrasInformacoes({ z, itens }: { z: Tam; itens: Orcamento['outrasInformacoes'] }) {
  const mobile = z.pagina[0] < 500
  const quadradinho = <View style={{ width: 5, height: 5, backgroundColor: C.preto, marginTop: 5, marginRight: 8 }} />
  return (
    <View>
      <Cabecalho z={z} icone="info" titulo="Outras informações" />
      {itens.map((item) => (
        <View key={item.texto} style={{ marginBottom: 8 }}>
          <View style={s.linha}>
            {quadradinho}
            <Text style={{ fontSize: mobile ? 9.5 : 10.5, flex: 1 }}>{item.texto}</Text>
          </View>
          {item.subitens.map((sub) => (
            <View key={sub} style={[s.linha, { marginLeft: 14, marginTop: 3 }]}>
              {quadradinho}
              <Text style={{ fontSize: mobile ? 9 : 10, color: C.cinza, flex: 1 }}>{sub}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

/** Pagamento e Outras informacoes juntos numa pagina so (no celular ela estica se precisar) */
function PagamentoEInformacoes({ z, fundo, o }: { z: Tam; fundo: Fundo; o: Orcamento }) {
  const mobile = z.pagina[0] < 500
  const ambos = o.parcelamento.length > 0 && o.outrasInformacoes.length > 0
  return (
    <Pagina z={z} fundo={fundo.pagina} crescer={mobile}>
      {o.parcelamento.length ? <Pagamento z={z} fundo={fundo} linhas={o.parcelamento} /> : null}
      {ambos ? <View style={{ height: mobile ? 18 : 22 }} /> : null}
      {o.outrasInformacoes.length ? <OutrasInformacoes z={z} itens={o.outrasInformacoes} /> : null}
    </Pagina>
  )
}

function ContraCapa({ z, contatos }: { z: Tam; contatos: ContatoView[] }) {
  const mobile = z.pagina[0] < 500
  return (
    <Pagina z={z} fundo={C.preto} style={{ justifyContent: 'center' }}>
      <Logo width={mobile ? 130 : 170} />
      <Text style={[s.titulo, { color: C.branco, fontSize: mobile ? 24 : 36, marginTop: mobile ? 28 : 36 }]}>Obrigado pela atenção!</Text>
      <Text style={{ color: C.cinzaClaro, fontSize: mobile ? 11 : 13, marginTop: 10, marginBottom: 18 }}>Qualquer dúvida, é só chamar:</Text>
      {contatos.map((c) => (
        <Link key={c.tipo} src={c.href} style={{ textDecoration: 'none', marginBottom: 10 }}>
          <View style={[s.linha, { alignItems: 'center', gap: 10 }]}>
            <View style={{ width: 22, height: 22, backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
              <Icone nome={c.tipo} size={13} />
            </View>
            <Text style={{ color: C.branco, fontSize: mobile ? 11 : 13, fontWeight: 700 }}>{c.label}</Text>
          </View>
        </Link>
      ))}
    </Pagina>
  )
}

export function OrcamentoPdf({ o, layout, imagens }: { o: Orcamento; layout: Layout; imagens: Imagens }) {
  const z = TAM[layout]
  // Paginas do meio, na ordem, com o fundo alternado
  const paginas: ((f: Fundo) => React.ReactNode)[] = []
  const sobre = o.sobre
  if (sobre) paginas.push((f) => <Sobre key="sobre" z={z} fundo={f} sobre={sobre} foto={imagens.sobre} />)
  o.cases.forEach((c, i) =>
    paginas.push((f) => <Case key={`case-${i}`} z={z} fundo={f} c={c} imagens={(imagens.cases[i] || []).filter((b): b is Buffer => Boolean(b))} />),
  )
  o.propostas.forEach((p) => paginas.push((f) => <Proposta key={`proposta-${p.numero}`} z={z} fundo={f} p={p} />))
  if (o.parcelamento.length || o.outrasInformacoes.length) paginas.push((f) => <PagamentoEInformacoes key="pagamento" z={z} fundo={f} o={o} />)

  return (
    <Document title={`${o.tituloCapa} · ${o.cliente}`} author="Joycombo" creator="Joycombo" producer="Joycombo">
      {o.capa ? <Capa z={z} o={o} /> : null}
      {paginas.map((render, i) => render(FUNDOS[i % 2]))}
      {o.contraCapa ? <ContraCapa z={z} contatos={o.contatos} /> : null}
    </Document>
  )
}
