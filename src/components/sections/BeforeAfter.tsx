'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronsHorizontal } from 'pixelarticons/react'
import type { CaseDoc } from '@/lib/data'
import SectionHeading from '@/components/SectionHeading'

type Props = { kicker: string; title: string; intro?: string; cases: CaseDoc[] }

// Slider antes/depois. Um <input type="range"> invisivel cobre a imagem:
// arrastar com mouse ou dedo e as setas do teclado funcionam de graca.
export default function BeforeAfter({ kicker, title, intro, cases }: Props) {
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState(50)
  const item = cases[active]
  if (!item?.beforeImage?.url || !item.afterImage?.url) return null

  const ratio = (item.afterImage.width || 16) / (item.afterImage.height || 10)

  return (
    <section id="antes-e-depois" className="on-dark section bg-black text-white">
      <div className="container-site">
        <SectionHeading kicker={kicker} title={title} intro={intro} tone="dark" />

        {cases.length > 1 && (
          <div role="tablist" aria-label="Casos" className="mb-6 flex flex-wrap gap-2">
            {cases.map((c, i) => (
              <button
                key={c.id}
                role="tab"
                type="button"
                aria-selected={i === active}
                onClick={() => {
                  setActive(i)
                  setPos(50)
                }}
                className={`btn btn-sm ${i === active ? 'btn-accent' : 'btn-dark bg-ink-2'}`}
              >
                {c.client}
              </button>
            ))}
          </div>
        )}

        <figure>
          <div className="pixel-box relative w-full overflow-hidden bg-ink select-none" style={{ aspectRatio: ratio, ['--p' as string]: '8px' }}>
            <Image src={item.afterImage.url} alt={item.afterImage.alt || `${item.client}: depois`} fill sizes="(min-width: 1240px) 1176px, 100vw" className="object-cover" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <Image src={item.beforeImage.url} alt={item.beforeImage.alt || `${item.client}: antes`} fill sizes="(min-width: 1240px) 1176px, 100vw" className="object-cover" />
            </div>

            <span className="pixel-box absolute left-3 top-3 bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {item.beforeLabel || 'Antes'}
            </span>
            <span className="pixel-box absolute bottom-3 right-3 bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black">
              {item.afterLabel || 'Depois'}
            </span>

            {/* Linha e alca */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-accent" style={{ left: `${pos}%` }}>
              <span className="pixel-box absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-accent text-black">
                <ChevronsHorizontal className="h-7 w-7" />
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-label={`Comparar antes e depois de ${item.client}`}
              aria-valuetext={`${pos}% antes`}
              className="peer absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
          </div>
          <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-3 text-muted-dark">
            <strong className="text-white">{item.client}</strong>
            {item.summary && <span>{item.summary}</span>}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
