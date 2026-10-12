import fs from 'fs'
import path from 'path'
import { Defs, Document, Font, Image, Link, LinearGradient, Page, Path, Rect, Stop, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { formatBRL } from '@/lib/format'
import { formatDias } from '@/lib/orcamentos/propostas'
import type { ContatoView, Orcamento, PropostaView } from '@/lib/orcamentos/publico'

// PDF do orcamento em paginas (react-pdf, sem navegador). Desktop: paisagem
// 16:10, uma secao por pagina, como o PDF feito no InDesign. Mobile: retrato
// 9:16, tudo em uma coluna; proposta que nao cabe continua na pagina
// seguinte repetindo a faixa do topo. Imagens chegam ja em JPG.

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

// Icones do pixelarticons lidos do proprio pacote (mesmos da pagina)
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
  usuario: pathsDoIcone('user'),
  trofeu: pathsDoIcone('trophy'),
  prancheta: pathsDoIcone('clipboard'),
  cartao: pathsDoIcone('credit-card'),
  info: pathsDoIcone('info-box'),
  cifrao: pathsDoIcone('dollar'),
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

const C = { preto: '#000000', branco: '#ffffff', verde: '#dcff01', paper: '#f3f3f0', cinza: '#5c5c5c', linha: '#e2e2de' }
const NOTA =
  '* A data da entrega final e o valor podem variar dependendo do recebimento de informações do cliente e do escopo do projeto.'

const TAM = {
  desktop: { pagina: [960, 600] as [number, number], pad: 48, faixa: 92 },
  mobile: { pagina: [390, 693] as [number, number], pad: 22, faixa: 84 },
}

const s = StyleSheet.create({
  pagina: { fontFamily: 'Sora', fontSize: 9.5, lineHeight: 1.45, color: C.preto, backgroundColor: C.branco },
  titulo: { fontFamily: 'Joycombo', color: C.branco },
  linha: { flexDirection: 'row' },
})

/** Fundo escuro com degrade, como as faixas do PDF atual */
function Degrade({ w, h }: { w: number; h: number }) {
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2b2b33" />
          <Stop offset="0.45" stopColor="#16161a" />
          <Stop offset="1" stopColor="#000000" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={w} height={h} fill="url(#g)" />
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

function Logo({ width }: { width: number }) {
  return (
    <Svg viewBox="0 0 858.17 123.77" style={{ width, height: (width * 123.77) / 858.17 }}>
      {LOGO.map((d) => (
        <Path key={d} d={d} fill={C.branco} />
      ))}
    </Svg>
  )
}

type Tam = (typeof TAM)[Layout]

/** Faixa do topo de cada secao: "Titulo { Nome }", subtitulo e #N */
function Faixa({ z, titulo, subtitulo, numero, icone, fixa = false }: { z: Tam; titulo: string; subtitulo?: string; numero?: number; icone?: string; fixa?: boolean }) {
  const [w] = z.pagina
  const mobile = w < 500
  return (
    <View fixed={fixa} style={{ height: z.faixa, width: w, marginLeft: -z.pad, marginTop: -z.pad, marginBottom: mobile ? 18 : 22 }}>
      <Degrade w={w} h={z.faixa} />
      <View style={[s.linha, { paddingHorizontal: z.pad, paddingTop: mobile ? 22 : 26, justifyContent: 'space-between', alignItems: 'flex-start' }]}>
        <View style={[s.linha, { flex: 1, gap: mobile ? 8 : 12, alignItems: 'flex-start' }]}>
          {icone ? (
            <View style={{ width: mobile ? 24 : 30, height: mobile ? 24 : 30, backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
              <Icone nome={icone} size={mobile ? 14 : 17} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[s.titulo, { fontSize: mobile ? 16 : 22, textTransform: 'uppercase' }]}>{titulo}</Text>
            {subtitulo ? <Text style={{ color: '#d0d0d4', fontSize: mobile ? 7.5 : 8, marginTop: 4 }}>{subtitulo}</Text> : null}
          </View>
        </View>
        {numero !== undefined ? <Text style={[s.titulo, { fontSize: mobile ? 20 : 26 }]}>#{numero}</Text> : null}
      </View>
    </View>
  )
}

function Pagina({ z, children, style }: { z: Tam; children: React.ReactNode; style?: Style }) {
  return (
    <Page size={z.pagina} style={[s.pagina, { padding: z.pad, paddingBottom: z.pad }, style || {}]}>
      {children}
    </Page>
  )
}

function Capa({ z, o }: { z: Tam; o: Orcamento }) {
  const [w, h] = z.pagina
  const mobile = w < 500
  return (
    <Page size={z.pagina} style={[s.pagina, { padding: z.pad, justifyContent: 'space-between' }]}>
      <Degrade w={w} h={h} />
      <View />
      <View>
        <Logo width={mobile ? 150 : 200} />
        <Text style={{ color: '#c8c8cc', fontSize: mobile ? 11 : 12, fontWeight: 600, marginTop: 26 }}>{o.data}</Text>
        <Text style={{ alignSelf: 'flex-start', backgroundColor: C.verde, color: C.preto, fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', paddingVertical: 4, paddingHorizontal: 8, marginTop: 14 }}>
          Orçamento
        </Text>
        <Text style={[s.titulo, { fontSize: mobile ? 28 : 40, marginTop: 10, textTransform: 'uppercase' }]}>{o.tituloCapa}</Text>
        {o.cliente ? <Text style={{ color: '#c8c8cc', fontSize: mobile ? 11 : 12, marginTop: 16 }}>Para {o.cliente}</Text> : null}
      </View>
      <View />
    </Page>
  )
}

function Sobre({ z, sobre, foto }: { z: Tam; sobre: NonNullable<Orcamento['sobre']>; foto: Buffer | null }) {
  const mobile = z.pagina[0] < 500
  const fotoView = foto ? (
    <Image src={foto} style={mobile ? { width: '100%', height: 230, objectFit: 'cover', marginBottom: 16 } : { width: 300, height: 440, objectFit: 'cover', marginTop: -22, marginRight: -z.pad }} />
  ) : null
  return (
    <Pagina z={z}>
      <Faixa z={z} titulo={sobre.titulo} icone="usuario" />
      <View style={mobile ? {} : [s.linha, { gap: 36 }]}>
        {mobile ? fotoView : null}
        <View style={{ flex: mobile ? undefined : 1 }}>
          {sobre.texto.map((p) => (
            <Text key={p} style={{ fontSize: mobile ? 9 : 10, marginBottom: 8 }}>
              {p}
            </Text>
          ))}
          {sobre.cards.length ? (
            <View style={[s.linha, { flexWrap: 'wrap', gap: 6, marginTop: 8 }]}>
              {sobre.cards.map((c) => (
                <View key={c.value + c.label} style={{ width: mobile ? '48.5%' : '23.5%', backgroundColor: C.paper, padding: 8 }}>
                  <Text style={{ fontFamily: 'Joycombo', fontSize: 15 }}>{c.value}</Text>
                  <Text style={{ fontSize: 7, color: C.cinza, marginTop: 2 }}>{c.label}</Text>
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

function Case({ z, c, imagens }: { z: Tam; c: Orcamento['cases'][number]; imagens: Buffer[] }) {
  const mobile = z.pagina[0] < 500
  return (
    <Pagina z={z}>
      <Faixa z={z} titulo={c.nome} subtitulo={c.subtitulo} icone="trofeu" />
      <View style={mobile ? {} : [s.linha, { gap: 32 }]}>
        <View style={{ flex: mobile ? undefined : 1 }}>
          {c.texto.map((p) => (
            <Text key={p} style={{ fontSize: mobile ? 9 : 10, marginBottom: 8 }}>
              {p}
            </Text>
          ))}
          {c.link ? (
            <Link src={c.link} style={{ alignSelf: 'flex-start', backgroundColor: C.preto, color: C.branco, fontSize: 9, paddingVertical: 7, paddingHorizontal: 12, fontWeight: 700, marginTop: 10, textDecoration: 'none' }}>
              Case completo
            </Link>
          ) : null}
        </View>
        {imagens.length ? (
          <View style={{ flex: mobile ? undefined : 1.15, gap: 6, marginTop: mobile ? 16 : -22, marginRight: mobile ? 0 : -z.pad }}>
            {imagens.slice(0, 2).map((b, i) => (
              <Image key={i} src={b} style={{ width: '100%', height: mobile ? 170 : imagens.length > 1 ? 223 : 450, objectFit: 'cover' }} />
            ))}
          </View>
        ) : null}
      </View>
    </Pagina>
  )
}

function CardPrazoValor({ p, mobile }: { p: PropostaView; mobile: boolean }) {
  const linha = (icone: string, rotulo: string, valor: string) => (
    <View style={[s.linha, { alignItems: 'center', gap: 10 }]}>
      <Icone nome={icone} size={mobile ? 16 : 18} color={C.verde} />
      <View>
        <Text style={{ fontSize: 7.5, color: '#c8c8cc' }}>{rotulo}</Text>
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

function CardEscopo({ p }: { p: PropostaView }) {
  return (
    <View wrap={false} style={{ backgroundColor: C.paper, padding: 12 }}>
      <Text style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Escopo da proposta</Text>
      {p.escopo1.map((t) => (
        <Text key={t} style={{ fontSize: 8, color: '#3a3a3a', marginBottom: 4 }}>
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
            <Text key={t} style={{ fontSize: 8, color: '#3a3a3a' }}>
              {t}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  )
}

function Sprint({ sprint, mobile }: { sprint: PropostaView['sprints'][number]; mobile: boolean }) {
  const cabeca = (
    <View style={[s.linha, { gap: 8, width: mobile ? '100%' : '28%' }]}>
      <View style={{ width: 24, height: 24, backgroundColor: C.verde, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Joycombo', fontSize: 9 }}>{sprint.numero}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Joycombo', fontSize: 10 }}>{sprint.nome}</Text>
        {sprint.descricao ? <Text style={{ fontSize: 7.5, color: C.cinza, marginTop: 2 }}>{sprint.descricao}</Text> : null}
      </View>
    </View>
  )
  const itens = (
    <View style={{ width: mobile ? '100%' : '38%', marginTop: mobile ? 8 : 0 }}>
      {sprint.itens.map((item, n) => (
        <View key={item.nome} style={[s.linha, { justifyContent: 'space-between', gap: 6, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: n % 2 === 0 ? C.paper : C.branco }]}>
          <Text style={{ fontSize: 8, flex: 1 }}>{item.nome}</Text>
          <Text style={{ fontSize: 8, color: C.cinza }}>{formatDias(item.dias)}</Text>
        </View>
      ))}
    </View>
  )
  const entrega = sprint.entregaTexto ? (
    <View style={[s.linha, { gap: 6, backgroundColor: C.paper, padding: 7, width: mobile ? '100%' : '30%', marginTop: mobile ? 8 : 0, alignItems: 'flex-start' }]}>
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

function Proposta({ z, p }: { z: Tam; p: PropostaView }) {
  const mobile = z.pagina[0] < 500
  const nota = <Text style={{ fontSize: 6.5, color: C.cinza, marginTop: 10 }}>{NOTA}</Text>
  if (mobile) {
    return (
      <Pagina z={z} style={{ paddingTop: z.pad + z.faixa + 18 }}>
        <View fixed style={{ position: 'absolute', top: z.pad, left: z.pad }}>
          <Faixa z={z} titulo={p.nome} subtitulo={p.subtitulo} numero={p.numero} icone="prancheta" />
        </View>
        <CardPrazoValor p={p} mobile />
        <View style={{ marginTop: 8 }}>
          {p.sprints.map((sp) => (
            <Sprint key={sp.numero} sprint={sp} mobile />
          ))}
        </View>
        <View style={{ marginTop: 12 }}>
          <CardEscopo p={p} />
        </View>
        {nota}
      </Pagina>
    )
  }
  return (
    <Pagina z={z}>
      <Faixa z={z} titulo={p.nome} subtitulo={p.subtitulo} numero={p.numero} icone="prancheta" />
      <View style={[s.linha, { gap: 22, flex: 1 }]}>
        <View style={{ width: '70%' }}>
          <View style={[s.linha, { gap: '2%', borderBottomWidth: 0.6, borderBottomColor: C.linha, paddingBottom: 5 }]}>
            <Text style={{ width: '28%', fontWeight: 700, fontSize: 8.5 }}>Sprints e atividades</Text>
            <Text style={{ width: '38%', fontWeight: 700, fontSize: 8.5, textAlign: 'right', paddingRight: 6 }}>Prazo</Text>
            <Text style={{ width: '30%', fontWeight: 700, fontSize: 8.5 }}>Entrega</Text>
          </View>
          {p.sprints.map((sp) => (
            <Sprint key={sp.numero} sprint={sp} mobile={false} />
          ))}
          <View style={{ flexGrow: 1 }} />
          {nota}
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          <CardEscopo p={p} />
          <CardPrazoValor p={p} mobile={false} />
        </View>
      </View>
    </Pagina>
  )
}

function Parcelamento({ z, linhas }: { z: Tam; linhas: string[] }) {
  return (
    <Pagina z={z}>
      <Faixa z={z} titulo="Pagamento" icone="cartao" />
      {linhas.map((l, i) => (
        <View key={l} wrap={false} style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Joycombo', fontSize: 14 }}>#{i + 1}</Text>
          <Text style={{ backgroundColor: C.paper, padding: 10, marginTop: 6, fontSize: 10 }}>{l}</Text>
        </View>
      ))}
    </Pagina>
  )
}

function OutrasInformacoes({ z, itens }: { z: Tam; itens: Orcamento['outrasInformacoes'] }) {
  return (
    <Pagina z={z}>
      <Faixa z={z} titulo="Outras informações" icone="info" />
      {itens.map((item) => (
        <View key={item.texto} wrap={false} style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 10 }}>- {item.texto}</Text>
          {item.subitens.map((sub) => (
            <Text key={sub} style={{ fontSize: 10, marginLeft: 14, marginTop: 2 }}>
              - {sub}
            </Text>
          ))}
        </View>
      ))}
    </Pagina>
  )
}

function ContraCapa({ z, contatos }: { z: Tam; contatos: ContatoView[] }) {
  const [w, h] = z.pagina
  const mobile = w < 500
  return (
    <Page size={z.pagina} style={[s.pagina, { padding: z.pad, justifyContent: 'space-between' }]}>
      <Degrade w={w} h={h} />
      <View />
      <View>
        <Text style={[s.titulo, { fontSize: mobile ? 24 : 34, textTransform: 'uppercase' }]}>Obrigado pela atenção!</Text>
        <Text style={{ color: '#c8c8cc', fontSize: mobile ? 11 : 13, marginTop: 10, marginBottom: 16 }}>Qualquer dúvida, entre em contato:</Text>
        {contatos.map((c) => (
          <Link key={c.tipo} src={c.href} style={{ textDecoration: 'none', marginBottom: 8 }}>
            <View style={[s.linha, { alignItems: 'center', gap: 8 }]}>
              <Icone nome={c.tipo} size={mobile ? 13 : 15} color="#dcff01" />
              <Text style={{ color: C.branco, fontSize: mobile ? 11 : 13, fontWeight: 700 }}>{c.label}</Text>
            </View>
          </Link>
        ))}
      </View>
      <Logo width={mobile ? 110 : 140} />
    </Page>
  )
}

export function OrcamentoPdf({ o, layout, imagens }: { o: Orcamento; layout: Layout; imagens: Imagens }) {
  const z = TAM[layout]
  return (
    <Document title={`${o.tituloCapa} · ${o.cliente}`} author="Joycombo" creator="Joycombo" producer="Joycombo">
      {o.capa ? <Capa z={z} o={o} /> : null}
      {o.sobre ? <Sobre z={z} sobre={o.sobre} foto={imagens.sobre} /> : null}
      {o.cases.map((c, i) => (
        <Case key={c.nome} z={z} c={c} imagens={(imagens.cases[i] || []).filter((b): b is Buffer => Boolean(b))} />
      ))}
      {o.propostas.map((p) => (
        <Proposta key={`${p.numero}-${p.nome}`} z={z} p={p} />
      ))}
      {o.parcelamento.length ? <Parcelamento z={z} linhas={o.parcelamento} /> : null}
      {o.outrasInformacoes.length ? <OutrasInformacoes z={z} itens={o.outrasInformacoes} /> : null}
      {o.contraCapa ? <ContraCapa z={z} contatos={o.contatos} /> : null}
    </Document>
  )
}
