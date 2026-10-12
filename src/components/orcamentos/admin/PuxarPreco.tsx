'use client'

import { useEffect, useState } from 'react'
import { toast, useConfig, useField } from '@payloadcms/ui'
import { formatBRL } from '@/lib/format'

type Opcao = { id: string; label: string; preco: number }

// "Puxar preço do site": lista Serviços avulsos e Planos com preço e copia o
// valor escolhido para o Investimento. Só copia: o campo continua editável e
// não fica ligado ao site.
export default function PuxarPreco() {
  const {
    config: { routes },
  } = useConfig()
  const { setValue } = useField<number>({ path: 'investimento' })
  const [opcoes, setOpcoes] = useState<{ servicos: Opcao[]; planos: Opcao[] }>({ servicos: [], planos: [] })

  useEffect(() => {
    const carregar = (slug: 'services' | 'plans', prefixo: string) =>
      fetch(`${routes.api}/${slug}?limit=50&depth=0&sort=_order`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) =>
          ((res?.docs as { id: number | string; name: string; price?: number | null }[]) || [])
            .filter((d) => typeof d.price === 'number')
            .map((d) => ({ id: `${prefixo}-${d.id}`, label: d.name, preco: d.price as number })),
        )
        .catch(() => [] as Opcao[])
    Promise.all([carregar('services', 's'), carregar('plans', 'p')]).then(([servicos, planos]) => setOpcoes({ servicos, planos }))
  }, [routes.api])

  const escolher = (id: string) => {
    const opcao = [...opcoes.servicos, ...opcoes.planos].find((o) => o.id === id)
    if (!opcao) return
    setValue(opcao.preco)
    toast.success(`Investimento: ${formatBRL(opcao.preco)} (copiado de ${opcao.label})`)
  }

  return (
    <div className="field-type" style={{ flex: '1 1 auto' }}>
      <label className="field-label" htmlFor="puxar-preco">
        Puxar preço do site
      </label>
      <select
        id="puxar-preco"
        value=""
        onChange={(e) => escolher(e.target.value)}
        style={{
          width: '100%',
          height: 40,
          padding: '0 10px',
          borderRadius: 'var(--style-radius-s, 4px)',
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
        }}
      >
        <option value="">Escolher…</option>
        {!!opcoes.servicos.length && (
          <optgroup label="Serviços avulsos">
            {opcoes.servicos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}: {formatBRL(o.preco)}
              </option>
            ))}
          </optgroup>
        )}
        {!!opcoes.planos.length && (
          <optgroup label="Planos">
            {opcoes.planos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}: {formatBRL(o.preco)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <div className="field-description" style={{ marginTop: 6 }}>
        Copia o valor para o Investimento. Mudar o preço no site depois não altera a proposta.
      </div>
    </div>
  )
}
