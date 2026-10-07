// Rastreamento para o trafego pago: Google (GA4 + Google Ads) e Pixel da
// Meta. Os scripts so carregam depois do consentimento (TrackingScripts);
// antes disso, ou sem IDs configurados, as funcoes daqui nao fazem nada.
// Nada aqui pode quebrar a pagina: tudo em try/catch.

type Params = Record<string, string | number | boolean | undefined>

export type TrackingConfig = {
  metaPixelId?: string | null
  ga4Id?: string | null
  googleAdsId?: string | null
  adsLabelWhatsapp?: string | null
  adsLabelForm?: string | null
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: unknown }
    _fbq?: unknown
    __jcTracking?: TrackingConfig
  }
}

// ── Origem da visita (UTM, gclid, fbclid) ──
// Guardada na sessionStorage: vale so para esta visita e vai junto em todos
// os eventos e no formulario.

const ATTR_KEY = 'jc-origem'
const ATTR_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'] as const
export type Attribution = Partial<Record<(typeof ATTR_PARAMS)[number] | 'landing_url', string>>

export function captureAttribution() {
  try {
    const url = new URL(window.location.href)
    const found: Attribution = {}
    for (const key of ATTR_PARAMS) {
      const v = url.searchParams.get(key)
      if (v) found[key] = v.slice(0, 200)
    }
    // So sobrescreve quando a URL traz parametros novos (ex: outro anuncio)
    if (Object.keys(found).length > 0) {
      found.landing_url = `${url.origin}${url.pathname}${url.search}`.slice(0, 500)
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(found))
    }
  } catch {
    // sessionStorage bloqueada: segue sem origem
  }
}

export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(ATTR_KEY) || '{}') as Attribution
  } catch {
    return {}
  }
}

/** Versao da tabela de precos que este visitante ve (teste A/B). */
export function getPriceVariant(): string {
  if (typeof document === 'undefined') return ''
  return document.documentElement.dataset.preco === 'b' ? 'a-partir' : 'aberto'
}

// ── Disparo de eventos ──

function baseParams(): Params {
  const a = getAttribution()
  return {
    variante_preco: getPriceVariant(),
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
  }
}

function gtagEvent(name: string, params: Params) {
  try {
    window.gtag?.('event', name, params)
  } catch {}
}

function adsConversion(label?: string | null) {
  const cfg = window.__jcTracking
  if (!cfg?.googleAdsId || !label) return
  try {
    window.gtag?.('event', 'conversion', { send_to: `${cfg.googleAdsId}/${label}` })
  } catch {}
}

function fbq(...args: unknown[]) {
  try {
    window.fbq?.(...args)
  } catch {}
}

/** Clique em qualquer botao de WhatsApp. `origem` diz de onde veio (hero, plano, flutuante...). */
export function trackWhatsApp(origem: string, extra: Params = {}) {
  const params = { ...baseParams(), origem, ...extra }
  gtagEvent('whatsapp_click', params)
  adsConversion(window.__jcTracking?.adsLabelWhatsapp)
  fbq('track', 'Contact', { content_name: origem, ...extra })
}

/** Clique num plano (evento separado por plano, alem da conversao). */
export function trackPlan(plano: string, extra: Params = {}) {
  const params = { ...baseParams(), plano, ...extra }
  gtagEvent('plano_clique', params)
  fbq('trackCustom', 'PlanoClique', { plano, ...extra })
}

/** Envio do formulario. */
export function trackLead(segmento: string) {
  gtagEvent('generate_lead', { ...baseParams(), segmento })
  adsConversion(window.__jcTracking?.adsLabelForm)
  fbq('track', 'Lead', { content_category: segmento })
}

/** Eventos sem conversao (aba de planos, jogo etc). */
export function trackEvent(name: string, params: Params = {}) {
  gtagEvent(name, { ...baseParams(), ...params })
}

// ── Consentimento de cookies (os pixels dependem dele) ──

export type Consent = 'granted' | 'denied'

const CONSENT_KEY = 'jc-cookies'
export const CONSENT_EVENT = 'jc-consent-change'
export const OPEN_BANNER_EVENT = 'jc-cookie-banner-open'

// Reserva para quando o localStorage estiver bloqueado: a escolha vale so
// enquanto a aba estiver aberta
let memoryConsent: Consent | null = null

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : memoryConsent
  } catch {
    return memoryConsent
  }
}

export function setConsent(value: Consent) {
  memoryConsent = value
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // Fica so na memoria
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }))
}
