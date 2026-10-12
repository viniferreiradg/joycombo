import type { CollectionConfig } from 'payload'
import { grupoOrcamentos, rowLabel, soLogado } from '@/lib/orcamentos/access'
import { ICONES_ENTREGA, prazoTotal, TEXTO_SPRINTS_PADRAO, type Sprint } from '@/lib/orcamentos/propostas'

// Biblioteca de propostas: cadastradas uma vez e copiadas para os orcamentos.
// O investimento e um numero proprio: "Puxar preco do site" so copia o valor
// (mudar o preco no site depois nao muda a proposta).
export const Propostas: CollectionConfig = {
  slug: 'propostas',
  labels: { singular: 'Proposta', plural: 'Propostas' },
  orderable: true,
  admin: {
    group: grupoOrcamentos,
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'subtitulo', 'investimento', 'prazoTotal'],
    description: 'Arraste para ordenar: é a ordem (#1, #2...) em que entram nos orçamentos novos.',
  },
  access: soLogado,
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.prazoTotal = prazoTotal(data.sprints as Sprint[])
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'nome', type: 'text', label: 'Nome', required: true, admin: { width: '50%', placeholder: 'Sistema / Aplicativo' } },
        { name: 'subtitulo', type: 'text', label: 'Subtítulo', admin: { width: '50%', placeholder: 'Experiência do Usuário' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'investimento',
          type: 'number',
          label: 'Investimento (R$)',
          min: 0,
          admin: { width: '33%', step: 0.01 },
        },
        {
          name: 'puxarPreco',
          type: 'ui',
          admin: { width: '33%', components: { Field: '@/components/orcamentos/admin/PuxarPreco' } },
        },
        {
          name: 'prazoTotal',
          type: 'number',
          label: 'Prazo total (dias)',
          admin: {
            width: '33%',
            readOnly: true,
            description: 'Soma dos dias de todos os itens.',
            components: { Field: '@/components/orcamentos/admin/PrazoTotal' },
          },
        },
      ],
    },
    {
      name: 'sprints',
      type: 'array',
      label: 'Sprints',
      labels: { singular: 'Sprint', plural: 'Sprints' },
      admin: { ...rowLabel, description: 'Numerados pela ordem (01, 02...). Arraste para reordenar.' },
      fields: [
        { name: 'nome', type: 'text', label: 'Nome', required: true, admin: { placeholder: 'Descoberta' } },
        { name: 'descricao', type: 'textarea', label: 'Descrição' },
        {
          name: 'itens',
          type: 'array',
          label: 'Itens',
          labels: { singular: 'Item', plural: 'Itens' },
          admin: rowLabel,
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'nome', type: 'text', label: 'Nome', required: true, admin: { width: '75%' } },
                { name: 'dias', type: 'number', label: 'Dias', min: 0, admin: { width: '25%' } },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'entregaIcone',
              type: 'select',
              label: 'Entrega: ícone',
              options: ICONES_ENTREGA,
              defaultValue: 'documento',
              admin: { width: '33%' },
            },
            { name: 'entregaTexto', type: 'textarea', label: 'Entrega: texto', admin: { width: '66%' } },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Escopo da proposta',
      fields: [
        { name: 'escopo1', type: 'textarea', label: 'Texto 1' },
        { name: 'escopo2', type: 'textarea', label: 'Texto 2 (em negrito)' },
        {
          name: 'escopo3',
          type: 'textarea',
          label: 'Texto 3: "Como funcionam os sprints?"',
          defaultValue: TEXTO_SPRINTS_PADRAO,
        },
      ],
    },
  ],
}
