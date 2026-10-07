import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { pt } from '@payloadcms/translations/languages/pt'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './src/collections/Users'
import { Media } from './src/collections/Media'
import { Services } from './src/collections/Services'
import { Plans } from './src/collections/Plans'
import { Projects } from './src/collections/Projects'
import { Cases } from './src/collections/Cases'
import { Clients } from './src/collections/Clients'
import { Testimonials } from './src/collections/Testimonials'
import { Faqs } from './src/collections/Faqs'
import { Leads } from './src/collections/Leads'
import { Landing } from './src/globals/Landing'
import { SiteSettings } from './src/globals/SiteSettings'
import { Privacy } from './src/globals/Privacy'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Producao usa Postgres (igual ao portfolio). Sem DATABASE_URI de Postgres,
// cai num arquivo SQLite local, para rodar o projeto sem instalar banco.
const databaseUri = process.env.DATABASE_URI || ''
const db = databaseUri.startsWith('postgres')
  ? postgresAdapter({ pool: { connectionString: databaseUri } })
  : sqliteAdapter({ client: { url: databaseUri || 'file:./joycombo.db' } })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '· Joycombo',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon/favicon.svg' }],
    },
    // Site ao lado do formulario, recarregado a cada "Salvar"
    livePreview: {
      globals: ['landing'],
      url: () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      breakpoints: [
        { label: 'Celular', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 834, height: 1112 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
    components: {
      graphics: {
        Logo: '@/components/admin/AdminLogo#AdminLogo',
        Icon: '@/components/admin/AdminLogo#AdminIcon',
      },
    },
  },
  i18n: {
    supportedLanguages: { pt },
    fallbackLanguage: 'pt',
  },
  // A ordem aqui define a ordem dos grupos no menu do admin
  collections: [Plans, Services, Projects, Cases, Clients, Testimonials, Faqs, Leads, Media, Users],
  globals: [Landing, SiteSettings, Privacy],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'joycombo-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db,
  sharp,
  plugins: [
    // Na Vercel o disco e so leitura: imagens e videos do painel vao para o
    // Vercel Blob. Sem o token (no computador), continua salvando em public/media.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Arquivos servidos direto pela CDN do Blob (mais rapido para os videos)
      collections: { media: { disablePayloadAccessControl: true, prefix: 'media' } },
      // Envio direto do navegador para o Blob: a Vercel limita o corpo das
      // requisicoes a 4,5 MB, pouco para os videos do topo
      clientUploads: true,
      // Mesma estrutura de banco com ou sem o Blob ligado
      alwaysInsertFields: true,
    }),
  ],
})
