'use client'

import type { DefaultCellComponentProps } from 'payload'

export default function ExpiradoCell({ cellData }: DefaultCellComponentProps) {
  return cellData ? <span style={{ color: 'var(--theme-error-500)', fontWeight: 600 }}>Expirado</span> : <span>—</span>
}
