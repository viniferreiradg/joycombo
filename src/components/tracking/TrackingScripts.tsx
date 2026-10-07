'use client'

import { useEffect } from 'react'
import { CONSENT_EVENT, captureAttribution, getConsent, type Consent, type TrackingConfig } from '@/lib/tracking'

function addScript(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

// Tag do Google: um gtag.js serve GA4 e Google Ads ao mesmo tempo
function loadGoogle(cfg: TrackingConfig) {
  const ids = [cfg.ga4Id, cfg.googleAdsId].filter(Boolean) as string[]
  if (!ids.length) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  })
  window.gtag('js', new Date())
  for (const id of ids) window.gtag('config', id)
  addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`)
}

// Snippet oficial do Pixel da Meta, reescrito sem o IIFE minificado
function loadMeta(pixelId: string) {
  if (window.fbq) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue!.push(args)
  } as NonNullable<Window['fbq']>
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  addScript('https://connect.facebook.net/en_US/fbevents.js')
  fbq('init', pixelId)
  fbq('track', 'PageView')
}

// Carrega os pixels so depois do "Aceitar" no banner de cookies. Se a pessoa
// recusar depois, avisa as duas plataformas para pararem de usar cookies.
export default function TrackingScripts({ config }: { config: TrackingConfig }) {
  useEffect(() => {
    captureAttribution()
    window.__jcTracking = config
    let loaded = false

    const apply = (consent: Consent | null) => {
      if (consent === 'granted' && !loaded) {
        loaded = true
        loadGoogle(config)
        if (config.metaPixelId) loadMeta(config.metaPixelId)
      } else if (consent === 'denied' && loaded) {
        window.gtag?.('consent', 'update', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
        })
        window.fbq?.('consent', 'revoke')
      }
    }

    apply(getConsent())
    const onChange = (e: Event) => apply((e as CustomEvent<Consent>).detail)
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_EVENT, onChange)
  }, [config])

  return null
}
