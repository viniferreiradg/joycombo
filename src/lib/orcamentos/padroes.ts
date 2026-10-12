import { randomBytes } from 'crypto'
import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, PayloadRequest } from 'payload'
import { landingDefaults } from '@/content/defaults'
import { dataExpiracao } from './datas'

// Padroes e calculos dos orcamentos. So LEEM o site (Landing page) e as
// bibliotecas do modulo: o orcamento novo ja vem com tudo copiado.

type Linha = Record<string, unknown>
const num = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)
const idDe = (v: unknown) => (v && typeof v === 'object' ? (v as Linha).id : v)

// defaultValue do Payload aceita funcao async; o tipo declarado nao, dai o cast
type PadraoAsync = (args: { req: PayloadRequest }) => Promise<unknown>
const padrao = (fn: PadraoAsync) => fn as unknown as undefined

/** Todos os cases, na ordem da biblioteca. */
export const padraoCases = padrao(async ({ req }) => {
  const res = await req.payload
    .find({ collection: 'orcamento-cases', sort: '_order', limit: 100, depth: 0, req, overrideAccess: true })
    .catch(() => null)
  return (res?.docs || []).map((d) => d.id)
})

/** Todas as propostas, na ordem da biblioteca, com o investimento copiado para o Valor. */
export const padraoPropostas = padrao(async ({ req }) => {
  const res = await req.payload
    .find({ collection: 'propostas', sort: '_order', limit: 100, depth: 0, req, overrideAccess: true })
    .catch(() => null)
  return (res?.docs || []).map((d) => ({ proposta: d.id, valor: num(d.investimento) ? d.investimento : null }))
})

/** Texto de parcelamento: a frase da Landing page > Planos. */
export const padraoParcelamento = padrao(async ({ req }) => {
  const landing = await req.payload.findGlobal({ slug: 'landing', depth: 0, req, overrideAccess: true }).catch(() => null)
  return (landing?.paymentNote as string) || landingDefaults.paymentNote
})

/** Foto do Sobre para o PDF: a das Configuracoes de orcamento. */
export const padraoFotoPdf = padrao(async ({ req }) => {
  const config = await req.payload.findGlobal({ slug: 'orcamento-config', depth: 0, req, overrideAccess: true }).catch(() => null)
  return idDe(config?.fotoSobrePdf) ?? null
})

/**
 * Antes da validacao: proposta adicionada sem Valor recebe o investimento
 * dela (copia). Valor ja preenchido nunca e trocado.
 */
export const copiarValores: CollectionBeforeValidateHook = async ({ data, req }) => {
  const linhas = (Array.isArray(data?.propostas) ? data.propostas : []) as Linha[]
  for (const linha of linhas) {
    if (num(linha.valor) || !linha.proposta) continue
    const proposta = await req.payload
      .findByID({ collection: 'propostas', id: idDe(linha.proposta) as number, depth: 0, req, overrideAccess: true })
      .catch(() => null)
    if (proposta && num(proposta.investimento)) linha.valor = proposta.investimento
  }
  return data
}

const ALFABETO = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Token do link publico: 10 caracteres aleatorios, sem letras ambiguas (l, I, O, 0, 1). */
export function novoToken(tamanho = 10): string {
  let out = ''
  while (out.length < tamanho) {
    for (const b of randomBytes(tamanho * 2)) {
      // descarta o excesso para nao favorecer nenhuma letra
      if (b < 256 - (256 % ALFABETO.length)) out += ALFABETO[b % ALFABETO.length]
      if (out.length === tamanho) break
    }
  }
  return out
}

/** Antes de salvar: token no orcamento novo e data de expiracao sempre recalculada. */
export const calcularOrcamento: CollectionBeforeChangeHook = async ({ data, operation, originalDoc }) => {
  if (operation === 'create') data.token = novoToken()
  const doc = { ...originalDoc, ...data }
  data.dataExpiracao = dataExpiracao((doc.data as string) || new Date(), doc.validadeDias as number)
  return data
}

/** Copia para "Duplicar orcamento": sem id, datas, token e ids das linhas. */
export function copiaParaDuplicar(doc: Linha): Linha {
  const semIds = <T,>(v: T): T => {
    if (Array.isArray(v)) return v.map(semIds) as T
    if (v && typeof v === 'object') {
      const out: Linha = {}
      for (const [k, x] of Object.entries(v)) if (k !== 'id') out[k] = semIds(x)
      return out as T
    }
    return v
  }
  const resto = { ...doc }
  for (const k of ['id', 'createdAt', 'updatedAt', 'token', 'dataExpiracao', 'expirado']) delete resto[k]
  return semIds(resto)
}
