'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { type MarcasData, ligarPngs } from '@/lib/manuais/marcas'

type Arquivo = { id: string | number; filename: string; url: string }

// Mostra, logo abaixo dos PNGs, quantas versoes ja tem PNG, quais faltam e os
// PNGs com nome que nao combina com nenhum SVG
export default function ConferirPngs() {
  const valor = useFormFields(([fields]) => fields.pngsMarcas?.value as unknown[] | null | undefined)
  const marcas = useFormFields(([fields]) => fields.marcas?.value as MarcasData | null | undefined)
  const ids = useMemo(
    () =>
      (valor || [])
        .map((v) => (v && typeof v === 'object' ? (v as { id?: string | number }).id : (v as string | number)))
        .filter((v): v is string | number => v !== undefined && v !== null && v !== ''),
    [valor],
  )
  const chave = ids.join(',')
  const [arquivos, setArquivos] = useState<{ chave: string; lista: Arquivo[] } | null>(null)

  useEffect(() => {
    if (!chave) return
    const controle = new AbortController()
    fetch(`/api/manual-assets?where[id][in]=${chave}&depth=0&limit=500`, { credentials: 'include', signal: controle.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((r: { docs?: Arquivo[] } | null) => r?.docs && setArquivos({ chave, lista: r.docs }))
      .catch(() => undefined)
    return () => controle.abort()
  }, [chave])

  const versoes = marcas?.versoes || []
  if (!versoes.length) return null
  const lista = chave && arquivos?.chave === chave ? arquivos.lista : []
  if (chave && arquivos?.chave !== chave) return null
  const { porVersao, soltos } = ligarPngs(versoes, lista)
  const faltam = versoes.filter((v) => !porVersao.has(v.id)).map((v) => v.arquivo)

  const caixa: React.CSSProperties = { fontSize: 13, lineHeight: 1.5, margin: '-8px 0 24px', padding: '10px 14px', border: '1px solid var(--theme-elevation-150)' }
  return (
    <div style={caixa}>
      <strong>
        {porVersao.size} de {versoes.length} versões com PNG.
      </strong>
      {faltam.length ? (
        <p style={{ margin: '6px 0 0', color: 'var(--theme-elevation-600)' }}>
          Sem PNG (baixam só em SVG): {faltam.join(', ')}
        </p>
      ) : null}
      {soltos.length ? (
        <p style={{ margin: '6px 0 0', color: 'var(--theme-error-500)' }}>
          Estes PNGs não combinam com nenhuma versão (o nome precisa ser igual ao do SVG): {soltos.join(', ')}
        </p>
      ) : null}
    </div>
  )
}
