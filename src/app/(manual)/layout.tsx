import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './manual.css'

// Layout proprio dos manuais de marca: so a Sora (sem a Joycombo pixelada,
// para a marca do cliente prevalecer), sem o CSS do site, pixels ou aviso de
// cookies. Nunca indexado.
const sora = localFont({
  src: [
    { path: '../../fonts/pdf/Sora-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/pdf/Sora-SemiBold.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-sora',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  // links da imagem de compartilhamento (WhatsApp etc.) precisam ser absolutos
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: 'Manual de Marca · Joycombo',
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

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={sora.variable}>
      <body className="mn-body">{children}</body>
    </html>
  )
}
