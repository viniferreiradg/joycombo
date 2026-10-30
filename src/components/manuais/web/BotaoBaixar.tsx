'use client'

import { useState } from 'react'
import { baixarArquivo } from './baixar'

/** Botao de um arquivo de apoio (ex.: plugin de Photoshop) num bloco do universo visual */
export default function BotaoBaixar({ rotulo, url, filename }: { rotulo: string; url: string; filename: string }) {
  const [baixando, setBaixando] = useState(false)
  return (
    <button
      type="button"
      className="mn-baixar"
      disabled={baixando}
      onClick={async () => {
        setBaixando(true)
        await baixarArquivo(url, filename)
        setBaixando(false)
      }}
    >
      {baixando ? 'Baixando…' : rotulo}
    </button>
  )
}
