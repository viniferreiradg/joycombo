import type { MetadataRoute } from 'next'

const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Painel e API ficam fora da busca
      disallow: ['/admin', '/api'],
    },
    sitemap: `${serverUrl}/sitemap.xml`,
  }
}
