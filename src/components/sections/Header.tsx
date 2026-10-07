'use client'

import { useEffect, useState } from 'react'
import { Whatsapp } from 'pixelarticons/react'
import { Logo } from '@/components/Brand'
import WhatsAppLink from '@/components/WhatsAppLink'

// Header fino: transparente sobre o video do topo, preto depois que rola.
export default function Header({ message }: { message: string }) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`on-dark fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'bg-black/95 backdrop-blur' : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <a href="#topo" aria-label="Joycombo, voltar ao topo" className="text-white">
          <Logo className="h-4 w-auto md:h-5" />
        </a>
        <nav className="flex items-center gap-2 md:gap-6">
          <a href="#planos" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline">
            Planos
          </a>
          <a href="#portfolio" className="hidden text-sm font-semibold text-white/80 hover:text-white md:inline">
            Portfólio
          </a>
          <a href="#faq" className="hidden text-sm font-semibold text-white/80 hover:text-white md:inline">
            Dúvidas
          </a>
          <WhatsAppLink message={message} origin="header" className="btn btn-accent btn-sm">
            <Whatsapp aria-hidden />
            <span className="max-[359px]:sr-only">WhatsApp</span>
          </WhatsAppLink>
        </nav>
      </div>
    </header>
  )
}
