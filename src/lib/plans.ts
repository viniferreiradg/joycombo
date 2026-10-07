// Monta os dados prontos da tabela de precos a partir do CMS: soma dos
// avulsos ("De"), economia e quais servicos cada plano inclui.

export type PlanTab = 'site' | 'marca'

export type ServiceDoc = {
  id: number | string
  name: string
  shortName?: string | null
  price?: number | null
  deadlineDays?: number | null
  includes?: { text: string }[] | null
}

type PlanDoc = {
  id: number | string
  name: string
  services?: (ServiceDoc | number | string)[] | null
  price?: number | null
  deadlineDays?: number | null
  whatsappMessage?: string | null
  tabs?: PlanTab[] | null
  highlight?: boolean | null
  highlightLabel?: string | null
}

/** Servico avulso como aparece dentro dos cards de plano. */
export type ServiceView = { id: string; label: string; items: string[] }

export type PlanView = {
  id: string
  name: string
  /** null = sob consulta */
  price: number | null
  compareAt: number | null
  savings: number | null
  deadlineDays: number | null
  tabs: PlanTab[]
  highlight: boolean
  highlightLabel: string
  whatsappMessage: string
  serviceIds: string[]
}

const hasPrice = (v: number | null | undefined): v is number => typeof v === 'number' && !Number.isNaN(v)

export function toServiceView(s: ServiceDoc): ServiceView {
  return {
    id: String(s.id),
    label: s.shortName || s.name,
    items: (s.includes || []).map((i) => i.text).filter(Boolean),
  }
}

export function toPlanView(plan: PlanDoc): PlanView {
  const services = (plan.services || []).filter((s): s is ServiceDoc => typeof s === 'object' && s !== null)
  const price = hasPrice(plan.price) ? plan.price : null
  // "De" so faz sentido se todos os servicos tem preco de tabela.
  // Centavos para nao acumular erro de ponto flutuante (2981.8 e nao 2981.7999)
  const allPriced = services.length > 1 && services.every((s) => hasPrice(s.price))
  const sumCents = allPriced ? services.reduce((acc, s) => acc + Math.round((s.price as number) * 100), 0) : 0
  const isCombo = price !== null && allPriced && sumCents > Math.round(price * 100)

  return {
    id: String(plan.id),
    name: plan.name,
    price,
    compareAt: isCombo ? sumCents / 100 : null,
    savings: isCombo ? (sumCents - Math.round(price! * 100)) / 100 : null,
    deadlineDays: plan.deadlineDays ?? null,
    tabs: plan.tabs || [],
    highlight: Boolean(plan.highlight),
    highlightLabel: plan.highlightLabel || '',
    whatsappMessage: plan.whatsappMessage || `Oi! Vim pelo site e tenho interesse no plano ${plan.name}.`,
    serviceIds: services.map((s) => String(s.id)),
  }
}

/**
 * Ordem dos servicos numa aba: primeiro o que aparece em mais planos da aba
 * (na aba Site: Site, Marca, Kit Insta, Nome; na aba Marca: Marca, Kit
 * Insta, Site, Nome). Empate mantem a ordem do admin.
 */
export function servicesForTab(services: ServiceView[], plans: PlanView[]): ServiceView[] {
  const count = (id: string) => plans.filter((p) => p.serviceIds.includes(id)).length
  return services
    .map((s, i) => ({ s, i, n: count(s.id) }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.s)
}
