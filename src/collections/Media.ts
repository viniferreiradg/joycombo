import type { CollectionConfig } from 'payload'
import path from 'path'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Mídia', plural: 'Mídias' },
  admin: {
    group: 'Sistema',
  },
  access: {
    read: () => true,
  },
  upload: {
    // Relativo a pasta do projeto em execucao, e nao a import.meta.url: o
    // webpack grava no build o caminho absoluto de onde compilou, e a
    // Hostinger compila numa pasta temporaria e depois move o resultado
    staticDir: path.resolve(process.cwd(), 'public/media'),
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
    ],
    // Miniatura do painel direto do Blob: com disablePayloadAccessControl a
    // rota /api/media/file/... não existe e o painel mostrava só o ícone.
    // Vídeos não têm miniatura (fica o ícone).
    adminThumbnail: ({ doc }) => {
      if (!String(doc.mimeType || '').startsWith('image/')) return null
      const sizes = doc.sizes as { thumbnail?: { url?: string | null } } | undefined
      return sizes?.thumbnail?.url || (doc.url as string) || null
    },
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    // Sem conversão de formato: no admin o arquivo vai direto do navegador para
    // o Vercel Blob (clientUploads), então o registro precisa ter o mesmo nome
    // e extensão do arquivo enviado. Convertendo para WebP, o registro apontava
    // para um .webp que nunca existiu (imagem quebrada). O site já otimiza as
    // imagens na entrega (next/image).
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      admin: {
        description: 'Descreve a imagem para leitores de tela e buscadores.',
      },
    },
  ],
}
