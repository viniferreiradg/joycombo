import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Cliente', plural: 'Clientes' },
  orderable: true,
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'name',
    defaultColumns: ['logo', 'name', 'published'],
    description: 'Faixa de logos. Só com autorização do cliente.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nome', required: true },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: { description: 'SVG ou PNG transparente, de preferência numa cor só. Sem logo, aparece o nome.' },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicado',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
