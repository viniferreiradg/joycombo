'use client'

import { useState } from 'react'
import { Button, toast, useConfig, useDocumentInfo, useFormModified } from '@payloadcms/ui'

// "Duplicar orcamento": copia tudo para um orcamento novo (link novo,
// rascunho, data de hoje). O link do original continua funcionando.
export default function Duplicar() {
  const { id } = useDocumentInfo()
  const modificado = useFormModified()
  const {
    config: { routes },
  } = useConfig()
  const [ocupado, setOcupado] = useState(false)

  if (!id) return null

  const duplicar = async () => {
    if (modificado && !window.confirm('Há alterações não salvas. A cópia é feita do que está salvo. Continuar?')) return
    setOcupado(true)
    try {
      const res = await fetch(`${routes.api}/orcamentos/${id}/duplicar`, { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao duplicar')
      window.location.href = `${routes.admin}/collections/orcamentos/${json.id}`
    } catch (e) {
      toast.error((e as Error).message)
      setOcupado(false)
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Button buttonStyle="secondary" size="small" margin={false} onClick={duplicar} disabled={ocupado}>
        {ocupado ? 'Duplicando…' : 'Duplicar orçamento'}
      </Button>
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: 12, margin: '6px 0 0' }}>
        Para fazer a v2 (com outro valor) ou reaproveitar este orçamento.
      </p>
    </div>
  )
}
