import type { Access, CollectionConfig } from 'payload'
import path from 'path'
import { logado } from '@/lib/orcamentos/access'
import { grupoManuais } from '@/lib/manuais/padroes'

// Arquivos dos manuais de marca (capa, imagens do universo visual, mockups,
// fontes), separados da Midias do site. Fora do menu (CSS em
// custom.css, como as imagens de orcamento). O arquivo e publico (a pagina do
// manual precisa dele); a lista pela API, so para quem esta logado.
const arquivoOuLogado: Access = (args) => {
  if (logado(args)) return true
  return Boolean(args.req.pathname?.includes('/manual-assets/file/'))
}

export const ManualAssets: CollectionConfig = {
  slug: 'manual-assets',
  labels: { singular: 'Arquivo de manual', plural: 'Arquivos de manual' },
  admin: {
    group: grupoManuais,
  },
  access: {
    read: arquivoOuLogado,
    create: logado,
    update: logado,
    delete: logado,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), 'public/manual-assets'),
    adminThumbnail: ({ doc }) => (String(doc.mimeType || '').startsWith('image/') ? (doc.url as string) || null : null),
    // Imagens, fontes web e o ZIP das marcas (os SVGs ficam no JSON do manual).
    mimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/gif',
      // fontes: woff2, woff, ttf e otf (fontes que nao sao do Google, ex.: Bogue)
      'font/woff2',
      'font/woff',
      'font/ttf',
      'font/otf',
      'font/sfnt',
      'application/font-woff',
      'application/font-woff2',
      'application/x-font-ttf',
      'application/x-font-otf',
      'application/vnd.ms-opentype',
      // pacote com todas as marcas (o Windows manda x-zip-compressed)
      'application/zip',
      'application/x-zip-compressed',
    ],
  },
  fields: [{ name: 'alt', type: 'text', label: 'Texto alternativo' }],
}
