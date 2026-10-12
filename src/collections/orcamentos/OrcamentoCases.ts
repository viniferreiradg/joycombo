import type { CollectionConfig } from 'payload'
import { grupoOrcamentos, soLogado } from '@/lib/orcamentos/access'

// Cases dos orcamentos (separados do portfolio e do "Antes e depois" do site)
export const OrcamentoCases: CollectionConfig = {
  slug: 'orcamento-cases',
  labels: { singular: 'Case', plural: 'Cases' },
  orderable: true,
  admin: {
    group: grupoOrcamentos,
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'subtitulo'],
    description: 'Arraste para ordenar: é a ordem em que entram nos orçamentos novos.',
  },
  access: soLogado,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'nome', type: 'text', label: 'Nome', required: true, admin: { width: '50%', placeholder: 'Facility' } },
        {
          name: 'subtitulo',
          type: 'text',
          label: 'Subtítulo',
          admin: { width: '50%', placeholder: 'Desenvolvido em parceria com Bradda Design' },
        },
      ],
    },
    { name: 'texto', type: 'textarea', label: 'Texto', admin: { description: 'Linha em branco separa parágrafos.' } },
    { name: 'link', type: 'text', label: 'Link do case completo', admin: { placeholder: 'https://' } },
    {
      name: 'imagens',
      type: 'upload',
      relationTo: 'orcamento-midias',
      hasMany: true,
      label: 'Imagens',
      admin: {
        description:
          'Arraste para ordenar. Em "Escolher entre os existentes", as imagens que já estão aqui não aparecem na lista.',
      },
    },
  ],
}
