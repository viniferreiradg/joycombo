import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

// Planos da tabela de precos. Cada plano junta um ou mais servicos avulsos:
// o "De" e a soma deles, e a economia e a diferenca para o "Por".
export const Plans: CollectionConfig = {
  slug: 'plans',
  labels: { singular: 'Plano', plural: 'Planos' },
  orderable: true,
  admin: {
    group: 'Planos',
    useAsTitle: 'name',
    defaultColumns: ['name', 'tabs', 'price', 'deadlineDays', 'published'],
    description: 'Arraste para ordenar: a ordem aqui é a ordem dos cards em cada aba.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nome do plano',
          required: true,
          admin: { description: 'Usado na mensagem do WhatsApp e nos relatórios. No card, o título é montado pela aba: SITE, + MARCA, + INSTA, + NOME.' },
        },
      ],
    },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      required: true,
      label: 'Serviços incluídos',
      admin: {
        description: 'O card lista todos os serviços avulsos, com check nos incluídos. Com mais de um serviço, mostra o "De" (soma dos avulsos) e a economia.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          label: 'Preço "Por" (R$)',
          min: 0,
          admin: { width: '50%', step: 0.01, description: 'Vazio = "Sob consulta".' },
        },
        {
          name: 'deadlineDays',
          type: 'number',
          label: 'Prazo (dias)',
          min: 0,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'whatsappMessage',
      type: 'text',
      label: 'Mensagem pronta do WhatsApp (opcional)',
      admin: {
        description: 'Se vazio: "Oi! Vim pelo site e tenho interesse no plano <nome>."',
      },
    },
    {
      name: 'tabs',
      type: 'select',
      hasMany: true,
      required: true,
      label: 'Aparece nas abas',
      options: [
        { label: 'Preciso de site', value: 'site' },
        { label: 'Preciso de marca', value: 'marca' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'highlight',
      type: 'checkbox',
      label: 'Destacar',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Card com fundo verde e selo.' },
    },
    {
      name: 'highlightLabel',
      type: 'text',
      label: 'Texto do selo',
      defaultValue: 'Recomendado',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => Boolean(siblingData?.highlight),
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicado',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
