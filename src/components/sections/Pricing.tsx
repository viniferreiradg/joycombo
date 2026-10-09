'use client'

import { useEffect, useId, useState } from 'react'
import { Check, ChevronRight, Clock, Whatsapp } from 'pixelarticons/react'
import WhatsAppLink from '@/components/WhatsAppLink'
import SectionHeading from '@/components/SectionHeading'
import { fillTemplate, formatBRL } from '@/lib/format'
import { trackEvent } from '@/lib/tracking'
import { servicesForTab, type PlanTab, type PlanView, type ServiceView } from '@/lib/plans'

export type PricingTexts = {
  plansKicker: string
  plansTitle: string
  plansIntro: string
  tabPrefix: string
  tabSiteLabel: string
  tabMarcaLabel: string
  fromPrefix: string
  planCtaLabel: string
  paymentNote: string
  onRequestLabel: string
  servicesNote: string
  cumulativePrefix: string
  customTitle: string
  customText: string
  customCtaLabel: string
  customMessage: string
  outOfScope: string
}

// Tabela de precos: seletor de aba e cards. Os itens nao se repetem: cada
// card mostra "Tudo do plano anterior, mais:" e so os itens dos servicos novos. As duas versoes de preco
// (aberto e "a partir de") vao no HTML; o CSS mostra uma conforme o
// data-preco do <html> (teste A/B sem piscar, ver layout.tsx).
export default function Pricing({ plans, services, texts }: { plans: PlanView[]; services: ServiceView[]; texts: PricingTexts }) {
  const [tab, setTab] = useState<PlanTab>('site')
  const tabsId = useId()

  // Os cards do "Pra quem e" levam para #planos-marca / #planos-site
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#planos-(site|marca)$/)
      if (m) setTab(m[1] as PlanTab)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const tabs: { value: PlanTab; label: string }[] = [
    { value: 'site', label: texts.tabSiteLabel },
    { value: 'marca', label: texts.tabMarcaLabel },
  ]
  const visible = plans.filter((p) => p.tabs.includes(tab))
  // So servicos que aparecem em algum plano da aba, na ordem da aba
  const tabServices = servicesForTab(services, visible).filter((s) => visible.some((p) => p.serviceIds.includes(s.id)))

  const choose = (value: PlanTab) => {
    setTab(value)
    trackEvent('planos_aba', { aba: value })
  }

  return (
    <section id="planos" className="section on-light relative bg-paper text-black">
      {/* Alvos das ancoras dos cards "Pra quem e" */}
      <span id="planos-site" className="absolute top-0" aria-hidden />
      <span id="planos-marca" className="absolute top-0" aria-hidden />

      <div className="container-site">
        <SectionHeading kicker={texts.plansKicker} title={texts.plansTitle} intro={texts.plansIntro} className="md:!mb-10" />

        {/* Seletor: Preciso de > SITE | MARCA */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 font-title text-lg font-bold uppercase">
            {texts.tabPrefix}
            <ChevronRight className="h-6 w-6" aria-hidden />
          </span>
          <div role="tablist" aria-label={texts.tabPrefix} className="pixel-box flex bg-white p-1.5">
            {tabs.map((t) => (
              <button
                key={t.value}
                id={`${tabsId}-${t.value}`}
                role="tab"
                type="button"
                aria-selected={tab === t.value}
                aria-controls={`${tabsId}-panel`}
                onClick={() => choose(t.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const next = t.value === 'site' ? 'marca' : 'site'
                    choose(next)
                    document.getElementById(`${tabsId}-${next}`)?.focus()
                  }
                }}
                tabIndex={tab === t.value ? 0 : -1}
                className={`pixel-box min-h-10 px-6 font-title text-base font-bold uppercase tracking-wide transition-colors md:px-10 ${
                  tab === t.value ? 'on-dark bg-black text-white' : 'text-black hover:bg-paper'
                }`}
                style={{ ['--p' as string]: '3px' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
          <div data-reveal-stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {visible.map((plan, i) => (
              <PlanCard key={`${tab}-${plan.id}`} plan={plan} previous={visible[i - 1]} rows={tabServices} texts={texts} tab={tab} />
            ))}
            {!visible.length && <p className="text-muted-light">Nenhum plano publicado nesta aba.</p>}
          </div>
        </div>

        {(texts.servicesNote || texts.paymentNote) && (
          <div className="mt-6 space-y-1 text-sm text-muted-light">
            {texts.paymentNote && <p>{texts.paymentNote}</p>}
            {texts.servicesNote && <p>{texts.servicesNote}</p>}
          </div>
        )}

        {/* Sob medida */}
        <div
          data-reveal
          className="on-dark pixel-box mt-14 flex flex-col gap-6 bg-black p-6 text-white md:flex-row md:items-center md:justify-between md:p-10"
          style={{ ['--p' as string]: '8px' }}
        >
          <div className="max-w-2xl">
            <h3 className="mb-3 font-title text-2xl font-bold uppercase md:text-3xl">{texts.customTitle}</h3>
            <p className="text-muted-dark">{texts.customText}</p>
          </div>
          <WhatsAppLink message={texts.customMessage} origin="sob-medida" className="btn btn-accent shrink-0">
            <Whatsapp aria-hidden />
            <span>{texts.customCtaLabel}</span>
          </WhatsAppLink>
        </div>

        {texts.outOfScope && <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-light">{texts.outOfScope}</p>}
      </div>
    </section>
  )
}

type CardProps = { plan: PlanView; previous?: PlanView; rows: ServiceView[]; texts: PricingTexts; tab: PlanTab }

function PlanCard({ plan, previous, rows, texts, tab }: CardProps) {
  const hl = plan.highlight
  // Sem repetir itens: se o plano tem tudo do anterior da aba, mostra
  // "Tudo do plano X, mais:" e so os servicos novos
  const included = rows.filter((s) => plan.serviceIds.includes(s.id))
  const extendsPrevious = Boolean(previous?.serviceIds.length && previous.serviceIds.every((id) => plan.serviceIds.includes(id)))
  const shown = extendsPrevious ? included.filter((s) => !previous!.serviceIds.includes(s.id)) : included
  // Nome do card pela aba: o primeiro e o servico base (SITE / MARCA); os
  // outros dizem o que acrescentam (+ MARCA, + INSTA, + NOME). O nome do
  // plano no admin continua valendo para a mensagem do WhatsApp e os eventos
  const title = extendsPrevious
    ? shown.map((s) => `+ ${s.label}`).join(' ')
    : included.length === 1
      ? included[0].label
      : plan.name
  const previousLabel = rows
    .filter((s) => previous?.serviceIds.includes(s.id))
    .map((s) => s.label)
    .join(' + ')
  const priceClass = 'font-title text-[1.75rem] font-bold leading-none tracking-tight'

  return (
    // Hover: o card sobe 12px (top, para não brigar com o transform da animação de entrada)
    <article
      className={`pixel-box relative top-0 flex flex-col p-6 transition-[top] duration-200 ease-in-out hover:-top-3 ${hl ? 'bg-accent text-black' : 'bg-white text-black'}`}
      style={{ ['--p' as string]: '8px' }}
    >
      {/* Faixa do selo: reservada em todos os cards, para os titulos e
          precos alinharem entre as colunas */}
      <div className="mb-3 h-6">
        {hl && plan.highlightLabel && (
          <span
            className="on-dark pixel-box inline-block bg-black px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-wider text-accent"
            style={{ ['--p' as string]: '3px' }}
          >
            {plan.highlightLabel}
          </span>
        )}
      </div>
      <h3 className="font-title text-lg font-bold uppercase leading-tight tracking-tight">{title}</h3>

      {/* Preco. A linha "De ... por" / "A partir de" ocupa espaco mesmo vazia */}
      <p className="mt-5 h-4 text-xs leading-4 text-muted-light">
        {plan.price !== null && plan.compareAt !== null && (
          <span className="preco-a">
            De <s>{formatBRL(plan.compareAt)}</s> por
          </span>
        )}
        {plan.price !== null && <span className="preco-b">{texts.fromPrefix}</span>}
      </p>
      <p className={`mt-1.5 ${priceClass}`}>{plan.price !== null ? formatBRL(plan.price) : texts.onRequestLabel}</p>

      {/* Economia (so no preco aberto) e prazo, cada um na sua linha e com
          altura fixa, para as listas comecarem na mesma altura */}
      <div className="mt-3 h-6">
        {plan.savings !== null && (
          <span
            className={`preco-a pixel-box inline-block px-2 py-1 text-xs font-bold leading-none ${hl ? 'on-dark bg-black text-accent' : 'bg-accent text-black'}`}
            style={{ ['--p' as string]: '3px' }}
          >
            Economia de {formatBRL(plan.savings)}
          </span>
        )}
      </div>
      <p className="mt-2 flex h-5 items-center gap-1.5 text-sm font-semibold">
        {plan.deadlineDays !== null && (
          <>
            <Clock className="h-4 w-4" aria-hidden />
            Prazo: {plan.deadlineDays} dias
          </>
        )}
      </p>

      {/* O que vem, sem repetir o plano anterior */}
      <div className={`mt-5 space-y-4 border-t pt-5 text-sm ${hl ? 'border-black/20' : 'border-line-light'}`}>
        {extendsPrevious && (
          <p className="flex gap-2 font-bold leading-snug">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{fillTemplate(texts.cumulativePrefix, { plano: previousLabel })}</span>
          </p>
        )}
        {shown.map((s) => (
          <div key={s.id}>
            {shown.length > 1 && <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-light">{s.label}</p>}
            <ul className="space-y-1.5 leading-snug">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6" />
      <WhatsAppLink
        message={plan.whatsappMessage}
        origin={`plano-${tab}`}
        plan={plan.name}
        // No hover o botão inverte para contrastar com o card: verde vira preto, preto vira branco
        className={`btn min-h-11 w-full py-2.5 text-sm ${hl ? 'btn-dark hover:bg-white hover:text-black' : 'btn-accent hover:bg-black hover:text-white'}`}
      >
        <span>{texts.planCtaLabel}</span>
      </WhatsAppLink>
    </article>
  )
}
