'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const noop = () => () => {}
// Dentro do iframe do admin devolve a origem do site; fora dele, null
const getOrigin = () => (window.self !== window.top ? window.location.origin : null)

// Dentro do Live Preview do admin, recarrega a pagina a cada "Salvar".
// Fora do iframe do admin nao faz nada.
export default function LivePreviewListener() {
  const router = useRouter()
  const origin = useSyncExternalStore(noop, getOrigin, () => null)

  if (!origin) return null
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
}
