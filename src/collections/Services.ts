import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

const rowLabel = { components: { RowLabel: '@/components/admin/ArrayRowLabel' } }

// Servicos avulsos (Marca, Site, Kit Instagram). O preco de tabela de cada
// um soma o "De" dos combos, e a lista "o que inclui" aparece nos cards.
export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Serviço avulso', plural: 'Serviços avulsos' },
  orderable: true,
  admin: {
    group: 'Planos',
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'deadlineDays'],
    description: 'Preço de tabela de cada serviço. O "De" e a economia dos combos são calculados a partir daqui.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Nome', required: true, admin: { width: '50%' } },
        {
          name: 'shortName',
          type: 'text',
          label: 'Nome curto',
          admin: { width: '50%', description: 'Título do serviço dentro dos cards de plano. Ex: Site, Marca, Kit Insta, Nome.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          label: 'Preço (R$)',
          min: 0,
          admin: { width: '50%', step: 0.01, description: 'Ex: 1390.90. Vazio = sob consulta (ex: naming).' },
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
      name: 'includes',
      type: 'array',
      label: 'O que vem (itens nos cards)',
      labels: { singular: 'Item', plural: 'Itens' },
      admin: { ...rowLabel, description: 'O que o cliente ganha, em 2 ou 3 palavras por item. Ex: Até 5 páginas.' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
}
