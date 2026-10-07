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
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    formatOptions: {
      format: 'webp',
      options: { quality: 90 },
    },
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
