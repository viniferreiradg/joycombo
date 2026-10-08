import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import localFont from 'next/font/local'
import { getLanding, getSeo, getSettings } from '@/lib/data'
import { SiteProvider } from '@/components/SiteContext'
import TrackingScripts from '@/components/tracking/TrackingScripts'
import CookieConsent from '@/components/tracking/CookieConsent'
import LivePreviewListener from '@/components/LivePreviewListener'
import RevealObserver from '@/components/RevealObserver'
import '../globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '600', '700'],
})

// Joycombo Sora Bold (titulos): Sora Bold com N, E, V, A e M redesenhadas
// em pixel, direto no arquivo (sem stylistic set). Usada pelo token
// --font-title. Fonte original em /font (.ttf), convertida para woff2.
const joycomboTitle = localFont({
  src: '../../fonts/joycombo-sora-bold.woff2',
  variable: '--font-joycombo-title',
  weight: '700',
  display: 'swap',
})

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const viewport: Viewport = {
  themeColor: '#000000',
}

// Tudo vem do menu SEO do admin (com padroes no codigo)
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo()
  // Imagem do menu SEO servida em JPG pela rota /og-image.jpg. O ?v= muda
  // quando a imagem é trocada, para o WhatsApp não usar o preview antigo
  const ogImage = seo.ogImage?.url
    ? { url: `/og-image.jpg?v=${seo.ogImage.id}`, width: 1200, height: 630, type: 'image/jpeg' }
    : { url: '/og-joycombo.png', width: 1200, height: 630, type: 'image/png' }

  // Tags extras: mesmo name repetido vira varias meta tags
  const other: Record<string, string[]> = {}
  for (const t of seo.metaTags) (other[t.name] ||= []).push(t.content)
  if (seo.bingVerification) (other['msvalidate.01'] ||= []).push(seo.bingVerification)

  return {
    metadataBase: new URL(serverUrl),
    title: seo.title,
    description: seo.description,
    ...(seo.keywords.length && { keywords: seo.keywords }),
    alternates: { canonical: '/' },
    robots: seo.indexable ? { index: true, follow: true } : { index: false, follow: false },
    icons: {
      icon: [
        { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
        { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/favicon/favicon.ico',
      apple: '/favicon/apple-touch-icon.png',
    },
    manifest: '/favicon/site.webmanifest',
    ...(seo.googleVerification && { verification: { google: seo.googleVerification } }),
    ...(Object.keys(other).length && { other }),
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: serverUrl,
      siteName: seo.businessName,
      locale: 'pt_BR',
      type: 'website',
      images: [{ ...ogImage, alt: seo.businessName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [ogImage.url],
    },
  }
}

// Escolhe a versao da tabela de precos antes da pagina aparecer (sem
// "piscar"): "a" = preco aberto, "b" = "a partir de". No teste A/B, sorteia
// uma vez e guarda, para o visitante ver sempre a mesma versao. Tambem liga o
// efeito de "ir aparecendo" (data-reveal-on), menos com animacoes desligadas.
const priceVariantScript = `(function(){var h=document.documentElement,m=h.getAttribute('data-preco-modo'),v;if(m==='teste-ab'){try{v=localStorage.getItem('jc-preco')}catch(e){}if(v!=='a'&&v!=='b'){v=Math.random()<.5?'a':'b';try{localStorage.setItem('jc-preco',v)}catch(e){}}}else{v=m==='a-partir'?'b':'a'}h.setAttribute('data-preco',v);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)h.setAttribute('data-reveal-on','')})()`

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [settings, landing] = await Promise.all([getSettings(), getLanding()])
  const hasTracking = Boolean(settings.tracking.metaPixelId || settings.tracking.ga4Id || settings.tracking.googleAdsId)

  return (
    <html lang="pt-BR" className={`${sora.variable} ${joycomboTitle.variable}`} data-preco-modo={landing.priceDisplay} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: priceVariantScript }} />
      </head>
      <body>
        <SiteProvider value={{ whatsapp: settings.whatsapp }}>{children}</SiteProvider>
        <LivePreviewListener />
        <RevealObserver />
        {/* Guarda a origem (UTM) sempre; os pixels so carregam com ID no admin e cookies aceitos */}
        <TrackingScripts config={settings.tracking} />
        {hasTracking && <CookieConsent />}
      </body>
    </html>
  )
}
