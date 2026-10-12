'use client'

import { useFormFields } from '@payloadcms/ui'
import { formatDias } from '@/lib/orcamentos/propostas'

const num = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)

// Prazo total somado na hora, enquanto os dias dos itens são editados
// (o valor guardado é recalculado ao salvar)
export default function PrazoTotal() {
  const total = useFormFields(([fields]) => {
    let soma = 0
    for (const [path, field] of Object.entries(fields)) {
      if (/^sprints\.\d+\.itens\.\d+\.dias$/.test(path) && num(field?.value)) soma += field.value
    }
    return soma
  })

  return (
    <div className="field-type" style={{ flex: '1 1 auto' }}>
      <div className="field-label">Prazo total</div>
      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          borderRadius: 'var(--style-radius-s, 4px)',
          background: 'var(--theme-elevation-50)',
          fontWeight: 600,
        }}
      >
        {formatDias(total) || '0 dias'}
      </div>
      <div className="field-description" style={{ marginTop: 6 }}>
        Soma dos dias de todos os itens.
      </div>
    </div>
  )
}
