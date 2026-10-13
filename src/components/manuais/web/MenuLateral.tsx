'use client'

import { useEffect, useState } from 'react'
import { gerarPdf } from './pdf'
import { baixarArquivo } from './baixar'

export type ItemMenu = { titulo: string; id: string; n: number; secao?: boolean; itens?: ItemMenu[] }

// Menu fixo com as secoes do manual e scrollspy (a pagina mais visivel fica
// marcada). No celular vira gaveta, aberta pelo botao da barra do topo.
export default function MenuLateral({
  cliente,
  itens,
  arquivo,
  zip,
}: {
  cliente: string
  itens: ItemMenu[]
  arquivo: string
  /** ZIP com todas as versoes, enviado no painel */
  zip: { url: string; filename: string } | null
}) {
  const [ativo, setAtivo] = useState('')
  const [aberto, setAberto] = useState(false)
  // progresso do PDF: null = parado
  const [progresso, setProgresso] = useState<string | null>(null)
  const baixar = async () => {
    setProgresso('Preparando…')
    try {
      await gerarPdf(arquivo, (feitas, total) => setProgresso(`Gerando ${feitas}/${total}`))
    } catch {
      window.alert('Não foi possível gerar o PDF. Tente de novo.')
    } finally {
      setProgresso(null)
    }
  }
  const [baixandoZip, setBaixandoZip] = useState(false)
  const baixarZip = async () => {
    if (!zip) return
    setBaixandoZip(true)
    await baixarArquivo(zip.url, zip.filename)
    setBaixandoZip(false)
  }
  const botaoPdf = (
    <button type="button" className="mn-pdf" disabled={progresso !== null} onClick={baixar}>
      {progresso ?? 'Baixar PDF'}
    </button>
  )

  useEffect(() => {
    const visivel = new Map<string, number>()
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visivel.set(e.target.id, e.intersectionRatio)
        let melhor = ''
        let maior = 0
        for (const [id, r] of visivel) {
          if (r > maior) {
            maior = r
            melhor = id
          }
        }
        if (melhor) setAtivo(melhor)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    document.querySelectorAll('[data-pagina]').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto])

  const link = (i: ItemMenu) => (
    <a href={`#${i.id}`} className={`${i.secao ? 'mn-secao' : ''} ${ativo === i.id ? 'mn-ativo' : ''}`} onClick={() => setAberto(false)}>
      <span>{i.titulo}</span>
      <span className="mn-num">{String(i.n).padStart(2, '0')}</span>
    </a>
  )

  return (
    <>
      <div className="mn-barra">
        <span>{cliente}</span>
        {botaoPdf}
        <button type="button" aria-expanded={aberto} aria-controls="mn-menu" onClick={() => setAberto((a) => !a)}>
          {aberto ? 'Fechar' : 'Menu'}
        </button>
      </div>
      <nav id="mn-menu" className={`mn-menu ${aberto ? 'mn-aberto' : ''}`} aria-label="Seções do manual">
        <div className="mn-menu-cliente">{cliente}</div>
        <div className="mn-menu-sub">Manual de Marca</div>
        <div className="mn-menu-pdf">
          {botaoPdf}
          {zip ? (
            <button type="button" className="mn-pdf mn-zip" disabled={baixandoZip} onClick={baixarZip}>
              {baixandoZip ? 'Baixando…' : 'Baixar versões da marca'}
            </button>
          ) : null}
        </div>
        <ul>
          {itens.map((i) => (
            <li key={i.id}>
              {link(i)}
              {i.itens?.length ? (
                <ul>
                  {i.itens.map((s) => (
                    <li key={s.id}>{link(s)}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
