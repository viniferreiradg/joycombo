'use client'

import type { ComponentProps } from 'react'
import { useSite } from '@/components/SiteContext'
import { trackPlan, trackWhatsApp } from '@/lib/tracking'
import { whatsappUrl } from '@/lib/whatsapp'

type Props = Omit<ComponentProps<'a'>, 'href'> & {
  message: string
  /** De onde veio o clique (hero, plano, flutuante...). Vai nos eventos. */
  origin: string
  /** Nome do plano, quando o clique e num card de plano. */
  plan?: string
}

// Todo CTA de WhatsApp do site passa por aqui: monta o link wa.me com a
// mensagem do contexto e registra a conversao antes de abrir.
export default function WhatsAppLink({ message, origin, plan, onClick, ...props }: Props) {
  const { whatsapp } = useSite()
  return (
    <a
      {...props}
      href={whatsappUrl(whatsapp, message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        trackWhatsApp(origin, plan ? { plano: plan } : {})
        if (plan) trackPlan(plan, { origem: origin })
        onClick?.(e)
      }}
    />
  )
}
