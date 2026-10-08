'use client'

import { useEffect, useRef } from 'react'
import { BrandSymbol } from '@/components/Brand'
import type { MediaDoc } from '@/lib/data'

type Props = {
  // não aparece na tela: é o H1 da página para o Google e leitores de tela
  line: string
  video: MediaDoc | null
  videoMobile: MediaDoc | null
  poster: MediaDoc | null
  posterMobile: MediaDoc | null
}

// Primeira tela: só o vídeo dos trabalhos (feito no Remotion, pasta video/),
// inteiro (1920x840 no desktop, 1080x1350 no celular), sem texto por cima. O próprio vídeo fecha com o CTA.
export default function Hero({ line, video, videoMobile, poster, posterMobile }: Props) {
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
    <section id="topo" className="on-dark bg-black pt-16">
      <h1 className="sr-only">{line}</h1>
      {/* Ponta a ponta: 1080x1350 no celular (vídeo mobile), 1920x840 a partir do md */}
      <div className="relative aspect-[1080/1350] w-full overflow-hidden md:aspect-[1920/840]">
        {hasPoster && (
          <picture>
            {posterMobile?.url && <source media="(max-width: 767px)" srcSet={posterMobile.url} />}
            <img
              src={(poster?.url || posterMobile?.url)!}
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-contain"
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
            className="absolute inset-0 h-full w-full object-contain"
          >
            {videoMobile?.url && <source src={videoMobile.url} type={videoMobile.mimeType || 'video/mp4'} media="(max-width: 767px)" />}
            {video?.url && <source src={video.url} type={video.mimeType || 'video/mp4'} />}
            {!video?.url && videoMobile?.url && <source src={videoMobile.url} type={videoMobile.mimeType || 'video/mp4'} />}
          </video>
        ) : (
          !hasPoster && <HeroPlaceholder />
        )}
      </div>
    </section>
  )
}

// Enquanto o video nao e enviado no admin: naves em padrao e o simbolo
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
      <BrandSymbol title="" className="absolute left-1/2 top-1/2 h-[60%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-90" />
    </div>
  )
}
