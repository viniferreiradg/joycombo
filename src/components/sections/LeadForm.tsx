'use client'

import { useId, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Whatsapp } from 'pixelarticons/react'
import { useSite } from '@/components/SiteContext'
import { fillTemplate } from '@/lib/format'
import { getAttribution, getPriceVariant, trackLead, trackWhatsApp } from '@/lib/tracking'
import { whatsappUrl } from '@/lib/whatsapp'

type Props = { title: string; text: string; buttonLabel: string; messageTemplate: string }

const SEGMENTS = ['Saúde', 'Beleza e estética', 'Alimentação', 'Moda', 'Consultoria', 'Advocacia', 'Arquitetura', 'Educação', 'Tecnologia', 'Serviços']

// Formulario curto: nome, WhatsApp e segmento. Ao enviar, abre o WhatsApp
// com a mensagem pronta e guarda uma copia no admin (Contatos do formulario).
export default function LeadForm({ title, text, buttonLabel, messageTemplate }: Props) {
  const { whatsapp } = useSite()
  const id = useId()
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    if (!form.reportValidity()) return
    const data = new FormData(form)
    const name = String(data.get('nome') || '').trim()
    const phone = String(data.get('whatsapp') || '').trim()
    const segment = String(data.get('segmento') || '').trim()

    const message = fillTemplate(messageTemplate, { nome: name, segmento: segment || 'outro segmento' })
    const url = whatsappUrl(whatsapp, message)

    // Abre o WhatsApp ainda dentro do clique (senao o navegador bloqueia o pop-up)
    // (sem "noopener" na chamada: com ele o open() sempre retorna null)
    const win = window.open(url, '_blank')
    if (win) win.opener = null
    else window.location.href = url

    trackLead(segment)
    trackWhatsApp('formulario')

    // Copia no admin. keepalive: o envio termina mesmo se a aba trocar
    const a = getAttribution()
    fetch('/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name,
        whatsapp: phone,
        segment,
        website: String(data.get('website') || ''),
        priceVariant: getPriceVariant(),
        ...a,
      }),
    }).catch(() => {})

    setSent(true)
  }

  return (
    <div className="pixel-box bg-white p-6 text-black md:p-8" style={{ ['--p' as string]: '8px' }}>
      <h3 className="title title-sm mb-2">{title}</h3>
      <p className="mb-6 text-muted-light">{text}</p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
        <Field id={`${id}-nome`} label="Nome">
          <input id={`${id}-nome`} name="nome" type="text" required autoComplete="name" maxLength={80} className="input" />
        </Field>
        <Field id={`${id}-whats`} label="WhatsApp">
          <input
            id={`${id}-whats`}
            name="whatsapp"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="(48) 99999-9999"
            pattern="[\d\s\(\)\+\-]{10,20}"
            title="Seu WhatsApp com DDD"
            maxLength={20}
            className="input"
          />
        </Field>
        <Field id={`${id}-seg`} label="Segmento do negócio">
          <input
            id={`${id}-seg`}
            name="segmento"
            type="text"
            required
            list={`${id}-seg-list`}
            placeholder="Ex: estética, advocacia, confeitaria"
            maxLength={80}
            className="input"
          />
          <datalist id={`${id}-seg-list`}>
            {SEGMENTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>

        {/* Honeypot: invisivel para pessoas, robos costumam preencher */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Site
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <button type="submit" className="btn btn-dark w-full">
          <Whatsapp aria-hidden />
          <span>{buttonLabel}</span>
        </button>

        <p className="text-xs text-muted-light" aria-live="polite">
          {sent
            ? 'Pronto! Se o WhatsApp não abriu, toque no botão de novo.'
            : (
                <>
                  Usamos esses dados só pra falar com você. Veja a{' '}
                  <Link href="/politica-de-privacidade" className="underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  .
                </>
              )}
        </p>
      </form>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  )
}
