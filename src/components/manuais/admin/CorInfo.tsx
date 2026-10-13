'use client'

import { useFormFields } from '@payloadcms/ui'
import { formatCmyk, formatRgb, hexParaRgb, hexValido, rgbParaCmyk } from '@/lib/manuais/cores'

// Amostra da cor com RGB (exato) e CMYK sugerido, calculados do HEX da linha
export default function CorInfo({ path }: { path: string }) {
  const base = path.replace(/\.info$/, '')
  const hex = useFormFields(([fields]) => fields[`${base}.hex`]?.value as string | undefined)
  const cmyk = useFormFields(([fields]) => fields[`${base}.cmyk`]?.value as string | undefined)

  if (!hexValido(hex)) return null
  const rgb = hexParaRgb(hex)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
      <span style={{ width: 36, height: 36, borderRadius: 4, background: hex, border: '1px solid var(--theme-elevation-150)', flex: 'none' }} />
      <span>
        RGB {formatRgb(rgb)}
        <br />
        CMYK {cmyk?.trim() ? cmyk : `${formatCmyk(rgbParaCmyk(rgb))} (sugestão)`}
      </span>
    </div>
  )
}
