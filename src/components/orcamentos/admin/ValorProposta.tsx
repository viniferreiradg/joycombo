'use client'

import { useEffect, useRef } from 'react'
import { NumberField, useConfig, useField, useFormFields } from '@payloadcms/ui'
import type { NumberFieldClientProps } from 'payload'

// Campo Valor da proposta no orcamento: ao escolher (ou trocar) a proposta da
// linha, copia o investimento dela para o Valor na hora. Depois o Valor e
// livre: editar aqui muda so este orcamento.
export default function ValorProposta(props: NumberFieldClientProps) {
  const { path } = props
  const base = path.slice(0, path.lastIndexOf('.'))
  const proposta = useFormFields(([fields]) => fields[`${base}.proposta`]?.value as number | string | undefined)
  const { setValue } = useField<number>({ path })
  const {
    config: { routes },
  } = useConfig()
  const anterior = useRef(proposta)

  useEffect(() => {
    // so quando a proposta muda nesta tela (nao ao abrir o orcamento)
    if (anterior.current === proposta) return
    anterior.current = proposta
    if (!proposta) return
    fetch(`${routes.api}/propostas/${proposta}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (typeof p?.investimento === 'number') setValue(p.investimento)
      })
      .catch(() => {})
  }, [proposta, routes.api, setValue])

  return <NumberField {...props} />
}
