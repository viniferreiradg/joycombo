import type { GlobalConfig } from 'payload'
import { grupoOrcamentos, logado, rowLabel } from '@/lib/orcamentos/access'

// Configuracoes de orcamento: o que vale para todos os orcamentos e nao existe
// no site (Outras informacoes) e a foto padrao do Sobre no PDF.
export const OrcamentoConfig: GlobalConfig = {
  slug: 'orcamento-config',
  label: 'Configurações de orçamento',
  admin: {
    group: grupoOrcamentos,
  },
  access: { read: logado, update: logado },
  fields: [
    {
      name: 'outrasInformacoes',
      type: 'array',
      label: 'Outras informações',
      labels: { singular: 'Item', plural: 'Itens' },
      admin: {
        ...rowLabel,
        description:
          'Aparecem em todos os orçamentos com a seção ligada. Use {validade} para os dias de validade do orçamento. Linhas abaixo da primeira viram uma sublista.',
      },
      fields: [{ name: 'texto', type: 'textarea', label: 'Texto', required: true }],
    },
    {
      name: 'fotoSobrePdf',
      type: 'upload',
      relationTo: 'orcamento-midias',
      label: 'Foto do Sobre para o PDF',
      admin: {
        description: 'O Sobre da página usa a foto ou o vídeo do site; o PDF precisa de uma imagem fixa (JPG ou PNG). Cada orçamento novo já vem com esta.',
      },
    },
  ],
}
