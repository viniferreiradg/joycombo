import { getLanding, getPageData, getSeo, getSettings } from '@/lib/data'
import Header from '@/components/sections/Header'
import Hero from '@/components/sections/Hero'
import BeforeAfter from '@/components/sections/BeforeAfter'
import ClientsStrip from '@/components/sections/ClientsStrip'
import Audience from '@/components/sections/Audience'
import Portfolio from '@/components/sections/Portfolio'
import Pricing from '@/components/sections/Pricing'
import Testimonials from '@/components/sections/Testimonials'
import About from '@/components/sections/About'
import Faq from '@/components/sections/Faq'
import FinalCta from '@/components/sections/FinalCta'
import Footer from '@/components/sections/Footer'
import GameSection from '@/components/game/GameSection'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import { formatBRL } from '@/lib/format'

// Revalida a cada 60 s em background; cada "Salvar" no admin tambem
// revalida na hora (rota /revalidate)
export const revalidate = 60

export default async function Home() {
  const [landing, settings, seo, data] = await Promise.all([getLanding(), getSettings(), getSeo(), getPageData()])
  const { plans, services, projects, cases, clients, testimonials, faqs } = data
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://joycombo.com.br'
  const prices = plans.map((p) => p.price).filter((p): p is number => p !== null)
  const hasTracking = Boolean(settings.tracking.metaPixelId || settings.tracking.ga4Id || settings.tracking.googleAdsId)

  // Dados estruturados: o estudio (com os planos como ofertas) e o FAQ
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: seo.businessName,
      url: serverUrl,
      description: seo.description,
      image: seo.ogImage?.url || `${serverUrl}/og-joycombo.png`,
      logo: `${serverUrl}/favicon/web-app-manifest-512x512.png`,
      telephone: `+${settings.whatsapp}`,
      ...(settings.email && { email: settings.email }),
      address: { '@type': 'PostalAddress', addressLocality: settings.city, addressRegion: settings.region, addressCountry: 'BR' },
      areaServed: 'BR',
      founder: { '@type': 'Person', name: seo.founder },
      sameAs: settings.instagram ? [`https://instagram.com/${settings.instagram}`] : [],
      priceRange: prices.length ? `${formatBRL(Math.min(...prices))} a ${formatBRL(Math.max(...prices))}` : undefined,
      makesOffer: plans.map((p) => ({
        '@type': 'Offer',
        name: p.name,
        ...(p.price !== null && { price: p.price.toFixed(2), priceCurrency: 'BRL' }),
      })),
    },
    ...(faqs.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          },
        ]
      : []),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Header message={landing.heroWhatsMessage} />
      <main>
        <Hero
          line={landing.heroLine}
          video={landing.heroVideo}
          videoMobile={landing.heroVideoMobile}
          poster={landing.heroPoster}
          posterMobile={landing.heroPosterMobile}
        />
        {cases.length > 0 && <BeforeAfter kicker={landing.casesKicker} title={landing.casesTitle} intro={landing.casesIntro} cases={cases} />}
        <ClientsStrip clients={clients} />
        <Audience landing={landing} />
        <Pricing plans={plans} services={services} texts={landing} />
        <Portfolio
          texts={{
            kicker: landing.portfolioKicker,
            title: landing.portfolioTitle,
            intro: landing.portfolioIntro,
            tabAll: landing.portfolioTabAll,
            tabSites: landing.portfolioTabSites,
            tabBrands: landing.portfolioTabBrands,
            empty: landing.portfolioEmpty,
          }}
          projects={projects}
        />
        <Testimonials kicker={landing.testimonialsKicker} title={landing.testimonialsTitle} items={testimonials} />
        <About landing={landing} />
        <Faq kicker={landing.faqKicker} title={landing.faqTitle} items={faqs} />
        <FinalCta landing={landing} />
        {landing.gameEnabled && (
          <GameSection
            texts={{
              pointsPerHit: landing.gamePointsPerHit,
              pointsGoal: landing.gamePointsGoal,
              couponCode: landing.gameCouponCode,
              couponText: landing.gameCouponText,
              couponCta: landing.gameCouponCta,
              couponMessage: landing.gameCouponMessage,
            }}
          />
        )}
      </main>
      <Footer settings={settings} tagline={landing.footerTagline} whatsMessage={landing.heroWhatsMessage} showCookies={hasTracking} />
      <FloatingWhatsApp message={landing.heroWhatsMessage} />
    </>
  )
}
