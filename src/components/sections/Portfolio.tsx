'use client'

import { useId, useState } from 'react'
import MediaView from '@/components/MediaView'
import type { ProjectDoc } from '@/lib/data'
import SectionHeading from '@/components/SectionHeading'

// Portfolio no formato do portfolio do Vini: titulo a esquerda, abas a
// direita e grade de capas quadradas. No hover (sempre visivel no celular)
// a capa escurece e mostra categorias, titulo e descricao. Por enquanto sem
// pagina de detalhe do case.
type Texts = { kicker: string; title: string; intro?: string; tabAll: string; tabSites: string; tabBrands: string; empty: string }
type Props = { texts: Texts; projects: ProjectDoc[] }

const CATEGORY_LABEL: Record<string, string> = { marca: 'Marca', site: 'Site', insta: 'Instagram' }

export default function Portfolio({ texts, projects }: Props) {
  const tabsId = useId()
  // "Todos" abre primeiro; "Sites" e "Identidade visual" mostram tudo da categoria
  const tabs = [
    { value: 'all', label: texts.tabAll },
    { value: 'site', label: texts.tabSites },
    { value: 'marca', label: texts.tabBrands },
  ]
  const [tab, setTab] = useState('all')

  if (!projects.length) return null
  const ofCategory = (c: string) => projects.filter((p) => p.categories?.includes(c))
  // "Todos": os 3 primeiros sites e depois as 3 primeiras identidades visuais
  // (na ordem do admin). Projeto com as duas categorias aparece uma vez só.
  const firstSites = ofCategory('site').slice(0, 3)
  const firstBrands = ofCategory('marca')
    .filter((p) => !firstSites.includes(p))
    .slice(0, 3)
  const visible = tab === 'all' ? [...firstSites, ...firstBrands] : ofCategory(tab)

  return (
    <section id="portfolio" className="on-light section bg-white text-black">
      <div className="container-site">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <SectionHeading kicker={texts.kicker} title={texts.title} intro={texts.intro} tone="light" className="!mb-0" />

          <div role="tablist" aria-label={texts.title} className="pixel-box flex shrink-0 self-start bg-paper p-1.5 md:self-end">
            {tabs.map((t) => (
              <button
                key={t.value}
                id={`${tabsId}-${t.value}`}
                role="tab"
                type="button"
                aria-selected={tab === t.value}
                aria-controls={`${tabsId}-panel`}
                tabIndex={tab === t.value ? 0 : -1}
                onClick={() => setTab(t.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const i = tabs.findIndex((x) => x.value === t.value)
                    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].value
                    setTab(next)
                    document.getElementById(`${tabsId}-${next}`)?.focus()
                  }
                }}
                className={`pixel-box min-h-10 whitespace-nowrap px-3 font-title text-xs font-bold uppercase tracking-wide transition-colors sm:px-6 sm:text-base md:px-8 ${
                  tab === t.value ? 'on-dark bg-black text-white' : 'text-black hover:bg-white'
                }`}
                style={{ ['--p' as string]: '3px' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} data-reveal>
          {!visible.length ? (
            <p className="text-muted-light">{texts.empty}</p>
          ) : (
            // key: troca de aba remonta a grade e os cards entram de novo
            <ul key={tab} className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {visible.map((p, i) => {
                const cover = p.coverImage
                const chips = !!p.categories?.length && (
                  <ul className="flex flex-wrap gap-1.5">
                    {p.categories.map((c) => (
                      <li
                        key={c}
                        className="pixel-box bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-black"
                        style={{ ['--p' as string]: '2px' }}
                      >
                        {CATEGORY_LABEL[c] || c}
                      </li>
                    ))}
                  </ul>
                )
                const info = (
                  <>
                    <h3 className="font-title text-xl font-bold uppercase leading-tight md:text-2xl">{p.title}</h3>
                    {p.summary && <p className="mt-1.5 text-sm leading-snug text-white/80">{p.summary}</p>}
                    {p.partner && <p className="mt-2 text-xs text-muted-dark">Desenvolvido em parceria com {p.partner}</p>}
                  </>
                )
                return (
                  <li key={p.id} className="portfolio-card group overflow-hidden bg-ink" style={{ ['--i' as string]: i }}>
                    <div className="relative aspect-square overflow-hidden">
                      {cover?.url && (
                        <MediaView
                          src={cover.url}
                          mimeType={cover.mimeType}
                          alt={cover.alt || p.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* Celular: imagem limpa, só as categorias no topo */}
                      {chips && <div className="absolute left-4 top-4 md:hidden">{chips}</div>}

                      {/* Desktop: tudo aparece sobre a capa no hover */}
                      <div className="on-dark absolute inset-0 hidden flex-col justify-end bg-black/65 p-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
                        {chips && <div className="mb-3">{chips}</div>}
                        {info}
                      </div>
                    </div>

                    {/* Celular: nome e descrição embaixo da capa */}
                    <div className="on-dark bg-black p-5 text-white md:hidden">{info}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
