'use client'

import { useRowLabel } from '@payloadcms/ui'

// Nome da linha nos arrays do modulo de orcamentos: primeiro texto preenchido.
const KEYS = ['nome', 'texto'] as const

export default function RowLabel() {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const number = String((rowNumber ?? 0) + 1).padStart(2, '0')

  for (const key of KEYS) {
    const v = data?.[key]
    if (typeof v === 'string' && v.trim()) {
      const text = v.trim()
      return (
        <span>
          <span style={{ color: 'var(--theme-elevation-400)', marginRight: '8px' }}>{number}</span>
          {text.length > 60 ? `${text.slice(0, 60)}…` : text}
        </span>
      )
    }
  }

  return <span>{number}</span>
}
