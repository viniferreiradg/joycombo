'use client'

import { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

// Confere no Google Fonts se a familia digitada existe (o Google responde 400
// para nome errado, ex.: "Montsserat", ou para fontes que nao sao dele, ex.: Bogue)
export default function ConferirFonte({ path }: { path: string }) {
  const base = path.replace(/\.conferirGoogle$/, '')
  const familia = useFormFields(([fields]) => (fields[`${base}.googleFamilia`]?.value as string | undefined) || '')
  const nome = familia.replace(/[^\w\s-]/g, '').trim()
  const [estado, setEstado] = useState<{ nome: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!nome) return
    const controle = new AbortController()
    const t = setTimeout(() => {
      fetch(`https://fonts.googleapis.com/css2?family=${nome.replace(/\s+/g, '+')}&display=swap`, { signal: controle.signal })
        .then((r) => setEstado({ nome, ok: r.ok }))
        .catch(() => undefined)
    }, 500)
    return () => {
      clearTimeout(t)
      controle.abort()
    }
  }, [nome])

  if (!nome || estado?.nome !== nome) return null
  return estado.ok ? (
    <p style={{ color: 'var(--theme-success-500, #2e7d32)', fontSize: 12, margin: '-8px 0 16px' }}>✓ Encontrada no Google Fonts.</p>
  ) : (
    <p style={{ color: 'var(--theme-error-500)', fontSize: 12, margin: '-8px 0 16px' }}>
      &quot;{nome}&quot; não existe no Google Fonts. Confira o nome (ex.: Montserrat). Se a fonte não é do Google (ex.: Bogue), escolha &quot;Arquivo da fonte&quot; e envie o arquivo.
    </p>
  )
}
