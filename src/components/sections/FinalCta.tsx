import { Whatsapp } from 'pixelarticons/react'
import WhatsAppLink from '@/components/WhatsAppLink'
import LeadForm from '@/components/sections/LeadForm'
import type { Landing } from '@/lib/data'

export default function FinalCta({ landing }: { landing: Landing }) {
  return (
    <section id="contato" className="section on-light bg-accent text-black">
      <div className="container-site grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="title mb-6">{landing.ctaTitle}</h2>
          <p className="mb-8 max-w-lg text-lg">{landing.ctaText}</p>
          <WhatsAppLink message={landing.ctaWhatsMessage} origin="cta-final" className="btn btn-dark btn-lg">
            <Whatsapp aria-hidden />
            <span>{landing.ctaButtonLabel}</span>
          </WhatsAppLink>
        </div>
        <LeadForm
          title={landing.formTitle}
          text={landing.formText}
          buttonLabel={landing.formButtonLabel}
          messageTemplate={landing.formMessage}
        />
      </div>
    </section>
  )
}
