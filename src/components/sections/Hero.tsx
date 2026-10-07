'use client'

import { useEffect, useRef } from 'react'
import { Whatsapp } from 'pixelarticons/react'
import WhatsAppLink from '@/components/WhatsAppLink'
import { BrandSymbol } from '@/components/Brand'
import type { MediaDoc } from '@/lib/data'

type Props = {
  line: string
  ctaLabel: string
  message: string
  video: MediaDoc | null
  videoMobile: MediaDoc | null
  poster: MediaDoc | null
  posterMobile: MediaDoc | null
}

// Primeira tela: video dos trabalhos em tela cheia, uma linha dizendo o que
// e e pra quem, e o WhatsApp embaixo. Tudo cabe em 100% da altura.
export default function Hero({ line, ctaLabel, message, video, videoMobile, poster, posterMobile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasVideo = Boolean(video?.url || videoMobile?.url)
  const hasPoster = Boolean(poster?.url || posterMobile?.url)

  // Com "reduzir movimento" ligado, o video fica parado no poster
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (mq.matches) v.pause()
      else v.play().catch(() => {})
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <section id="topo" className="on-dark relative flex h-[100svh] min-h-[560px] flex-col justify-end overflow-hidden bg-black">
      {/* Capa estatica: aparece antes do video carregar */}
      {hasPoster && (
        <picture>
          {posterMobile?.url && <source media="(max-width: 767px)" srcSet={posterMobile.url} />}
          <img
            src={(poster?.url || posterMobile?.url)!}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      )}

      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        >
          {/* Versao vertical e mais leve no celular */}
          {videoMobile?.url && <source src={videoMobile.url} type={videoMobile.mimeType || 'video/mp4'} media="(max-width: 767px)" />}
          {video?.url && <source src={video.url} type={video.mimeType || 'video/mp4'} />}
          {!video?.url && videoMobile?.url && <source src={videoMobile.url} type={videoMobile.mimeType || 'video/mp4'} />}
        </video>
      ) : (
        !hasPoster && <HeroPlaceholder />
      )}

      {/* Escurece a base para o texto e o botao terem contraste sobre qualquer video */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

      <div className="container-site relative pb-10 md:pb-16">
        <h1 className="title max-w-4xl text-[clamp(2.4rem,1.2rem+5.5vw,6rem)] text-white">{line}</h1>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <WhatsAppLink message={message} origin="hero" className="btn btn-accent btn-lg">
            <Whatsapp aria-hidden />
            <span>{ctaLabel}</span>
          </WhatsAppLink>
          <a href="#planos" className="text-sm font-semibold text-white underline decoration-accent decoration-2 underline-offset-4 hover:decoration-white">
            Ver planos e preços
          </a>
        </div>
      </div>
    </section>
  )
}

// Enquanto o video do Remotion nao chega: naves em padrao e o simbolo
function HeroPlaceholder() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-0 animate-drift opacity-25"
        style={{
          backgroundImage: 'url(/brand/joycombo-nave.svg)',
          backgroundSize: '120px 89px',
          backgroundRepeat: 'repeat',
        }}
      />
      <BrandSymbol title="" className="absolute right-[-12vw] top-[12%] h-[min(80vw,620px)] w-[min(80vw,620px)] opacity-90 md:right-[6vw]" />
    </div>
  )
}
