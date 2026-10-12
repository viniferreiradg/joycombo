import type { Access } from 'payload'

// Tudo do modulo de orcamentos e so para quem esta logado no painel.
// A pagina publica do orcamento le pela Local API (overrideAccess).

export const logado: Access = ({ req }) => Boolean(req.user)

export const soLogado = {
  read: logado,
  create: logado,
  update: logado,
  delete: logado,
}

export const grupoOrcamentos = 'Orçamentos'

export const rowLabel = { components: { RowLabel: '@/components/orcamentos/admin/RowLabel' } }
