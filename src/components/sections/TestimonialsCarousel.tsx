'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'pixelarticons/react'
import SectionHeading from '@/components/SectionHeading'
import PixelAvatar from '@/components/PixelAvatar'
import type { TestimonialDoc } from '@/lib/data'

// Depoimentos com o mesmo efeito do carrossel "Solucoes" dos cases do
// portfolio do Vini: no desktop a secao trava na tela e o scroll vertical
// anda os cards na horizontal (o ativo cheio, os vizinhos apagados e
// menores). No celular e com "reduzir movimento", carrossel simples.
// Feito sem biblioteca de animacao.

type Props = { kicker: string; title: string; items: TestimonialDoc[] }

// Quanto de scroll vertical (em telas) cada depoimento consome no desktop
const STEP_VH = 0.5
const GAP_PX = 32

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export default function TestimonialsCarousel(props: Props) {
  const isDesktop = useMedia('(min-width: 768px)')
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  return isDesktop && !reduced && props.items.length > 1 ? <PinnedTestimonials {...props} /> : <SimpleTestimonials {...props} />
}

// ── Desktop: scroll travado (efeito "Solucoes") ──────────────────────────

function PinnedTestimonials({ kicker, title, items }: Props) {
  const n = items.length
  const trackRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let gridLeft = 0
    let step = 0
    let current = 0
    let raf = 0
    let running = false

    const measure = () => {
      // Borda esquerda do grid do site: o card ativo pousa alinhado ao titulo
      gridLeft = anchorRef.current?.getBoundingClientRect().left || 0
      step = (cardRefs.current[0]?.offsetWidth || 0) + GAP_PX
    }

    const targetIndex = () => {
      const track = trackRef.current
      if (!track) return 0
      const top = track.getBoundingClientRect().top
      const scrollable = track.offsetHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 0
      return progress * (n - 1)
    }

    const apply = () => {
      if (rowRef.current) rowRef.current.style.transform = `translate3d(${gridLeft - current * step}px,0,0)`
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const d = Math.min(1, Math.abs(current - i))
        card.style.opacity = String(1 - d * 0.65)
        card.style.transform = `scale(${1 - d * 0.08})`
      })
      const rounded = Math.round(current)
      setActive((prev) => (prev === rounded ? prev : rounded))
    }

    // Suaviza o movimento (como a mola do portfolio): anda uma fracao ate o alvo
    const frame = () => {
      const target = targetIndex()
      current += (target - current) * 0.2
      if (Math.abs(target - current) < 0.001) current = target
      apply()
      raf = running ? requestAnimationFrame(frame) : 0
    }

    measure()
    current = targetIndex()
    apply()

    // So anima enquanto a secao esta na tela
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true
        raf = requestAnimationFrame(frame)
      } else if (!e.isIntersecting) {
        running = false
      }
    })
    if (trackRef.current) io.observe(trackRef.current)
    const onResize = () => {
      measure()
      apply()
    }
    window.addEventListener('resize', onResize)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [n])

  const scrollToIndex = useCallback(
    (i: number) => {
      const track = trackRef.current
      if (!track) return
      const clamped = Math.min(n - 1, Math.max(0, i))
      const top = track.getBoundingClientRect().top + window.scrollY
      const scrollable = track.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + (clamped / (n - 1)) * scrollable, behavior: 'smooth' })
    },
    [n],
  )

  return (
    // A altura extra (alem de uma tela) e so o trecho de rolagem que anda os
    // cards; o conteudo fica num bloco compacto centralizado na tela
    <div ref={trackRef} className="relative" style={{ height: `${100 + (n - 1) * STEP_VH * 100}vh` }}>
      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label={title}
        className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-16"
      >
        <div className="container-site">
          <div ref={anchorRef} />
          <SectionHeading kicker={kicker} title={title} tone="dark" className="!mb-8" />
        </div>

        <div ref={rowRef} className="flex gap-8 will-change-transform">
          {items.map((t, i) => (
            <div
              key={t.id}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              tabIndex={0}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${n}: ${t.name}`}
              onFocus={() => scrollToIndex(i)}
              className="w-[min(680px,60vw)] shrink-0 origin-left"
            >
              <TestimonialCard item={t} />
            </div>
          ))}
        </div>

        <div className="container-site mt-8">
          <Controls
            current={active}
            total={n}
            atEnd={active === n - 1}
            onPrev={() => scrollToIndex(active - 1)}
            onNext={() => scrollToIndex(active + 1)}
            onSelect={scrollToIndex}
          />
        </div>
      </div>
    </div>
  )
}

// ── Celular e "reduzir movimento": carrossel simples ─────────────────────
// Faixa com scroll horizontal e snap (altura igual ao conteudo), setas,
// bolinhas, arrastar com o mouse e deslizar o dedo (scroll nativo).

function SimpleTestimonials({ kicker, title, items }: Props) {
  const n = items.length
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [atEnd, setAtEnd] = useState(false)
  const drag = useRef<{ x: number; left: number } | null>(null)

  const cards = () => Array.from(trackRef.current?.children || []) as HTMLElement[]

  // Card ativo = o mais perto da borda esquerda da faixa
  const sync = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const list = cards()
    const base = list[0]?.offsetLeft || 0
    let best = 0
    list.forEach((c, i) => {
      if (Math.abs(c.offsetLeft - base - track.scrollLeft) < Math.abs(list[best].offsetLeft - base - track.scrollLeft)) best = i
    })
    const end = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4
    setAtEnd(end)
    setActive(end ? n - 1 : best)
  }, [n])

  useEffect(() => {
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [sync])

  const goTo = (i: number) => {
    const track = trackRef.current
    const list = cards()
    if (!track || !list.length) return
    const target = list[Math.min(n - 1, Math.max(0, i))]
    track.scrollTo({ left: target.offsetLeft - list[0].offsetLeft, behavior: 'smooth' })
  }

  // Arrastar com o mouse (no toque o scroll nativo ja resolve)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !trackRef.current) return
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft }
    trackRef.current.style.scrollSnapType = 'none'
    trackRef.current.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !trackRef.current) return
    trackRef.current.scrollLeft = d.left - (e.clientX - d.x)
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const track = trackRef.current
    if (!d || !track) return
    drag.current = null
    track.releasePointerCapture(e.pointerId)
    // Solta no card mais proximo, na direcao do arraste
    const dx = e.clientX - d.x
    const next = Math.abs(dx) > 60 ? active + (dx < 0 ? 1 : -1) : active
    track.style.scrollSnapType = ''
    goTo(next)
  }

  return (
    <div className="section">
      <div className="container-site">
        <SectionHeading kicker={kicker} title={title} tone="dark" />
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carrossel"
        aria-label={title}
        tabIndex={0}
        onScroll={sync}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            goTo(active + 1)
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            goTo(active - 1)
          }
        }}
        className="edge-track flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto pb-2 select-none active:cursor-grabbing md:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t, i) => (
          <div
            key={t.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${n}: ${t.name}`}
            className="w-[min(560px,85vw)] shrink-0 snap-start"
          >
            <TestimonialCard item={t} />
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="container-site mt-6">
          <Controls current={active} total={n} atEnd={atEnd} onPrev={() => goTo(active - 1)} onNext={() => goTo(active + 1)} onSelect={goTo} />
        </div>
      )}
    </div>
  )
}

function TestimonialCard({ item }: { item: TestimonialDoc }) {
  return (
    <figure className="pixel-box flex h-full flex-col bg-ink p-7 md:p-9" style={{ ['--p' as string]: '8px' }}>
      <span aria-hidden className="mb-2 font-title text-5xl font-bold leading-none text-accent">“</span>
      <blockquote className="mb-8 text-lg leading-snug md:text-xl">{item.text}</blockquote>
      <figcaption className="mt-auto flex items-center gap-4">
        {item.photo?.url ? (
          <Image
            src={item.photo.sizes?.thumbnail?.url || item.photo.url}
            alt=""
            width={56}
            height={56}
            draggable={false}
            className="pixel-box h-14 w-14 shrink-0 bg-white object-cover"
          />
        ) : (
          <PixelAvatar name={item.name} className="pixel-box h-14 w-14 shrink-0" />
        )}
        <div>
          <p className="font-bold">{item.name}</p>
          {item.role && <p className="text-sm text-muted-dark">{item.role}</p>}
        </div>
      </figcaption>
    </figure>
  )
}

function Controls({
  current,
  total,
  atEnd,
  onPrev,
  onNext,
  onSelect,
}: {
  current: number
  total: number
  atEnd: boolean
  onPrev: () => void
  onNext: () => void
  onSelect: (i: number) => void
}) {
  const arrow =
    'pixel-box flex h-11 w-11 items-center justify-center bg-ink-2 text-white transition-colors hover:bg-accent hover:text-black disabled:pointer-events-none disabled:opacity-30'
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={onPrev} disabled={current === 0} aria-label="Depoimento anterior" className={arrow} style={{ ['--p' as string]: '3px' }}>
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>
      <button type="button" onClick={onNext} disabled={atEnd} aria-label="Próximo depoimento" className={arrow} style={{ ['--p' as string]: '3px' }}>
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Ir para o depoimento ${i + 1} de ${total}`}
            aria-current={i === current}
            className={`h-2 transition-all duration-300 ${i === current ? 'w-6 bg-accent' : 'w-2 bg-white/30 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  )
}
