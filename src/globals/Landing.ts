import type { Field, GlobalConfig } from 'payload'
import { revalidateSite } from '@/lib/revalidate'
import { landingDefaults as d } from '@/content/defaults'

const rowLabel = { components: { RowLabel: '@/components/admin/ArrayRowLabel' } }

// Atalhos para os campos de texto, sempre com o padrao do codigo
function text(name: keyof typeof d, label: string, description?: string): Field {
  return { name, type: 'text', label, defaultValue: d[name] as string, admin: { description } }
}
function area(name: keyof typeof d, label: string, description?: string): Field {
  return { name, type: 'textarea', label, defaultValue: d[name] as string, admin: { description } }
}
function half(...fields: Field[]): Field {
  return {
    type: 'row',
    fields: fields.map((f) => ({ ...f, admin: { ...('admin' in f ? f.admin : {}), width: '50%' } }) as Field),
  }
}

const titleHelp = 'Curto: até umas 5 palavras. O resto vai no texto de apoio.'
const whatsHelp = 'Mensagem que já vem escrita quando a pessoa abre o WhatsApp.'

export const Landing: GlobalConfig = {
  slug: 'landing',
  label: 'Landing page',
  admin: {
    group: 'Site',
    description: 'Todos os textos da página. Campo vazio volta para o texto padrão.',
  },
  hooks: {
    afterChange: [() => revalidateSite()],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Topo',
          description: 'Primeira tela: só o vídeo dos trabalhos (feito no Remotion, pasta video/ do projeto).',
          fields: [
            text('heroLine', 'Título da página (invisível)', 'Não aparece na tela: é o título principal para o Google e leitores de tela. Diz o que é e pra quem.'),
            // o topo não tem mais botão; o campo fica guardado, só escondido
            { ...text('heroCtaLabel', 'Texto do botão'), admin: { hidden: true } } as Field,
            text('heroWhatsMessage', 'Mensagem do WhatsApp', `${whatsHelp} Vale para o botão do menu e o flutuante.`),
            {
              type: 'collapsible',
              label: 'Vídeo',
              fields: [
                half(
                  {
                    name: 'heroVideo',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Vídeo horizontal (desktop)',
                    admin: { description: '.mp4 (H.264), em loop, sem áudio, 1920x840. O vídeo do Remotion sai em video/out/.' },
                  },
                  {
                    name: 'heroVideoMobile',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Vídeo vertical (celular)',
                    admin: { description: '.mp4 1080x1350 (pasta video-mobile/ do projeto). Se vazio, usa o horizontal.' },
                  },
                ),
                half(
                  {
                    name: 'heroPoster',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Imagem de capa (desktop)',
                    admin: { description: 'Aparece antes do vídeo carregar. Primeiro quadro do vídeo.' },
                  },
                  {
                    name: 'heroPosterMobile',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Imagem de capa (celular)',
                  },
                ),
              ],
            },
          ],
        },
        {
          label: 'Seções',
          description: 'Títulos e textos das seções do meio da página.',
          fields: [
            {
              type: 'collapsible',
              label: 'Antes e depois',
              // escondido junto com a collection Cases (ver src/collections/Cases.ts)
              admin: { initCollapsed: true, hidden: true, description: 'Os casos ficam em Conteúdo > Antes e depois.' },
              fields: [half(text('casesKicker', 'Chamada'), text('casesTitle', 'Título')), area('casesIntro', 'Texto de apoio')],
            },
            {
              type: 'collapsible',
              label: 'Pra quem é',
              admin: { initCollapsed: true },
              fields: [
                half(text('audienceKicker', 'Chamada'), text('audienceTitle', 'Título', titleHelp)),
                area('audienceIntro', 'Texto de apoio'),
                {
                  name: 'audienceCards',
                  type: 'array',
                  label: 'Perfis',
                  labels: { singular: 'Perfil', plural: 'Perfis' },
                  defaultValue: d.audienceCards,
                  maxRows: 2,
                  admin: rowLabel,
                  fields: [
                    { name: 'title', type: 'text', label: 'Título', required: true },
                    { name: 'text', type: 'textarea', label: 'Texto' },
                    {
                      name: 'bullets',
                      type: 'array',
                      label: 'Itens',
                      admin: rowLabel,
                      fields: [{ name: 'text', type: 'text', required: true }],
                    },
                    {
                      type: 'row',
                      fields: [
                        { name: 'buttonLabel', type: 'text', label: 'Texto do botão', admin: { width: '50%' } },
                        {
                          name: 'tab',
                          type: 'select',
                          label: 'Abre a aba de planos',
                          defaultValue: 'marca',
                          options: [
                            { label: 'Marca', value: 'marca' },
                            { label: 'Site', value: 'site' },
                          ],
                          admin: { width: '50%' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Portfólio',
              admin: { initCollapsed: true, description: 'Os projetos ficam em Conteúdo > Projetos.' },
              fields: [
                half(text('portfolioKicker', 'Chamada'), text('portfolioTitle', 'Título')),
                area('portfolioIntro', 'Texto de apoio'),
                text('portfolioTabAll', 'Aba com todos os projetos'),
                half(text('portfolioTabSites', 'Aba de sites'), text('portfolioTabBrands', 'Aba de identidade visual')),
                text('portfolioEmpty', 'Aba sem projetos', 'Aparece quando a aba escolhida ainda não tem projeto publicado.'),
              ],
            },
            {
              type: 'collapsible',
              label: 'Depoimentos',
              admin: { initCollapsed: true },
              fields: [half(text('testimonialsKicker', 'Chamada'), text('testimonialsTitle', 'Título'))],
            },
            {
              type: 'collapsible',
              label: 'Quem faz',
              admin: { initCollapsed: true },
              fields: [
                half(text('aboutKicker', 'Chamada'), text('aboutName', 'Nome')),
                text('aboutRole', 'Cargo'),
                area('aboutText', 'Bio', 'Linha em branco separa parágrafos.'),
                {
                  name: 'aboutPhoto',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Foto ou vídeo',
                  admin: { description: 'Imagem ou .mp4 (toca em loop, sem som). Proporção 4:5.' },
                },
                {
                  name: 'aboutStats',
                  type: 'array',
                  label: 'Números',
                  defaultValue: d.aboutStats,
                  admin: rowLabel,
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'value', type: 'text', label: 'Número', required: true, admin: { width: '30%' } },
                        { name: 'label', type: 'text', label: 'Texto', admin: { width: '70%' } },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Perguntas frequentes',
              admin: { initCollapsed: true, description: 'As perguntas ficam em Conteúdo > Perguntas frequentes.' },
              fields: [half(text('faqKicker', 'Chamada'), text('faqTitle', 'Título'))],
            },
          ],
        },
        {
          label: 'Planos',
          description: 'Textos da tabela de preços. Os planos e preços ficam em Planos.',
          fields: [
            half(text('plansKicker', 'Chamada'), text('plansTitle', 'Título')),
            area('plansIntro', 'Texto de apoio'),
            {
              name: 'priceDisplay',
              type: 'radio',
              label: 'Como mostrar o preço',
              defaultValue: d.priceDisplay,
              options: [
                { label: 'Preço aberto (De / Por / economia)', value: 'aberto' },
                { label: '"A partir de R$ ..."', value: 'a-partir' },
                { label: 'Teste A/B: metade das visitas vê cada versão', value: 'teste-ab' },
              ],
              admin: {
                description: 'No teste A/B, cada visitante fica sempre na mesma versão e os eventos de clique levam a versão junto.',
              },
            },
            {
              type: 'row',
              fields: [
                { ...text('tabPrefix', 'Prefixo das abas'), admin: { width: '33%' } } as Field,
                { ...text('tabSiteLabel', 'Aba site'), admin: { width: '33%' } } as Field,
                { ...text('tabMarcaLabel', 'Aba marca'), admin: { width: '33%' } } as Field,
              ],
            },
            half(text('planCtaLabel', 'Botão dos cards'), text('fromPrefix', 'Texto "a partir de"')),
            text('paymentNote', 'Formas de pagamento', 'Linha discreta abaixo dos preços.'),
            half(
              text('onRequestLabel', 'Texto quando o plano não tem preço', 'Ex: o plano com criação de nome.'),
            ),
            {
              type: 'collapsible',
              label: 'Sob medida',
              admin: { initCollapsed: true },
              fields: [
                text('customTitle', 'Título'),
                area('customText', 'Texto'),
                half(text('customCtaLabel', 'Texto do botão'), text('customMessage', 'Mensagem do WhatsApp')),
              ],
            },
            text('cumulativePrefix', 'Linha "tudo do plano anterior"', 'Use {plano} para o que o card anterior já tem (ex: Site + Marca). Evita repetir os mesmos itens nos cards.'),
            text('servicesNote', 'Nota abaixo dos cards', 'Ex: domínio e hospedagem.'),
            area('outOfScope', 'Fora do escopo', 'Texto pequeno no fim da seção.'),
          ],
        },
        {
          label: 'Contato',
          description: 'Chamada final e formulário.',
          fields: [
            text('ctaTitle', 'Título'),
            area('ctaText', 'Texto'),
            half(text('ctaButtonLabel', 'Texto do botão'), text('ctaWhatsMessage', 'Mensagem do WhatsApp', whatsHelp)),
            half(text('formTitle', 'Título do formulário'), text('formButtonLabel', 'Botão do formulário')),
            area('formText', 'Texto do formulário'),
            text('formMessage', 'Mensagem do formulário', 'Use {nome} e {segmento}.'),
          ],
        },
        {
          label: 'Jogo',
          description: 'Easter egg: a navezinha vira um Asteroids perto do fim da página.',
          fields: [
            {
              name: 'gameEnabled',
              type: 'checkbox',
              label: 'Mostrar o jogo',
              defaultValue: d.gameEnabled,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'gamePointsPerHit',
                  type: 'number',
                  label: 'Pontos por asteroide',
                  defaultValue: d.gamePointsPerHit,
                  min: 1,
                  admin: { width: '33%' },
                },
                {
                  name: 'gamePointsGoal',
                  type: 'number',
                  label: 'Pontos para ganhar o cupom',
                  defaultValue: d.gamePointsGoal,
                  min: 1,
                  admin: { width: '33%' },
                },
                { ...text('gameCouponCode', 'Código do cupom'), admin: { width: '33%' } } as Field,
              ],
            },
            text('gameCouponText', 'Texto do prêmio'),
            half(text('gameCouponCta', 'Botão do prêmio'), text('gameCouponMessage', 'Mensagem do WhatsApp', 'Use {codigo} para o cupom.')),
          ],
        },
        {
          label: 'Rodapé',
          fields: [text('footerTagline', 'Frase do rodapé')],
        },
      ],
    },
  ],
}
