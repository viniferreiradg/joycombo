import type { MetadataRoute } from 'next'
import { getSeo } from '@/lib/data'

const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

export const revalidate = 60

// Paginas escondidas do Google no menu SEO saem do sitemap tambem
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeo()
  const pages: MetadataRoute.Sitemap = [
    { url: `${serverUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${serverUrl}/politica-de-privacidade`, changeFrequency: 'yearly', priority: 0.2 },
  ]
  if (!seo.indexable) return []
  return pages.filter((p) => !seo.blockedPaths.some((b) => new URL(p.url).pathname.startsWith(b)))
}
