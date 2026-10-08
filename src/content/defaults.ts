// Textos padrao da landing. Servem de defaultValue nos campos do admin e de
// reserva no site enquanto o campo estiver vazio: assim a pagina nunca fica
// sem texto, mesmo antes do primeiro "Salvar" no painel.
//
// Regras de tom (brief): sem travessao, sem "nao e X, e Y", no maximo uma
// referencia gamer por secao e informacao critica sempre literal.

export const landingDefaults = {
  // Topo
  heroLine: 'Marca e site pra quem tá começando',
  heroCtaLabel: 'Chamar no WhatsApp',
  heroWhatsMessage: 'Oi! Vim pelo site do Joycombo e quero saber mais.',

  // Antes e depois
  casesKicker: 'Já tentou sozinho?',
  casesTitle: 'Antes e depois',
  casesIntro: 'Arraste pra ver a diferença entre o que foi feito sozinho e um projeto feito por designer.',

  // Pra quem e
  audienceKicker: 'Pra quem é',
  audienceTitle: 'Vamos para a próxima fase',
  audienceIntro: 'Tirando o negócio do papel ou depois de tentar sozinho, o objetivo é o mesmo: um negócio que passa confiança e traz cliente.',
  audienceCards: [
    {
      tab: 'marca',
      title: 'Tô começando agora',
      text: 'Você está tirando o negócio do papel, acabou de abrir o CNPJ e ainda não tem marca, Instagram nem site. A gente entrega tudo junto e pronto pra usar.',
      bullets: [{ text: 'Marca do zero' }, { text: 'Posts iniciais pro Instagram' }, { text: 'Site no ar' }],
      buttonLabel: 'Ver planos de marca',
    },
    {
      tab: 'site',
      title: 'Já tentei sozinho',
      text: 'Você fez a marca no ChatGPT e montou o site no Lovable, mas o resultado não passa confiança e o cliente não chega. Faz parte do caminho. Agora é hora de um projeto pensado por designer.',
      bullets: [{ text: 'Visual que passa confiança' }, { text: 'Mensagem clara em 3 segundos' }, { text: 'Site feito pra trazer contato' }],
      buttonLabel: 'Ver planos de site',
    },
  ],

  // Portfolio
  portfolioKicker: 'Portfólio',
  portfolioTitle: 'Trabalhos no ar',
  portfolioIntro: 'Marcas e sites feitos pelo Vini, sozinho ou em parceria com outros estúdios.',

  // Planos
  plansKicker: 'Planos',
  plansTitle: 'Escolha seu combo',
  plansIntro: 'Preço aberto, prazo definido e tudo que está incluso, sem surpresa. Nos combos você paga menos do que contratando cada serviço separado.',
  tabPrefix: 'Preciso de',
  tabSiteLabel: 'Site',
  tabMarcaLabel: 'Marca',
  priceDisplay: 'aberto',
  fromPrefix: 'A partir de',
  planCtaLabel: 'Quero esse plano',
  paymentNote: 'À vista no Pix com 5% de desconto ou em até 5x no cartão (Mercado Pago).',
  onRequestLabel: 'Sob consulta',
  cumulativePrefix: 'Tudo de {plano}, mais:',
  servicesNote: 'Domínio e hospedagem com nosso suporte, custos por conta do cliente.',
  customTitle: 'Precisa de algo sob medida?',
  customText: 'Arquitetura de marca para grupos com vários produtos, e-commerce, site com mais páginas. Conta o que você precisa e a gente monta um orçamento.',
  customCtaLabel: 'Pedir orçamento no WhatsApp',
  customMessage: 'Oi! Preciso de um orçamento personalizado.',
  outOfScope: 'Não estão inclusos: produção de conteúdo, aquisição ou produção de fotografias, impressão de materiais, revisão ortográfica, papelaria e acompanhamento de produção gráfica.',

  // Depoimentos
  testimonialsKicker: 'Depoimentos',
  testimonialsTitle: 'Quem já passou por aqui',

  // Quem faz
  aboutKicker: 'Quem faz',
  aboutName: 'Vini Ferreira',
  aboutRole: 'Designer e fundador do Joycombo',
  aboutText: 'Designer com mais de 15 anos criando sites e identidades visuais. Passei 9 anos na Bradda, escritório de branding, onde liderei a frente de sites e atuei em projetos de marca para mais de 100 empresas. Formado em Design Gráfico pela UDESC.\n\nNo Joycombo, quem cuida do teu projeto do começo ao fim sou eu.',
  aboutStats: [
    { value: '15+', label: 'anos criando marcas e sites' },
    { value: '50+', label: 'projetos web liderados' },
    { value: '100+', label: 'empresas em projetos de marca' },
    { value: '+24%', label: 'em geração de leads na Milvus, com melhorias no site e campanhas' },
  ],

  // FAQ
  faqKicker: 'Dúvidas',
  faqTitle: 'Perguntas frequentes',

  // Chamada final
  ctaTitle: 'Pronto pra passar pra próxima fase?',
  ctaText: 'Chama no WhatsApp e conta sobre o teu negócio. A gente te ajuda a escolher o plano certo.',
  ctaButtonLabel: 'Chamar no WhatsApp',
  ctaWhatsMessage: 'Oi! Vim pelo site do Joycombo e quero saber mais.',
  formTitle: 'Prefere que a gente comece a conversa?',
  formText: 'Deixa teu nome, WhatsApp e o segmento do negócio. Ao enviar, abre o WhatsApp com a mensagem pronta.',
  formButtonLabel: 'Enviar e abrir o WhatsApp',
  formMessage: 'Oi! Sou {nome}, meu negócio é de {segmento}. Vim pelo site do Joycombo e quero saber mais.',

  // Jogo
  gameEnabled: true,
  gamePointsPerHit: 50,
  gamePointsGoal: 750,
  gameCouponCode: 'JOYCOMBO5',
  gameCouponText: 'Você ganhou 5% de desconto em qualquer plano.',
  gameCouponCta: 'Resgatar no WhatsApp',
  gameCouponMessage: 'Oi! Ganhei o cupom {codigo} no jogo do site.',

  // Rodape
  footerTagline: 'Vamos juntos para a sua fase profissional',
}

export type LandingContent = typeof landingDefaults

export const settingsDefaults = {
  whatsapp: '5548999450235',
  email: '',
  instagram: 'joycombo.design',
  cnpj: '',
  siteTitle: 'Joycombo · Criação de marca e site para pequenos negócios',
  siteDescription: 'Criação de marca, site e posts de Instagram em combos com preço aberto. Para quem está começando ou já tentou sozinho e não viu resultado.',
  city: 'Florianópolis',
  region: 'SC',
}

// SEO (menu SEO do admin). Titulo e descricao da home caem nos antigos campos
// de Configuracoes (siteTitle/siteDescription) quando o SEO esta vazio.
export const seoDefaults = {
  keywords: 'criação de marca, criação de site, identidade visual, logo, site para pequenos negócios, posts para Instagram',
  privacyTitle: 'Política de Privacidade · Joycombo',
  privacyDescription: 'Como o Joycombo coleta, usa e protege os seus dados.',
  businessName: 'Joycombo',
  founder: 'Vini Ferreira',
}

/** Usa o valor do CMS quando preenchido; senao, o padrao do codigo. */
export function withDefaults<T extends Record<string, unknown>>(data: Partial<T> | null | undefined, defaults: T): T {
  const out = { ...defaults }
  if (!data) return out
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const v = data[key]
    const empty = v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
    if (!empty) out[key] = v as T[keyof T]
  }
  return out
}
