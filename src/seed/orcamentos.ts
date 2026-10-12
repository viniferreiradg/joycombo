// Conteudo inicial do modulo de orcamentos: as 5 propostas e os cases
// Facility e Lockwise (textos do PDF atual) e os itens de Outras informacoes.
// `npm run seed:orcamentos`. Pode rodar de novo: o que ja existe (mesmo nome)
// nao e tocado, e as Configuracoes de orcamento so sao preenchidas se vazias.
// Nao mexe em nada do site.
import { getPayload } from 'payload'
import config from '../../payload.config'
import { TEXTO_SPRINTS_PADRAO } from '@/lib/orcamentos/propostas'

type Item = [nome: string, dias: number]
type Sprint = { nome: string; descricao: string; itens: Item[]; icone: string; entrega: string }
type Proposta = { nome: string; subtitulo: string; investimento: number; escopo1: string; escopo2: string; sprints: Sprint[] }

const escopoSite1 =
  'Esta proposta contempla o planejamento, design e desenvolvimento do site, desde o briefing inicial até sua apresentação e publicação.'
const escopoSite2 = 'O projeto inclui a criação do layout, programação e orientação para utilização da ferramenta.'

const sprintsSite = (wireframe: number, layout: number, programacao: number): Sprint[] => [
  {
    nome: 'Descoberta',
    descricao: 'Entender o contexto do projeto, objetivos do site e referências para definir o direcionamento visual.',
    itens: [
      ['Briefing inicial', 1],
      ['Coleta de referências visuais', 2],
    ],
    icone: 'documento',
    entrega: 'Briefing e painel de referências para direcionamento do projeto.',
  },
  {
    nome: 'Desenvolvimento',
    descricao: 'Estruturar, projetar e desenvolver o site a partir das definições da etapa anterior.',
    itens: [
      ['Wireframe', wireframe],
      ['Layout do site', layout],
      ['Programação', programacao],
    ],
    icone: 'monitor',
    entrega: 'Site desenvolvido e pronto para apresentação.',
  },
  {
    nome: 'Finalização',
    descricao: 'Apresentar o projeto, orientar o cliente sobre a ferramenta e auxiliar na publicação do site.',
    itens: [['Apresentação, ensino da ferramenta e suporte para hospedagem', 1]],
    icone: 'foguete',
    entrega: 'Site apresentado, cliente orientado e suporte para publicação.',
  },
]

const propostas: Proposta[] = [
  {
    nome: 'Identidade Visual Sem Naming',
    subtitulo: 'Marca',
    investimento: 1290.9,
    escopo1: 'Esta proposta contempla exclusivamente o desenvolvimento da identidade visual.',
    escopo2: 'Esta proposta não contempla a criação de nome (naming) e/ou produtos físicos como papelaria.',
    sprints: [
      {
        nome: 'Descoberta',
        descricao: 'Entender o contexto da marca, referências e direcionamento visual.',
        itens: [
          ['Briefing inicial', 1],
          ['Coleta de referências visuais', 3],
        ],
        icone: 'documento',
        entrega: 'Briefing e painel de referências para a próxima etapa.',
      },
      {
        nome: 'Desenvolvimento',
        descricao: 'Criação da marca e desdobramento da identidade visual.',
        itens: [
          ['Marca gráfica', 10],
          ['Identidade visual', 4],
        ],
        icone: 'paleta',
        entrega: 'Apresentação da marca e identidade visual para validação.',
      },
      {
        nome: 'Finalização',
        descricao: 'Organização e entrega dos arquivos finais da marca.',
        itens: [['Entrega dos arquivos de marca', 2]],
        icone: 'pasta',
        entrega: 'Entrega dos arquivos em formato digital.',
      },
    ],
  },
  {
    nome: 'Branding Com Naming',
    subtitulo: 'Marca',
    investimento: 5690.9,
    escopo1: 'Esta proposta contempla o desenvolvimento estratégico e criativo da marca, incluindo identidade visual e naming.',
    escopo2:
      'O projeto parte da compreensão do negócio e do mercado para definir o posicionamento da marca, desenvolver sua identidade e criar um nome alinhado à estratégia definida.',
    sprints: [
      {
        nome: 'Descoberta',
        descricao: 'Entender o contexto da marca, seu posicionamento, mercado e diferenciais.',
        itens: [
          ['Briefing inicial', 1],
          ['DNA Empresarial', 1],
          ['Estudo de mercado', 3],
        ],
        icone: 'documento',
        entrega: 'Diagnóstico inicial da marca e direcionamentos estratégicos para o projeto.',
      },
      {
        nome: 'Estratégia',
        descricao: 'Definir os fundamentos estratégicos e as referências que irão orientar a construção da marca.',
        itens: [
          ['Golden Circle / Plataforma', 5],
          ['Coleta de referências visuais', 3],
        ],
        icone: 'fluxo',
        entrega: 'Plataforma estratégica e painel de referências para direcionar a criação.',
      },
      {
        nome: 'Desenvolvimento',
        descricao: 'Criação da marca e desenvolvimento dos elementos que compõem sua identidade.',
        itens: [
          ['Naming', 20],
          ['Marca gráfica', 10],
          ['Identidade visual', 4],
        ],
        icone: 'paleta',
        entrega: 'Apresentação da marca, identidade visual e naming para validação.',
      },
      {
        nome: 'Finalização',
        descricao: 'Organização, documentação e entrega dos materiais finais da marca.',
        itens: [
          ['Manual de marca', 5],
          ['Entrega dos arquivos da marca', 2],
        ],
        icone: 'pasta',
        entrega: 'Entrega dos arquivos em formato digital.',
      },
    ],
  },
  {
    nome: 'Landing Page',
    subtitulo: 'Site',
    investimento: 890.9,
    escopo1: escopoSite1,
    escopo2: escopoSite2,
    sprints: sprintsSite(3, 4, 4),
  },
  {
    nome: 'Site Institucional / 5 páginas',
    subtitulo: 'Site',
    investimento: 1490.9,
    escopo1: escopoSite1,
    escopo2: escopoSite2,
    sprints: sprintsSite(4, 6, 6),
  },
  {
    nome: 'Sistema / Aplicativo',
    subtitulo: 'Experiência do Usuário',
    investimento: 3690.9,
    escopo1:
      'Essa proposta contempla exclusivamente o projeto de UX/UI Design, incluindo descoberta, arquitetura da informação, fluxos, design system e prototipação de alta fidelidade.',
    escopo2: 'O desenvolvimento de software, programação ou entrega de um sistema / aplicativo funcional não está incluso nesse escopo.',
    sprints: [
      {
        nome: 'Descoberta',
        descricao: 'Compreender o contexto, objetivos e necessidades do produto para direcionar sua experiência e estrutura.',
        itens: [
          ['Reunião de descoberta', 1],
          ['Questionário inicial', 1],
          ['Estudo de mercado', 2],
        ],
        icone: 'documento',
        entrega: 'Diagnóstico inicial e direcionamento para o desenvolvimento do produto.',
      },
      {
        nome: 'Estratégia',
        descricao: 'Organizar a arquitetura da informação e os fluxos de navegação a partir das definições da etapa anterior.',
        itens: [
          ['Arquitetura da informação', 2],
          ['Fluxo de navegação', 2],
        ],
        icone: 'fluxo',
        entrega: 'Fluxos e interfaces estruturados para a prototipação.',
      },
      {
        nome: 'Prototipação',
        descricao: 'Construir o design system e prototipar as interfaces em alta fidelidade, prontos para o time de desenvolvimento.',
        itens: [
          ['Design System', 2],
          ['Prototipação de alta fidelidade', 10],
        ],
        icone: 'monitor',
        entrega: 'Protótipo apresentado e arquivos prontos para o desenvolvimento.',
      },
    ],
  },
]

const cases = [
  {
    nome: 'Facility',
    subtitulo: 'Desenvolvido em parceria com Bradda Design',
    texto: [
      'A Facility Promotora é especializada em crédito consignado para servidores públicos, aposentados e pensionistas do INSS. Mais do que oferecer crédito, quer inspirar seus clientes a desbravar novas oportunidades com coragem e otimismo. A Facility acredita que a vida é mais bela quando somos os primeiros a ver a paisagem.',
      'A necessidade de um redesign surgiu da inconsistência na identidade de marca, que se comunicava de formas diferentes em cada ponto de contato. Nosso desafio foi criar uma identidade visual alinhada aos valores da empresa. Além disso, a Facility estava lançando uma nova submarca voltada para serviços financeiros, exigindo um posicionamento coerente entre as duas frentes.',
      'A nova identidade visual combina dois conceitos no símbolo: a montanha, representando conquista e superação, e o alvo, simbolizando determinação. Para tornar a marca mais acessível e próxima, escolhemos uma tipografia em caixa baixa, com cantos arredondados. O resultado é uma identidade visual coesa, transmitindo confiança e dinamismo.',
    ],
  },
  {
    nome: 'Lockwise',
    subtitulo: 'Desenvolvido em parceria com Plathanus',
    texto: [
      'A Lockwise é uma instituição de pagamentos B2B que opera travas de recebíveis. O sistema nasceu como MVP e validou a operação, mas só funcionava bem com alguém do suporte explicando, o que limitava o crescimento da empresa e deixava os clientes inseguros para decidir.',
      'Pela Plathanus, conduzi o projeto da descoberta à entrega: entrevistas com clientes, mapa de empatia, personas, benchmark com cinco players e estudo de quadrantes. Com isso, reestruturei a navegação, desenhei perfis e permissões, redesenhei a visualização de dados e construí o design system.',
      'O projeto também trouxe uma camada de suporte assistido por IA e um modelo de cobrança por créditos, que alinha a receita ao custo real de cada operação. Tudo entregue em protótipo de alta fidelidade, pronto para o desenvolvimento.',
    ],
  },
]

const outrasInformacoes = [
  'O orçamento e os preços são válidos por {validade} dias. Após esse prazo, valores e prazos podem sofrer alterações.',
  'Após o envio das alternativas, o cliente pode solicitar até três listas de alterações.',
  'Alterações na marca são permitidas desde que não comprometam sua funcionalidade, legibilidade ou aplicação em diferentes materiais.',
  [
    'Não está incluso no projeto:',
    'Produção de conteúdo',
    'Aquisição ou produção de fotografias',
    'Impressão ou produção dos materiais',
    'Revisão ortográfica',
    'Orçamento junto às gráficas',
    'Acompanhamento da produção gráfica',
  ].join('\n'),
]

const payload = await getPayload({ config })

for (const p of propostas) {
  const existe = await payload.find({ collection: 'propostas', where: { nome: { equals: p.nome } }, limit: 1, depth: 0 })
  if (existe.docs.length) {
    console.log(`= Proposta ${p.nome} (já existe)`)
    continue
  }
  await payload.create({
    collection: 'propostas',
    data: {
      nome: p.nome,
      subtitulo: p.subtitulo,
      investimento: p.investimento,
      escopo1: p.escopo1,
      escopo2: p.escopo2,
      escopo3: TEXTO_SPRINTS_PADRAO,
      sprints: p.sprints.map((s) => ({
        nome: s.nome,
        descricao: s.descricao,
        itens: s.itens.map(([nome, dias]) => ({ nome, dias })),
        entregaIcone: s.icone,
        entregaTexto: s.entrega,
      })),
    } as never,
  })
  console.log(`+ Proposta ${p.nome}`)
}

for (const c of cases) {
  const existe = await payload.find({ collection: 'orcamento-cases', where: { nome: { equals: c.nome } }, limit: 1, depth: 0 })
  if (existe.docs.length) {
    console.log(`= Case ${c.nome} (já existe)`)
    continue
  }
  await payload.create({ collection: 'orcamento-cases', data: { nome: c.nome, subtitulo: c.subtitulo, texto: c.texto.join('\n\n') } })
  console.log(`+ Case ${c.nome}`)
}

const configAtual = await payload.findGlobal({ slug: 'orcamento-config', depth: 0 })
if (configAtual.outrasInformacoes?.length) {
  console.log('= Configurações de orçamento (já preenchidas)')
} else {
  await payload.updateGlobal({ slug: 'orcamento-config', data: { outrasInformacoes: outrasInformacoes.map((texto) => ({ texto })) } })
  console.log('+ Configurações de orçamento')
}

console.log('Pronto. As imagens dos cases e a foto do PDF você sobe pelo painel.')
process.exit(0)
