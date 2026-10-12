'use client'

import { useEffect, useState } from 'react'
import { useConfig, useRowLabel } from '@payloadcms/ui'
import { formatBRL } from '@/lib/format'

const nomes = new Map<string, string>()

// Linha da lista de propostas do orcamento: "#1 Landing Page · R$ 890,90"
export default function PropostaRowLabel() {
  const { data, rowNumber } = useRowLabel<{ proposta?: number | string | { id: number; nome: string }; valor?: number | null }>()
  const {
    config: { routes },
  } = useConfig()
  const ref = data?.proposta
  const id = ref && typeof ref === 'object' ? String(ref.id) : ref ? String(ref) : ''
  const [, setCarregado] = useState(0)
  const nome = (ref && typeof ref === 'object' ? ref.nome : nomes.get(id)) || ''

  useEffect(() => {
    if (!id || nomes.has(id)) return
    fetch(`${routes.api}/propostas/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.nome) {
          nomes.set(id, p.nome)
          setCarregado((n) => n + 1)
        }
      })
      .catch(() => {})
  }, [id, routes.api])

  return (
    <span>
      <span style={{ color: 'var(--theme-elevation-400)', marginRight: 8 }}>#{(rowNumber ?? 0) + 1}</span>
      {nome || 'Escolha a proposta'}
      {typeof data?.valor === 'number' && <span style={{ color: 'var(--theme-elevation-500)' }}> · {formatBRL(data.valor)}</span>}
    </span>
  )
}
