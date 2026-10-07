import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

// Antes e depois (slider logo depois do hero). Sem nenhum publicado, a
// secao fica oculta.
export const Cases: CollectionConfig = {
  slug: 'cases',
  labels: { singular: 'Antes e depois', plural: 'Antes e depois' },
  orderable: true,
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'client',
    defaultColumns: ['afterImage', 'client', 'published'],
    description: 'Casos reais, com autorização do cliente. Sem nenhum publicado, a seção some do site.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'client', type: 'text', label: 'Cliente', required: true, admin: { width: '50%' } },
        {
          name: 'summary',
          type: 'text',
          label: 'O que foi feito',
          admin: { width: '50%', description: 'Ex: Marca refeita e site novo' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'beforeImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Antes',
          required: true,
          admin: { width: '50%', description: 'O que o cliente tinha. Mesma proporção do "Depois".' },
        },
        {
          name: 'afterImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Depois',
          required: true,
          admin: { width: '50%', description: 'O projeto do Joycombo.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'beforeLabel',
          type: 'text',
          label: 'Rótulo do antes',
          defaultValue: 'Antes: feito sozinho',
          admin: { width: '50%' },
        },
        {
          name: 'afterLabel',
          type: 'text',
          label: 'Rótulo do depois',
          defaultValue: 'Depois: Joycombo',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicado',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Marque só depois da autorização do cliente.' },
    },
  ],
}
