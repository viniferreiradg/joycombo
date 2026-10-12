'use client'

import { useEffect, useState } from 'react'
import { Close, Menu } from 'pixelarticons/react'

// Menu hamburguer do orcamento no celular: abre a lista de ancoras por baixo
// do topo; clicar num item (ou fora) fecha.
export default function MenuMobile({ itens }: { itens: { href: string; label: string }[] }) {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto])

  return (
    <div className="ml-auto md:hidden">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls="menu-orcamento"
        aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
        className="grid h-11 w-11 place-items-center text-white"
      >
        {aberto ? <Close className="h-7 w-7" aria-hidden /> : <Menu className="h-7 w-7" aria-hidden />}
      </button>
      {aberto && (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 top-16 z-30 bg-black/50" onClick={() => setAberto(false)} />
          <nav id="menu-orcamento" aria-label="Seções do orçamento" className="absolute inset-x-0 top-16 z-40 border-t border-line-dark bg-black">
            <ul className="container-site py-4">
              {itens.map((i) => (
                <li key={i.href}>
                  <a
                    href={i.href}
                    onClick={() => setAberto(false)}
                    className="block border-b border-line-dark py-4 font-title text-lg font-bold uppercase text-white last:border-0 hover:text-accent"
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  )
}
