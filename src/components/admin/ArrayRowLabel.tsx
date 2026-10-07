'use client'

import { useRowLabel } from '@payloadcms/ui'

// Primeiro campo de texto preenchido vira o nome da linha, no lugar de
// "Item 01". A ordem cobre os arrays dos blocos de projeto e das homepages.
const KEYS = ['title', 'subheading', 'value', 'label', 'text', 'role'] as const

export default function ArrayRowLabel() {
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

  return <span>Item {number}</span>
}
