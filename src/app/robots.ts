import type { MetadataRoute } from 'next'
import { getSeo } from '@/lib/data'

const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

// Regras vem do menu SEO (aba Indexacao)
export const revalidate = 60

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo()
  return {
    rules: seo.indexable
      ? {
          userAgent: '*',
          allow: '/',
          // Painel e API ficam sempre fora da busca
          disallow: ['/admin', '/api', ...seo.blockedPaths],
        }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${serverUrl}/sitemap.xml`,
  }
}
