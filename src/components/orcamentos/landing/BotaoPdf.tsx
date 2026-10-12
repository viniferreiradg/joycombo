'use client'

import { useState } from 'react'
import { Download } from 'pixelarticons/react'

// Baixa o PDF no layout da tela: mesmo breakpoint do site (md = 768px)
export default function BotaoPdf({ token, className = '' }: { token: string; className?: string }) {
  const [gerando, setGerando] = useState(false)

  const baixar = () => {
    const layout = window.matchMedia('(min-width: 768px)').matches ? 'desktop' : 'mobile'
    setGerando(true)
    window.location.href = `/orcamento/${token}/pdf?layout=${layout}`
    setTimeout(() => setGerando(false), 5000)
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={gerando}
      className={`btn btn-accent ${className}`}
    >
      <Download aria-hidden />
      {gerando ? 'Gerando PDF…' : 'Baixar PDF'}
    </button>
  )
}
