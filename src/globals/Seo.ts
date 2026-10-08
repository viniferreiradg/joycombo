import type { GlobalConfig } from 'payload'
import { revalidateSite } from '@/lib/revalidate'
import { seoDefaults as d, settingsDefaults } from '@/content/defaults'

// Tudo de busca e compartilhamento num lugar só. Campo vazio usa o padrão.
export const Seo: GlobalConfig = {
  slug: 'seo',
  label: 'SEO',
  admin: {
    group: 'Site',
    description: 'Como o site aparece no Google e no preview dos links (WhatsApp, Instagram). Campo vazio volta para o padrão.',
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
          label: 'Página inicial',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Título',
              defaultValue: settingsDefaults.siteTitle,
              admin: { description: 'Até 60 caracteres. É o texto azul no resultado do Google e o nome da aba do navegador.' },
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Descrição',
              defaultValue: settingsDefaults.siteDescription,
              admin: { description: 'Até 155 caracteres. Aparece embaixo do título no Google e no preview do link.' },
            },
            {
              name: 'keywords',
              type: 'text',
              label: 'Palavras-chave',
              defaultValue: d.keywords,
              admin: { description: 'Separadas por vírgula. O Google quase não usa, mas outros buscadores sim.' },
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Imagem de compartilhamento',
              admin: { description: '1200x630px. Aparece quando o link é enviado no WhatsApp, Instagram etc. Vazio = imagem padrão com a marca.' },
            },
          ],
        },
        {
          label: 'Outras páginas',
          fields: [
            {
              type: 'collapsible',
              label: 'Política de Privacidade',
              fields: [
                { name: 'privacyTitle', type: 'text', label: 'Título', defaultValue: d.privacyTitle },
                { name: 'privacyDescription', type: 'textarea', label: 'Descrição', defaultValue: d.privacyDescription },
              ],
            },
          ],
        },
        {
          label: 'Indexação',
          description: 'O que o Google pode ou não mostrar.',
          fields: [
            {
              name: 'indexable',
              type: 'checkbox',
              label: 'Mostrar o site no Google',
              defaultValue: true,
              admin: { description: 'Desmarcado, o site pede para não aparecer em nenhum buscador (útil enquanto não está pronto).' },
            },
            {
              name: 'blockedPaths',
              type: 'array',
              label: 'Páginas escondidas do Google',
              labels: { singular: 'Página', plural: 'Páginas' },
              admin: { description: 'Caminhos que o Google não deve visitar, além do painel. Ex: /politica-de-privacidade' },
              fields: [{ name: 'path', type: 'text', label: 'Caminho', required: true }],
            },
          ],
        },
        {
          label: 'Verificações',
          description: 'Códigos que os buscadores pedem para provar que o site é seu.',
          fields: [
            {
              name: 'googleVerification',
              type: 'text',
              label: 'Google Search Console',
              admin: { description: 'Só o código do content da meta tag google-site-verification.' },
            },
            {
              name: 'bingVerification',
              type: 'text',
              label: 'Bing Webmaster Tools',
              admin: { description: 'Só o código do content da meta tag msvalidate.01.' },
            },
          ],
        },
        {
          label: 'Dados da empresa',
          description: 'Informações que o Google usa nos resultados ricos (ficha da empresa, perguntas frequentes).',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'businessName', type: 'text', label: 'Nome da empresa', defaultValue: d.businessName, admin: { width: '50%' } },
                { name: 'founder', type: 'text', label: 'Fundador', defaultValue: d.founder, admin: { width: '50%' } },
              ],
            },
          ],
        },
        {
          label: 'Tags extras',
          description: 'Para colar meta tags que alguma ferramenta pedir (ex.: verificação do Pinterest ou da Meta).',
          fields: [
            {
              name: 'metaTags',
              type: 'array',
              label: 'Meta tags',
              labels: { singular: 'Meta tag', plural: 'Meta tags' },
              admin: { description: 'Viram <meta name="..." content="..."> no código da página.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'name', required: true, admin: { width: '40%' } },
                    { name: 'content', type: 'text', label: 'content', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
