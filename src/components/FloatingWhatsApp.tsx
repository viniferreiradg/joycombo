'use client'

import { useEffect, useState } from 'react'
import { Whatsapp } from 'pixelarticons/react'
import WhatsAppLink from '@/components/WhatsAppLink'

// Botao fixo de WhatsApp. Aparece depois do topo (que ja tem o proprio
// botao) e some enquanto o jogo esta na tela, para um clique de tiro nunca
// virar um clique no WhatsApp.
export default function FloatingWhatsApp({ message }: { message: string }) {
  const [pastHero, setPastHero] = useState(false)
  const [overGame, setOverGame] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('topo')
    const game = document.getElementById('jogo')
    const observers: IntersectionObserver[] = []

    if (hero) {
      const o = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { rootMargin: '-30% 0px 0px 0px' })
      o.observe(hero)
      observers.push(o)
    }
    if (game) {
      const o = new IntersectionObserver(([e]) => setOverGame(e.isIntersecting))
      o.observe(game)
      observers.push(o)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const visible = pastHero && !overGame

  return (
    <div
      inert={!visible}
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 md:bottom-6 md:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      {/* Moldura preta: o botao continua visivel sobre as secoes verdes */}
      <div className="pixel-box bg-black p-[3px]">
        <WhatsAppLink
          message={message}
          origin="flutuante"
          aria-label="Conversar no WhatsApp"
          className="btn btn-accent h-14 min-h-14 w-14 p-0 md:h-auto md:w-auto md:px-6"
        >
          <Whatsapp aria-hidden className="!h-7 !w-7" />
          <span className="hidden md:inline">Chamar no WhatsApp</span>
        </WhatsAppLink>
      </div>
    </div>
  )
}
