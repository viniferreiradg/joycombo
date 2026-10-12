import type { Access, CollectionConfig } from 'payload'
import path from 'path'
import { grupoOrcamentos, logado } from '@/lib/orcamentos/access'

// Imagens do modulo de orcamentos (cases e foto do PDF), separadas da Midias
// do site. Fica fora do menu (escondida por CSS em custom.css, e nao por
// admin.hidden, que bloquearia o "Criar novo" dentro dos campos de imagem).
//
// O arquivo em si e publico (a pagina e o PDF do orcamento precisam dele);
// a lista e a busca pela API, so para quem esta logado. Com o Vercel Blob
// os arquivos saem direto da CDN; sem ele, pela rota /api/orcamento-midias/file/.
const arquivoOuLogado: Access = (args) => {
  if (logado(args)) return true
  return Boolean(args.req.pathname?.includes('/orcamento-midias/file/'))
}

export const OrcamentoMidias: CollectionConfig = {
  slug: 'orcamento-midias',
  labels: { singular: 'Imagem de orçamento', plural: 'Imagens de orçamento' },
  admin: {
    group: grupoOrcamentos,
  },
  access: {
    read: arquivoOuLogado,
    create: logado,
    update: logado,
    delete: logado,
  },
  upload: {
    // Mesma regra da Midias do site: pasta relativa ao projeto em execucao
    // e sem conversao de formato (upload direto do navegador para o Blob)
    staticDir: path.resolve(process.cwd(), 'public/orcamento-midias'),
    adminThumbnail: ({ doc }) => (String(doc.mimeType || '').startsWith('image/') ? (doc.url as string) || null : null),
    mimeTypes: ['image/*'],
  },
  fields: [{ name: 'alt', type: 'text', label: 'Texto alternativo' }],
}
