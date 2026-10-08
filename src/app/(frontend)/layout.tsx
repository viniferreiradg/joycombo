import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import localFont from 'next/font/local'
import { getLanding, getSettings } from '@/lib/data'
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const ogImage = settings.ogImage?.url
    ? { url: settings.ogImage.url, width: settings.ogImage.width || 1200, height: settings.ogImage.height || 630 }
    : { url: '/og-joycombo.png', width: 1200, height: 630 }

  return {
    metadataBase: new URL(serverUrl),
    title: settings.siteTitle,
    description: settings.siteDescription,
    alternates: { canonical: '/' },
    icons: {
      icon: [
        { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
        { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/favicon/favicon.ico',
      apple: '/favicon/apple-touch-icon.png',
    },
    manifest: '/favicon/site.webmanifest',
    ...(settings.googleSiteVerification && {
      verification: { google: settings.googleSiteVerification },
    }),
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteDescription,
      url: serverUrl,
      siteName: 'Joycombo',
      locale: 'pt_BR',
      type: 'website',
      images: [{ ...ogImage, alt: 'Joycombo' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.siteTitle,
      description: settings.siteDescription,
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
