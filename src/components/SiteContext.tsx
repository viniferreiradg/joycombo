'use client'

import { createContext, useContext, type ReactNode } from 'react'

type Site = { whatsapp: string }

const SiteContext = createContext<Site>({ whatsapp: '' })

// Dados globais que os componentes de cliente precisam (o numero do
// WhatsApp vem das Configuracoes do admin).
export function SiteProvider({ value, children }: { value: Site; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  return useContext(SiteContext)
}
