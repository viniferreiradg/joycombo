import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Pergunta', plural: 'Perguntas frequentes' },
  orderable: true,
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'question',
    defaultColumns: ['question', 'published'],
    description: 'Respostas diretas, sem trocadilho. Arraste para ordenar.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    { name: 'question', type: 'text', label: 'Pergunta', required: true },
    {
      name: 'answer',
      type: 'textarea',
      label: 'Resposta',
      required: true,
      admin: { description: 'Linha em branco separa parágrafos.' },
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
