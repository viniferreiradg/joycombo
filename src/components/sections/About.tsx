import MediaView from '@/components/MediaView'
import { BrandSymbol } from '@/components/Brand'
import { paragraphs } from '@/lib/format'
import type { Landing } from '@/lib/data'

export default function About({ landing }: { landing: Landing }) {
  const photo = landing.aboutPhoto

  return (
    <section id="quem-faz" className="section on-light bg-white text-black">
      <div className="container-site grid items-start gap-10 md:grid-cols-[5fr_7fr] md:gap-16">
        <div className="pixel-box relative aspect-[4/5] overflow-hidden bg-black" style={{ ['--p' as string]: '8px' }}>
          {photo?.url ? (
            // Foto ou video .mp4 em loop (como a foto do portfolio do Vini)
            <MediaView
              src={photo.url}
              mimeType={photo.mimeType}
              alt={photo.alt || landing.aboutName}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          ) : (
            <BrandSymbol title="" className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>

        <div>
          <span className="kicker mb-4">{landing.aboutKicker}</span>
          <h2 className="title mb-2">{landing.aboutName}</h2>
          <p className="mb-8 font-semibold text-muted-light">{landing.aboutRole}</p>
          <div className="space-y-4 text-lg leading-relaxed">
            {paragraphs(landing.aboutText).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {!!landing.aboutStats.length && (
            <dl className="mt-10 grid grid-cols-2 gap-3 md:gap-4">
              {landing.aboutStats.map((s) => (
                <div key={s.value + s.label} className="pixel-box bg-paper p-5" style={{ ['--p' as string]: '6px' }}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-title text-3xl font-bold md:text-4xl">{s.value}</span>
                    <span className="mt-1 block text-sm text-muted-light">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}
