import MediaView from '@/components/MediaView'
import { ArrowRight } from 'pixelarticons/react'
import type { ProjectDoc } from '@/lib/data'
import SectionHeading from '@/components/SectionHeading'

const CATEGORY_LABEL: Record<string, string> = { marca: 'Marca', site: 'Site', insta: 'Instagram' }

// Grade de projetos no formato do portfolio do Vini: capa grande, nome,
// o que foi feito e o credito de parceria quando houver.
type Props = { kicker: string; title: string; intro?: string; projects: ProjectDoc[] }

export default function Portfolio({ kicker, title, intro, projects }: Props) {
  if (!projects.length) return null

  return (
    <section id="portfolio" className="on-dark section bg-black text-white">
      <div className="container-site">
        <SectionHeading kicker={kicker} title={title} intro={intro} tone="dark" />

        <ul data-reveal-stagger className="grid gap-x-6 gap-y-12 md:grid-cols-2">
          {projects.map((p) => {
            const cover = p.coverImage
            const hover = p.hoverImage
            const content = (
              <>
                <div className="pixel-box relative aspect-[4/3] overflow-hidden bg-ink" style={{ ['--p' as string]: '8px' }}>
                  {cover?.url && (
                    <MediaView
                      src={cover.sizes?.card?.url || cover.url}
                      mimeType={cover.mimeType}
                      alt={cover.alt || p.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  {hover?.url && (
                    <MediaView
                      src={hover.sizes?.card?.url || hover.url}
                      mimeType={hover.mimeType}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  )}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-title text-xl font-bold uppercase md:text-2xl">{p.title}</h3>
                    {p.summary && <p className="mt-1 text-muted-dark">{p.summary}</p>}
                    {p.partner && <p className="mt-2 text-sm text-muted-dark">Desenvolvido em parceria com {p.partner}</p>}
                  </div>
                  {!!p.categories?.length && (
                    <ul className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {p.categories.map((c) => (
                        <li key={c} className="pixel-box bg-ink-2 px-2.5 py-1 text-xs font-semibold" style={{ ['--p' as string]: '2px' }}>
                          {CATEGORY_LABEL[c] || c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )

            return (
              <li key={p.id}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block">
                    {content}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white underline decoration-accent decoration-2 underline-offset-4">
                      Ver projeto <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </a>
                ) : (
                  <div className="group">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
