import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

// Portfolio da home (formato do portfolio do Vini): grade de capas quadradas
// com abas Sites e Marcas. Por enquanto sem pagina de detalhe do case: so
// capa, titulo e descricao. So com autorizacao do cliente.
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Projeto', plural: 'Projetos' },
  orderable: true,
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'title',
    defaultColumns: ['coverImage', 'title', 'categories', 'published'],
    description: 'Trabalhos da seção Portfólio. Arraste para mudar a ordem. Só publique com autorização do cliente.',
  },
  hooks: revalidateHooks,
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', label: 'Título', required: true, admin: { width: '50%', description: 'Nome do cliente ou do projeto.' } },
        {
          name: 'summary',
          type: 'text',
          label: 'Descrição',
          admin: { width: '50%', description: 'Uma linha. Ex: Identidade visual e site institucional.' },
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
          admin: { width: '50%', description: 'Quadrada (1:1), de preferência 1200x1200px. Imagem ou vídeo .mp4.' },
        },
        // Fora do formato atual (sem página de case); guardado para quando voltar
        {
          name: 'hoverImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Imagem ao passar o mouse (opcional)',
          admin: { width: '50%', hidden: true },
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
      admin: { description: 'Site no ar ou case no Behance.', hidden: true },
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
      admin: { position: 'sidebar', description: 'Site e Marca viram as abas do portfólio. Um projeto pode estar nas duas.' },
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
