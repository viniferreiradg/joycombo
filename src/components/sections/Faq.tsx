import { Plus } from 'pixelarticons/react'
import { paragraphs } from '@/lib/format'
import type { FaqDoc } from '@/lib/data'

// <details> nativo: abre e fecha sem JavaScript e funciona no teclado.
// A animacao de abrir fica no CSS (.faq em globals.css)
export default function Faq({ kicker, title, items }: { kicker: string; title: string; items: FaqDoc[] }) {
  if (!items.length) return null

  return (
    <section id="faq" className="section on-light bg-paper text-black">
      <div className="container-site grid gap-10 md:grid-cols-[4fr_8fr] md:gap-16">
        <div data-reveal-stagger className="flex flex-col gap-4">
          <span className="kicker self-start">{kicker}</span>
          <h2 className="title title-sm md:sticky md:top-24">{title}</h2>
        </div>

        <div data-reveal-stagger className="space-y-3">
          {items.map((f) => (
            <details key={f.id} className="faq group pixel-box bg-white" style={{ ['--p' as string]: '6px' }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-bold md:p-6 [&::-webkit-details-marker]:hidden">
                <span>{f.question}</span>
                <span className="pixel-box flex h-9 w-9 shrink-0 items-center justify-center bg-accent transition-transform duration-300 group-open:rotate-45" style={{ ['--p' as string]: '3px' }}>
                  <Plus className="h-5 w-5" aria-hidden />
                </span>
              </summary>
              <div className="faq-answer space-y-3 px-5 pb-6 text-muted-light md:px-6">
                {paragraphs(f.answer).map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
