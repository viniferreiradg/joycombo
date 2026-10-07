import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

// Portfolio da home: identidade visual e sites, so com autorizacao do cliente.
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Projeto', plural: 'Projetos' },
  orderable: true,
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'title',
    defaultColumns: ['coverImage', 'title', 'categories', 'published'],
    description: 'Só publique projetos com autorização do cliente.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', label: 'Cliente / projeto', required: true, admin: { width: '50%' } },
        {
          name: 'summary',
          type: 'text',
          label: 'O que foi feito',
          admin: { width: '50%', description: 'Ex: Identidade visual e site institucional' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'coverImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Capa',
          required: true,
          admin: { width: '50%', description: 'Imagem ou vídeo .mp4. Proporção 4:3.' },
        },
        {
          name: 'hoverImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Imagem ao passar o mouse (opcional)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'partner',
      type: 'text',
      label: 'Desenvolvido em parceria com (opcional)',
      admin: { description: 'Ex: Bradda, Plathanus.' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Link (opcional)',
      admin: { description: 'Site no ar ou case no Behance.' },
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      label: 'Categorias',
      options: [
        { label: 'Marca', value: 'marca' },
        { label: 'Site', value: 'site' },
        { label: 'Instagram', value: 'insta' },
      ],
      admin: { position: 'sidebar' },
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
