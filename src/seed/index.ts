// Conteudo inicial do brief: servicos avulsos, planos e perguntas frequentes.
// Rodar com `npm run seed`. So cria o que ainda nao existe (pode rodar de
// novo sem duplicar). Nao cria usuario: o primeiro acesso a /admin pede isso.
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../payload.config'

// Itens = o que o cliente ganha, em 2 ou 3 palavras (aparecem com check
// dentro dos cards de plano).
// ATENCAO: "Logo e versões" e "Guia de uso" ainda dependem de confirmacao do Vini.
const services = [
  {
    key: 'site',
    name: 'Site institucional (até 5 páginas)',
    shortName: 'Site',
    price: 1590.9,
    deadlineDays: 20,
    includes: [
      'Layout estratégico',
      'Até 5 páginas',
      'Painel editável',
      'SEO + Search Console',
      'Microsoft Clarity',
      '3 rodadas de ajuste',
    ],
  },
  {
    key: 'marca',
    name: 'Identidade visual',
    shortName: 'Marca',
    price: 1390.9,
    deadlineDays: 20,
    includes: ['Logo e versões', 'Cores e fontes', 'Guia de uso', 'Arquivos finais', '3 rodadas de ajuste'],
  },
  {
    key: 'insta',
    name: 'Kit Instagram (6 posts)',
    shortName: 'Insta',
    price: 690.9,
    deadlineDays: 7,
    includes: ['6 posts', 'Feed + stories', 'Legendas prontas', 'Visual da marca'],
  },
  {
    key: 'naming',
    name: 'Criação de nome',
    shortName: 'Nome',
    price: null,
    deadlineDays: null,
    includes: ['Alternativas de nome', 'Pesquisa no INPI', 'Domínio e @ livres', 'Registro com parceiro'],
  },
] as const

const plans = [
  { name: 'Site', services: ['site'], price: 1590.9, deadlineDays: 20, tabs: ['site'] },
  {
    name: 'Site + Marca',
    services: ['site', 'marca'],
    price: 2690.9,
    deadlineDays: 35,
    tabs: ['site'],
    highlight: true,
    highlightLabel: 'Recomendado',
  },
  { name: 'Marca', services: ['marca'], price: 1390.9, deadlineDays: 20, tabs: ['marca'] },
  {
    name: 'Marca + Insta',
    services: ['marca', 'insta'],
    price: 1890.9,
    deadlineDays: 22,
    tabs: ['marca'],
    highlight: true,
    highlightLabel: 'Recomendado',
  },
  // Mesmo plano nas duas abas. A ordem dos servicos importa so para a lista
  { name: 'Marca + Site + Insta', services: ['marca', 'site', 'insta'], price: 3190.9, deadlineDays: 42, tabs: ['site', 'marca'] },
  {
    name: 'Marca + Site + Insta + Nome',
    services: ['marca', 'site', 'insta', 'naming'],
    price: null,
    deadlineDays: null,
    tabs: ['site', 'marca'],
    whatsappMessage: 'Oi! Vim pelo site e tenho interesse em marca, site, Instagram e criação do nome do negócio.',
  },
] as const

const faqs = [
  {
    question: 'Quanto tempo leva?',
    answer:
      'Depende do plano. Marca: 20 dias. Site: 20 dias. Kit Instagram: 7 dias. Marca + Insta: 22 dias. Site + Marca: 35 dias. Marca + Site + Insta: 42 dias.\n\nCada fase termina com uma entrega para você aprovar antes da próxima.',
  },
  {
    question: 'Quais as formas de pagamento?',
    answer: 'À vista no Pix com 5% de desconto ou em até 5x no cartão, pelo Mercado Pago.',
  },
  {
    question: 'Consigo editar o site sozinho depois?',
    answer: 'Sim. Na entrega, a gente ensina você a usar a ferramenta do site para trocar textos e imagens sem depender de ninguém.',
  },
  {
    question: 'Domínio e hospedagem estão inclusos?',
    answer: 'Não. O Joycombo te ajuda a contratar o domínio e a hospedagem, e os custos ficam por sua conta, pagos direto ao fornecedor.',
  },
  {
    question: 'Quantas alterações posso pedir?',
    answer:
      'Na marca, até 3 listas de alterações depois da apresentação das alternativas. No site, até 3 listas de alterações no layout.\n\nMudanças pedidas depois da programação do site são orçadas à parte.',
  },
  {
    question: 'E se eu já tiver uma marca?',
    answer: 'Sem problema. Na aba Site, o plano Site cria o seu site a partir da marca que você já tem.',
  },
  {
    question: 'Vocês criam o nome do negócio?',
    answer:
      'Sim, sob consulta. A gente cria as alternativas de nome e pesquisa a disponibilidade no INPI, no domínio e no Instagram. O pedido de registro da marca é feito por um parceiro especializado, contratado à parte.\n\nA criação do nome está no último plano de cada aba (+ Nome), sob consulta.',
  },
  {
    question: 'Fiz minha marca no ChatGPT e meu site no Lovable, mas não deu resultado. Vale refazer?',
    answer:
      'Vale. As ferramentas de IA ajudam a começar rápido, só que costumam entregar algo parecido com o de todo mundo. Num projeto feito por designer, a marca é pensada para o seu público, a mensagem fica clara em poucos segundos e o site é organizado para levar a pessoa até o contato.\n\nSe a sua marca ainda serve, o plano Site resolve. Se a marca também precisa mudar, os planos que juntam site e marca fazem tudo junto.',
  },
]

// Depoimentos FICTICIOS para testar o layout. Marcados como exemplo
// (isSample): nunca aparecem no site publicado, so no ambiente de teste.
const sampleTestimonials = [
  {
    name: 'Mariana Lopes',
    role: 'Fundadora da Doce Cereja Confeitaria',
    text: 'Eu tinha CNPJ e nenhuma cara. Saí com marca, posts e site no ar de uma vez só. Hoje o cliente chega pelo Instagram já sabendo o que eu faço.',
  },
  {
    name: 'Rafael Teixeira',
    role: 'Sócio da Teixeira & Brum Advocacia',
    text: 'Nosso site feito no Lovable não passava seriedade. O novo deixou claro o que a gente faz, e o WhatsApp começou a tocar.',
  },
  {
    name: 'Camila Duarte',
    role: 'Nutricionista',
    text: 'O processo em fases me deixou tranquila. Eu aprovava cada etapa antes de seguir, sem surpresa no meio do caminho.',
  },
  {
    name: 'Bruno Saldanha',
    role: 'CEO da Vento Sul Turismo',
    text: 'Fiz a marca no ChatGPT e achava que estava bom. Quando vi o projeto novo lado a lado, entendi a diferença na hora.',
  },
  {
    name: 'Letícia Amaral',
    role: 'Dona do Studio Lótus Pilates',
    text: 'O preço aberto foi o que me fez chamar. Eu sabia quanto ia pagar e em quanto tempo ia ficar pronto.',
  },
]

// Logos de clientes (os mesmos do portfolio viniferreira.com.br, na mesma
// ordem). Arquivos em src/seed/clientes.
const clients = [
  { name: 'Açailand', file: 'clientes_01.png' },
  { name: 'Facility', file: 'clientes_02.png' },
  { name: 'Sollevo', file: 'clientes_03.png' },
  { name: 'Milvus', file: 'clientes_04.png' },
  { name: 'Bradda', file: 'clientes_05.png' },
  { name: 'Imbé Festival', file: 'clientes_10.png' },
  { name: 'Plathanus', file: 'clientes_09.png' },
  { name: 'BomControle', file: 'clientes_08.png' },
  { name: 'Gravital', file: 'clientes_07.png' },
  { name: 'Attalar', file: 'clientes_06.png' },
]

async function run() {
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  // Servicos
  const ids: Record<string, number | string> = {}
  for (const s of services) {
    const found = await payload.find({ collection: 'services', where: { name: { equals: s.name } }, limit: 1 })
    if (found.docs[0]) {
      ids[s.key] = found.docs[0].id
      log(`servico ja existe: ${s.name}`)
      continue
    }
    const doc = await payload.create({
      collection: 'services',
      data: {
        name: s.name,
        shortName: s.shortName,
        price: s.price,
        deadlineDays: s.deadlineDays,
        includes: s.includes.map((text) => ({ text })),
      },
    })
    ids[s.key] = doc.id
    log(`servico criado: ${s.name}`)
  }

  // Planos
  for (const p of plans) {
    const found = await payload.find({ collection: 'plans', where: { name: { equals: p.name } }, limit: 1 })
    if (found.docs[0]) {
      log(`plano ja existe: ${p.name}`)
      continue
    }
    await payload.create({
      collection: 'plans',
      data: {
        ...p,
        services: p.services.map((k) => ids[k]) as number[],
        tabs: [...p.tabs],
        published: true,
      },
    })
    log(`plano criado: ${p.name}`)
  }

  // Perguntas frequentes
  for (const f of faqs) {
    const found = await payload.find({ collection: 'faqs', where: { question: { equals: f.question } }, limit: 1 })
    if (found.docs[0]) continue
    await payload.create({ collection: 'faqs', data: { ...f, published: true } })
    log(`pergunta criada: ${f.question}`)
  }

  // Clientes (logos)
  for (const c of clients) {
    const found = await payload.find({ collection: 'clients', where: { name: { equals: c.name } }, limit: 1 })
    if (found.docs[0]) continue
    const data = fs.readFileSync(path.resolve(process.cwd(), 'src/seed/clientes', c.file))
    const logo = await payload.create({
      collection: 'media',
      data: { alt: c.name },
      file: { data, mimetype: 'image/png', name: c.file, size: data.length },
    })
    await payload.create({ collection: 'clients', data: { name: c.name, logo: logo.id, published: true } })
    log(`cliente criado: ${c.name}`)
  }

  // Foto (video em loop) do Vini na secao "Quem faz"
  const landing = await payload.findGlobal({ slug: 'landing', depth: 0 })
  if (!landing.aboutPhoto) {
    const data = fs.readFileSync(path.resolve(process.cwd(), 'src/seed/vini-ferreira.mp4'))
    const video = await payload.create({
      collection: 'media',
      data: { alt: 'Vini Ferreira' },
      file: { data, mimetype: 'video/mp4', name: 'vini-ferreira.mp4', size: data.length },
    })
    await payload.updateGlobal({ slug: 'landing', data: { aboutPhoto: video.id } })
    log('video do Vini adicionado')
  }

  // Depoimentos de exemplo
  for (const t of sampleTestimonials) {
    const found = await payload.find({ collection: 'testimonials', where: { name: { equals: t.name } }, limit: 1 })
    if (found.docs[0]) continue
    await payload.create({ collection: 'testimonials', data: { ...t, published: true, isSample: true } })
    log(`depoimento de exemplo criado: ${t.name}`)
  }

  log('pronto')
  process.exit(0)
}

// Top-level await: o "payload run" encerra o processo assim que o import termina
try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
