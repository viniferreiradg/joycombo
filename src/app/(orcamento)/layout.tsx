import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import '../globals.css'

// Layout proprio dos orcamentos: mesmas fontes e cores do site, sem pixels de
// anuncio, aviso de cookies ou preview do admin. Nunca indexado.

// Sora local (mesmos arquivos do PDF): o build nao depende de baixar do
// Google Fonts, que falhou no build da Hostinger
const sora = localFont({
  src: [
    { path: '../../fonts/pdf/Sora-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/pdf/Sora-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../fonts/pdf/Sora-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sora',
  display: 'swap',
})

const joycomboTitle = localFont({
  src: '../../fonts/joycombo-sora-bold.woff2',
  variable: '--font-joycombo-title',
  weight: '700',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'Orçamento · Joycombo',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: {
    icon: [
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
}

export default function OrcamentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${joycomboTitle.variable}`}>
      <body>
        {/* O body do site e preto com texto branco (globals.css, fora das
            camadas do Tailwind, entao vence as classes); o orcamento e claro */}
        <div className="min-h-svh bg-white text-black">{children}</div>
      </body>
    </html>
  )
}
