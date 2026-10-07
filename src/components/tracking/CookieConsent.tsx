'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { CONSENT_EVENT, OPEN_BANNER_EVENT, getConsent, setConsent, type Consent } from '@/lib/tracking'

// Barra de consentimento: aparece na primeira visita, some depois da escolha
// e pode ser reaberta pelo link "Cookies" do rodape.
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange)
  return () => window.removeEventListener(CONSENT_EVENT, onChange)
}

export default function CookieConsent() {
  // No servidor nao ha localStorage: 'ssr' mantem a barra escondida ate hidratar
  const consent = useSyncExternalStore(subscribe, getConsent, () => 'ssr' as const)
  const [reopened, setReopened] = useState(false)
  const firstButton = useRef<HTMLButtonElement>(null)
  const open = consent === null || reopened

  useEffect(() => {
    const onOpen = () => setReopened(true)
    window.addEventListener(OPEN_BANNER_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_BANNER_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (reopened) firstButton.current?.focus()
  }, [reopened])

  const choose = (value: Consent) => {
    setConsent(value)
    setReopened(false)
  }

  return (
    <div
      role="region"
      aria-label="Cookies"
      inert={!open}
      className={`fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl bg-white text-black pixel-box transition-all duration-300 ease-out md:inset-x-6 md:bottom-6 ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[120%] opacity-0'
      }`}
    >
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
        <p className="flex-1 text-sm leading-relaxed">
          Usamos cookies do Google e da Meta pra medir os anúncios e melhorar o site.{' '}
          <Link href="/politica-de-privacidade" className="underline underline-offset-2">
            Saiba mais
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button ref={firstButton} type="button" onClick={() => choose('granted')} className="btn btn-accent btn-sm">
            Aceitar
          </button>
          <button type="button" onClick={() => choose('denied')} className="btn btn-outline btn-sm">
            Recusar
          </button>
        </div>
      </div>
    </div>
  )
}

/** Link "Cookies" do rodape: reabre o banner pra pessoa mudar de ideia. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_BANNER_EVENT))} className={className}>
      Cookies
    </button>
  )
}
