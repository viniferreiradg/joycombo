import { cache } from 'react'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { landingDefaults, settingsDefaults, withDefaults } from '@/content/defaults'
import { toPlanView, toServiceView, type PlanView, type ServiceDoc, type ServiceView } from '@/lib/plans'

// Leitura do CMS para o site. `cache` evita buscar a mesma global duas vezes
// na mesma renderizacao (layout + pagina). Qualquer falha (banco fora do ar,
// tabela ainda nao criada) cai nos textos padrao, e o site continua de pe.

export type MediaDoc = {
  id: number | string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null } | undefined>
}

export const getClient = cache(() => getPayload({ config }))

export const getSettings = cache(async () => {
  const payload = await getClient()
  const doc = (await payload.findGlobal({ slug: 'site-settings', depth: 1 }).catch(() => null)) as Record<string, unknown> | null
  return {
    ...withDefaults(doc as Partial<typeof settingsDefaults>, settingsDefaults),
    email: (doc?.email as string) || '',
    ogImage: (doc?.ogImage as MediaDoc | null) || null,
    tracking: {
      metaPixelId: (doc?.metaPixelId as string) || '',
      ga4Id: (doc?.ga4Id as string) || '',
      googleAdsId: (doc?.googleAdsId as string) || '',
      adsLabelWhatsapp: (doc?.adsLabelWhatsapp as string) || '',
      adsLabelForm: (doc?.adsLabelForm as string) || '',
    },
    googleSiteVerification: (doc?.googleSiteVerification as string) || '',
  }
})

export const getLanding = cache(async () => {
  const payload = await getClient()
  const doc = (await payload.findGlobal({ slug: 'landing', depth: 1 }).catch(() => null)) as Record<string, unknown> | null
  return {
    ...withDefaults(doc as Partial<typeof landingDefaults>, landingDefaults),
    heroVideo: (doc?.heroVideo as MediaDoc | null) || null,
    heroVideoMobile: (doc?.heroVideoMobile as MediaDoc | null) || null,
    heroPoster: (doc?.heroPoster as MediaDoc | null) || null,
    heroPosterMobile: (doc?.heroPosterMobile as MediaDoc | null) || null,
    aboutPhoto: (doc?.aboutPhoto as MediaDoc | null) || null,
    // Checkbox: false e um valor valido, entao nao passa pelo withDefaults
    gameEnabled: doc?.gameEnabled === undefined || doc?.gameEnabled === null ? landingDefaults.gameEnabled : Boolean(doc.gameEnabled),
  }
})

export type Landing = Awaited<ReturnType<typeof getLanding>>
export type Settings = Awaited<ReturnType<typeof getSettings>>

async function findPublished<T>(collection: 'projects' | 'cases' | 'clients' | 'testimonials' | 'faqs'): Promise<T[]> {
  const payload = await getClient()
  // Depoimentos de exemplo (ficticios) nunca vao para o site publicado
  const where: Where =
    collection === 'testimonials' && process.env.NODE_ENV === 'production'
      ? { and: [{ published: { equals: true } }, { isSample: { not_equals: true } }] }
      : { published: { equals: true } }
  const res = await payload
    .find({ collection, where, sort: '_order', limit: 100, depth: 1 })
    .catch(() => null)
  return (res?.docs as T[]) || []
}

export async function getPageData() {
  const payload = await getClient()
  const [plansRes, servicesRes] = await Promise.all([
    payload.find({ collection: 'plans', where: { published: { equals: true } }, sort: '_order', limit: 50, depth: 1 }).catch(() => null),
    payload.find({ collection: 'services', sort: '_order', limit: 50, depth: 0 }).catch(() => null),
  ])

  const [projects, cases, clients, testimonials, faqs] = await Promise.all([
    findPublished<ProjectDoc>('projects'),
    findPublished<CaseDoc>('cases'),
    findPublished<ClientDoc>('clients'),
    findPublished<TestimonialDoc>('testimonials'),
    findPublished<FaqDoc>('faqs'),
  ])

  const plans: PlanView[] = ((plansRes?.docs as Parameters<typeof toPlanView>[0][]) || []).map(toPlanView)
  const services: ServiceView[] = ((servicesRes?.docs as ServiceDoc[]) || []).map(toServiceView)
  return { plans, services, projects, cases, clients, testimonials, faqs }
}

export type ProjectDoc = {
  id: number | string
  title: string
  summary?: string | null
  coverImage?: MediaDoc | null
  hoverImage?: MediaDoc | null
  partner?: string | null
  url?: string | null
  categories?: string[] | null
}
export type CaseDoc = {
  id: number | string
  client: string
  summary?: string | null
  beforeImage?: MediaDoc | null
  afterImage?: MediaDoc | null
  beforeLabel?: string | null
  afterLabel?: string | null
}
export type ClientDoc = { id: number | string; name: string; logo?: MediaDoc | null }
export type TestimonialDoc = {
  id: number | string
  name: string
  role?: string | null
  text: string
  photo?: MediaDoc | null
}
export type FaqDoc = { id: number | string; question: string; answer: string }
