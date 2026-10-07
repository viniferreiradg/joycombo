import type { MetadataRoute } from 'next'

const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${serverUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${serverUrl}/politica-de-privacidade`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
