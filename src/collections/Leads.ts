import type { CollectionConfig } from 'payload'

// Contatos que preencheram o formulario do fim da pagina. O envio vai pro
// WhatsApp de qualquer jeito; isto e so uma copia para nao perder quem
// fechou o WhatsApp sem mandar a mensagem. Gravado pela rota /lead (com
// honeypot), nunca direto pela API publica.
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Contato', plural: 'Contatos do formulário' },
  admin: {
    group: 'Contatos',
    useAsTitle: 'name',
    defaultColumns: ['name', 'whatsapp', 'segment', 'utmSource', 'createdAt'],
    description: 'Quem preencheu o formulário do site. Os dados seguem a Política de Privacidade.',
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nome', required: true, admin: { width: '33%' } },
        { name: 'whatsapp', type: 'text', label: 'WhatsApp', required: true, admin: { width: '33%' } },
        { name: 'segment', type: 'text', label: 'Segmento', admin: { width: '33%' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Origem da visita',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'utmSource', type: 'text', label: 'utm_source', admin: { width: '33%' } },
            { name: 'utmMedium', type: 'text', label: 'utm_medium', admin: { width: '33%' } },
            { name: 'utmCampaign', type: 'text', label: 'utm_campaign', admin: { width: '33%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'utmContent', type: 'text', label: 'utm_content', admin: { width: '33%' } },
            { name: 'utmTerm', type: 'text', label: 'utm_term', admin: { width: '33%' } },
            { name: 'priceVariant', type: 'text', label: 'Versão da tabela (A/B)', admin: { width: '33%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'gclid', type: 'text', label: 'gclid', admin: { width: '50%' } },
            { name: 'fbclid', type: 'text', label: 'fbclid', admin: { width: '50%' } },
          ],
        },
        { name: 'landingUrl', type: 'text', label: 'Página de entrada' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'novo',
      options: [
        { label: 'Novo', value: 'novo' },
        { label: 'Em conversa', value: 'conversa' },
        { label: 'Fechou', value: 'fechou' },
        { label: 'Não fechou', value: 'perdido' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Anotações',
      admin: { position: 'sidebar' },
    },
  ],
}
