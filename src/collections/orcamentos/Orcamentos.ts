import type { CollectionConfig, Field } from 'payload'
import { grupoOrcamentos, logado, soLogado } from '@/lib/orcamentos/access'
import { expirou } from '@/lib/orcamentos/datas'
import {
  calcularOrcamento,
  copiarValores,
  copiaParaDuplicar,
  padraoCases,
  padraoFotoPdf,
  padraoParcelamento,
  padraoPropostas,
} from '@/lib/orcamentos/padroes'

const ligado = (label: string, name: string, description?: string): Field => ({
  name,
  type: 'checkbox',
  label,
  defaultValue: true,
  admin: { description },
})

// Orcamentos: cada um gera um link (/orcamento/<token>) com landing e PDF.
// Orcamento novo ja vem com todas as secoes ligadas, todos os cases e todas
// as propostas (com o investimento copiado para o Valor).
export const Orcamentos: CollectionConfig = {
  slug: 'orcamentos',
  labels: { singular: 'Orçamento', plural: 'Orçamentos' },
  disableDuplicate: true,
  admin: {
    group: grupoOrcamentos,
    useAsTitle: 'cliente',
    defaultColumns: ['cliente', 'tituloCapa', 'data', 'status', 'expirado'],
    listSearchableFields: ['cliente', 'tituloCapa'],
    description: 'Cada orçamento gera um link para o cliente. Rascunho não abre para o cliente.',
    preview: (doc) => (doc?.token ? `/orcamento/${doc.token}` : null),
  },
  access: soLogado,
  hooks: {
    beforeValidate: [copiarValores],
    beforeChange: [calcularOrcamento],
  },
  endpoints: [
    {
      // "Duplicar orcamento": copia tudo, link novo, rascunho, data de hoje
      path: '/:id/duplicar',
      method: 'post',
      handler: async (req) => {
        if (!logado({ req })) return Response.json({ error: 'Não autorizado' }, { status: 401 })
        const original = await req.payload
          .findByID({ collection: 'orcamentos', id: String(req.routeParams?.id || ''), depth: 0, req })
          .catch(() => null)
        if (!original) return Response.json({ error: 'Orçamento não encontrado' }, { status: 404 })
        const copia = await req.payload.create({
          collection: 'orcamentos',
          data: {
            ...copiaParaDuplicar(original as unknown as Record<string, unknown>),
            status: 'rascunho',
            data: new Date().toISOString(),
          } as never,
          req,
        })
        return Response.json({ id: copia.id })
      },
    },
  ],
  fields: [
    // ------------------------------------------------------------ lateral
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'rascunho',
      options: [
        { label: 'Rascunho', value: 'rascunho' },
        { label: 'Enviado', value: 'enviado' },
      ],
      admin: { position: 'sidebar', description: 'Rascunho não abre para o cliente (só para você, logado).' },
    },
    {
      name: 'linkPublico',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/orcamentos/admin/LinkPublico' } },
    },
    {
      name: 'duplicar',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/orcamentos/admin/Duplicar' } },
    },
    { name: 'token', type: 'text', unique: true, index: true, admin: { hidden: true } },
    { name: 'dataExpiracao', type: 'date', index: true, admin: { hidden: true } },
    {
      name: 'expirado',
      type: 'checkbox',
      label: 'Expirado',
      virtual: true,
      admin: { position: 'sidebar', readOnly: true, components: { Cell: '@/components/orcamentos/admin/ExpiradoCell' } },
      hooks: { afterRead: [({ siblingData }) => expirou(siblingData?.dataExpiracao as string | undefined)] },
    },

    {
      type: 'tabs',
      tabs: [
        // ---------------------------------------------------------- geral
        {
          label: 'Geral',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'cliente', type: 'text', label: 'Cliente', required: true, admin: { width: '50%' } },
                {
                  name: 'tituloCapa',
                  type: 'text',
                  label: 'Título da capa',
                  defaultValue: 'Orçamento completo',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'data',
                  type: 'date',
                  label: 'Data',
                  required: true,
                  defaultValue: () => new Date().toISOString(),
                  admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                },
                {
                  name: 'validadeDias',
                  type: 'number',
                  label: 'Validade (dias)',
                  required: true,
                  min: 1,
                  defaultValue: 15,
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },

        // ---------------------------------------------------------- secoes
        {
          label: 'Seções',
          description: 'Tudo já vem ligado. Desligada, a seção some da página e do PDF.',
          fields: [
            ligado('Capa', 'mostrarCapa'),

            ligado('Sobre', 'mostrarSobre'),
            {
              type: 'collapsible',
              label: 'Sobre',
              admin: { condition: (data) => data?.mostrarSobre !== false },
              fields: [
                { name: 'sobreTitulo', type: 'text', label: 'Título', defaultValue: 'Quem faz' },
                {
                  name: 'sobreTextoOrigem',
                  type: 'radio',
                  label: 'Texto',
                  defaultValue: 'site',
                  options: [
                    { label: 'Usar o texto do site (Landing page > Quem faz > Bio)', value: 'site' },
                    { label: 'Escrever um novo', value: 'novo' },
                  ],
                },
                {
                  name: 'sobreTexto',
                  type: 'textarea',
                  label: 'Texto novo',
                  admin: {
                    condition: (_, s) => s?.sobreTextoOrigem === 'novo',
                    description: 'Linha em branco separa parágrafos.',
                  },
                },
                {
                  name: 'sobreCards',
                  type: 'checkbox',
                  label: 'Usar os cards do site (os Números de Landing page > Quem faz)',
                  defaultValue: true,
                },
                {
                  name: 'sobreFotoPdf',
                  type: 'upload',
                  relationTo: 'orcamento-midias',
                  label: 'Foto para o PDF',
                  defaultValue: padraoFotoPdf,
                  admin: { description: 'A página usa a foto ou o vídeo do site; o PDF precisa de uma imagem fixa.' },
                },
              ],
            },

            {
              name: 'cases',
              type: 'relationship',
              relationTo: 'orcamento-cases',
              hasMany: true,
              label: 'Cases',
              defaultValue: padraoCases,
              admin: { isSortable: true, description: 'Arraste para ordenar. Vazio = a seção não aparece.' },
            },

            {
              name: 'propostas',
              type: 'array',
              label: 'Propostas',
              labels: { singular: 'Proposta', plural: 'Propostas' },
              defaultValue: padraoPropostas,
              admin: {
                components: { RowLabel: '@/components/orcamentos/admin/PropostaRowLabel' },
                description:
                  'Arraste para ordenar (#1, #2...). Ao escolher uma proposta, o Valor vem do investimento dela; mudar aqui vale só para este orçamento. Vazio = a seção não aparece.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'proposta',
                      type: 'relationship',
                      relationTo: 'propostas',
                      label: 'Proposta',
                      required: true,
                      admin: { width: '60%' },
                    },
                    {
                      name: 'valor',
                      type: 'number',
                      label: 'Valor (R$)',
                      min: 0,
                      admin: { width: '40%', step: 0.01, components: { Field: '@/components/orcamentos/admin/ValorProposta' } },
                    },
                  ],
                },
              ],
            },

            ligado('Parcelamento', 'mostrarParcelamento'),
            {
              name: 'parcelamento',
              type: 'textarea',
              label: 'Texto do parcelamento',
              defaultValue: padraoParcelamento,
              admin: {
                condition: (data) => data?.mostrarParcelamento !== false,
                description: 'Vem preenchido com o texto de Landing page > Planos > Formas de pagamento. Cada linha vira uma opção (#1, #2...).',
              },
            },

            ligado('Outras informações', 'mostrarOutrasInfo', 'Os itens ficam em Orçamentos > Configurações de orçamento.'),
            ligado('Contra capa', 'mostrarContraCapa'),
          ],
        },
      ],
    },
  ],
}

