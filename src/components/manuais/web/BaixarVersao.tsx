'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type SvgSalvo, arquivoSvg } from '@/lib/manuais/marcas'
import { baixarArquivo, salvar } from './baixar'

/**
 * Marca da pagina de versoes que, ao clicar, abre um menuzinho para baixar a
 * versao em SVG (montado do SVG salvo) ou PNG (o enviado no painel). O menu vai
 * para o body, fora da pagina: nao e cortado nem encolhe com a pagina, e nao
 * entra no PDF.
 */
export default function BaixarVersao({ arquivo, svg, png, children }: { arquivo: string; svg: SvgSalvo; png: string | null; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const base = arquivo.replace(/\.svg$/i, '')

  useEffect(() => {
    if (!pos) return
    const fechar = () => setPos(null)
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node
      if (!menu.current?.contains(alvo) && !botao.current?.contains(alvo)) fechar()
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', tecla)
    window.addEventListener('scroll', fechar, true)
    window.addEventListener('resize', fechar)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', tecla)
      window.removeEventListener('scroll', fechar, true)
      window.removeEventListener('resize', fechar)
    }
  }, [pos])

  const abrir = () => {
    if (pos) return setPos(null)
    const r = botao.current?.getBoundingClientRect()
    if (!r) return
    // logo abaixo da marca, centralizado, sem sair da tela
    const largura = 220
    const x = Math.min(Math.max(r.left + r.width / 2 - largura / 2, 8), window.innerWidth - largura - 8)
    const y = Math.min(r.bottom + 8, window.innerHeight - 90)
    setPos({ x, y })
  }

  return (
    <>
      <button ref={botao} type="button" className="mn-versao-botao" aria-haspopup="menu" aria-expanded={Boolean(pos)} title="Baixar esta versão" onClick={abrir}>
        {children}
      </button>
      {pos
        ? createPortal(
            <div ref={menu} className="mn-baixar" role="menu" style={{ left: pos.x, top: pos.y }}>
              <span>Baixar esta versão em:</span>
              <div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    salvar(new Blob([arquivoSvg(svg)], { type: 'image/svg+xml' }), `${base}.svg`)
                    setPos(null)
                  }}
                >
                  SVG
                </button>
                {png ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      void baixarArquivo(png, `${base}.png`)
                      setPos(null)
                    }}
                  >
                    PNG
                  </button>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
