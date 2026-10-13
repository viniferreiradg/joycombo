'use client'

import { useState, useSyncExternalStore } from 'react'
import { Button, useFormFields } from '@payloadcms/ui'

const nada = () => () => {}

// Link do manual, com Copiar e Abrir (aparece depois do primeiro "Salvar")
export default function LinkManual() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)
  const origem = useSyncExternalStore(nada, () => window.location.origin, () => '')
  const [copiado, setCopiado] = useState(false)

  if (!slug) {
    return <p style={{ color: 'var(--theme-elevation-500)', margin: '0 0 24px' }}>O link do manual aparece depois de salvar.</p>
  }

  const url = `${origem}/manual/${slug}`
  const copiar = async () => {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="field-label">Link do cliente</div>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        style={{
          width: '100%',
          fontSize: 13,
          padding: '8px 10px',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button buttonStyle="secondary" size="small" margin={false} onClick={copiar}>
          {copiado ? 'Copiado!' : 'Copiar'}
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn--style-secondary btn--size-small btn--withoutPopup" style={{ margin: 0 }}>
          <span className="btn__content">
            <span className="btn__label">Abrir</span>
          </span>
        </a>
      </div>
      {status !== 'publicado' ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: 12, margin: '6px 0 0' }}>Rascunho: o cliente ainda não consegue abrir.</p>
      ) : null}
    </div>
  )
}
