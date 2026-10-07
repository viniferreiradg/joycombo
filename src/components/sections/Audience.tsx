import { ArrowRight, Human, Reload } from 'pixelarticons/react'
import type { Landing } from '@/lib/data'
import SectionHeading from '@/components/SectionHeading'

// Os dois perfis lado a lado, com o mesmo peso. Cada card abre a aba de
// planos mais adequada (o Pricing escuta o #planos-marca / #planos-site).
export default function Audience({ landing }: { landing: Landing }) {
  const icons = [Human, Reload]

  return (
    <section id="pra-quem-e" className="section on-light bg-white text-black">
      <div className="container-site">
        <SectionHeading kicker={landing.audienceKicker} title={landing.audienceTitle} intro={landing.audienceIntro} />

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {landing.audienceCards.map((card, i) => {
            const Icon = icons[i % icons.length]
            return (
              <article key={card.title} className="pixel-box flex flex-col bg-paper p-6 md:p-10" style={{ ['--p' as string]: '8px' }}>
                <span className="pixel-box mb-8 flex h-14 w-14 items-center justify-center bg-black text-accent">
                  <Icon className="h-8 w-8" aria-hidden />
                </span>
                <h3 className="title title-sm mb-4">{card.title}</h3>
                {card.text && <p className="mb-6 text-muted-light">{card.text}</p>}
                {!!card.bullets?.length && (
                  <ul className="pixel-list mb-8 space-y-2 font-semibold">
                    {card.bullets.map((b) => (
                      <li key={b.text}>{b.text}</li>
                    ))}
                  </ul>
                )}
                <a href={`#planos-${card.tab || 'marca'}`} className="btn btn-dark mt-auto self-start">
                  <span>{card.buttonLabel || 'Ver planos'}</span>
                  <ArrowRight aria-hidden />
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
