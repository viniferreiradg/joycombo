'use client'

import { useEffect } from 'react'

// Efeito de "ir aparecendo" ao rolar: marca com data-in cada elemento com
// data-reveal, e cada filho de um data-reveal-stagger, quando ele mesmo entra
// na tela. Os filhos que entram juntos (mesma linha) sobem um apos o outro.
// A animacao fica no CSS (globals.css); sem JavaScript ou com animacoes
// desligadas no sistema, tudo aparece normal.
const SELECTOR = '[data-reveal]:not([data-in]), [data-reveal-stagger] > :not([data-in])'
const STAGGER_MS = 110

export default function RevealObserver() {
  useEffect(() => {
    if (!document.documentElement.hasAttribute('data-reveal-on')) return

    const io = new IntersectionObserver(
      (entries) => {
        // Na ordem da pagina, para o atraso seguir a leitura
        const entering = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        entering.forEach((el, i) => {
          el.style.setProperty('--reveal-delay', `${i * STAGGER_MS}ms`)
          el.setAttribute('data-in', '')
          io.unobserve(el)
        })
      },
      // So dispara quando o topo do item passa de 3/4 da altura da tela
      { rootMargin: '0px 0px -25% 0px' },
    )
    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el))
    scan()

    // Partes que montam depois (carrossel de depoimentos, troca de aba dos planos...)
    let queued = 0
    const mo = new MutationObserver(() => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), scan()))
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      cancelAnimationFrame(queued)
    }
  }, [])

  return null
}
