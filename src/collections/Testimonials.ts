import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Depoimento', plural: 'Depoimentos' },
  orderable: true,
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'name',
    defaultColumns: ['photo', 'name', 'role', 'isSample', 'published'],
    description: 'Com autorização de uso de nome e foto. Sem nenhum publicado, a seção some.',
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
          name: 'role',
          type: 'text',
          label: 'O que faz',
          admin: { width: '50%', description: 'Ex: CEO da Sollevo' },
        },
      ],
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Depoimento',
      required: true,
      admin: { description: 'Breve: duas ou três frases.' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Foto (opcional)',
      admin: { description: 'Quadrada. Sem foto, aparece um avatar pixel gerado a partir do nome.' },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicado',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isSample',
      type: 'checkbox',
      label: 'Exemplo (fictício)',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Depoimento de exemplo para testar o layout. Nunca aparece no site publicado, só no ambiente de teste.',
      },
    },
  ],
}
