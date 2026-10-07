import Link from 'next/link'
import { Instagram, Mail, Whatsapp } from 'pixelarticons/react'
import { Logo } from '@/components/Brand'
import WhatsAppLink from '@/components/WhatsAppLink'
import { CookieSettingsButton } from '@/components/tracking/CookieConsent'
import type { Settings } from '@/lib/data'

type Props = { settings: Settings; tagline: string; whatsMessage: string; showCookies: boolean }

export default function Footer({ settings, tagline, whatsMessage, showCookies }: Props) {
  const linkClass = 'inline-flex items-center gap-2 text-white/80 hover:text-white'
  const phone = settings.whatsapp.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')

  return (
    <footer className="on-dark border-t border-line-dark bg-black py-14 text-white md:py-20">
      <div className="container-site">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo className="mb-5 h-6 w-auto text-white md:h-7" />
            <p className="text-muted-dark">{tagline}</p>
          </div>

          <ul className="space-y-3 text-sm font-semibold">
            <li>
              <WhatsAppLink message={whatsMessage} origin="rodape" className={linkClass}>
                <Whatsapp className="h-5 w-5 text-accent" aria-hidden />
                {phone}
              </WhatsAppLink>
            </li>
            {settings.instagram && (
              <li>
                <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <Instagram className="h-5 w-5 text-accent" aria-hidden />@{settings.instagram}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className={linkClass}>
                  <Mail className="h-5 w-5 text-accent" aria-hidden />
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line-dark pt-6 text-xs text-muted-dark md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Joycombo
            {settings.cnpj && <> · CNPJ {settings.cnpj}</>}
          </p>
          <div className="flex gap-5">
            <Link href="/politica-de-privacidade" className="hover:text-white">
              Política de Privacidade
            </Link>
            {showCookies && <CookieSettingsButton className="hover:text-white" />}
          </div>
        </div>
      </div>
    </footer>
  )
}
