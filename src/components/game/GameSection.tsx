'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import Screen from './Screen'

export type GameTexts = {
  pointsPerHit: number
  pointsGoal: number
  couponCode: string
  couponText: string
  couponCta: string
  couponMessage: string
}

// O codigo do jogo so e baixado quando a secao chega perto da tela
const AsteroidsGame = dynamic(() => import('./AsteroidsGame'), { ssr: false, loading: () => <Screen /> })

// Secao so com o jogo, de ponta a ponta da tela
export default function GameSection({ texts }: { texts: GameTexts }) {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          o.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    o.observe(el)
    return () => o.disconnect()
  }, [])

  return (
    <section ref={ref} id="jogo" aria-label="Jogo" className="on-dark bg-black text-white">
      {near ? <AsteroidsGame texts={texts} /> : <Screen />}
    </section>
  )
}
