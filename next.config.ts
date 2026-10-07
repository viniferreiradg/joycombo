import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'

const nextConfig: NextConfig = {
  // Importa so os icones usados, e nao o pacote inteiro (2 mil arquivos)
  experimental: {
    optimizePackageImports: ['pixelarticons'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@payload-config': path.resolve(process.cwd(), 'payload.config.ts'),
    }
    return config
  },
}

export default withPayload(nextConfig)
