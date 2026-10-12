// Regras das Propostas usadas no painel, na pagina e no PDF.
// Sem imports de servidor: roda tambem no navegador.

export type ItemSprint = { nome?: string | null; dias?: number | null }
export type Sprint = {
  nome?: string | null
  descricao?: string | null
  itens?: ItemSprint[] | null
  entregaIcone?: string | null
  entregaTexto?: string | null
}

export const ICONES_ENTREGA = [
  { label: 'Documento', value: 'documento' },
  { label: 'Fluxo', value: 'fluxo' },
  { label: 'Monitor', value: 'monitor' },
  { label: 'Paleta', value: 'paleta' },
  { label: 'Pasta', value: 'pasta' },
  { label: 'Publicação', value: 'foguete' },
  { label: 'Check', value: 'check' },
]

export const TEXTO_SPRINTS_PADRAO = 'Cada sprint reúne atividades e uma entrega para validação antes da próxima etapa.'

const num = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)

/** Prazo total: soma dos dias de todos os itens de todos os sprints. */
export function prazoTotal(sprints: Sprint[] | null | undefined): number {
  return (sprints || []).reduce((acc, s) => acc + (s.itens || []).reduce((a, i) => a + (num(i.dias) ? i.dias : 0), 0), 0)
}

/** "1 dia", "15 dias" */
export function formatDias(dias: number | null | undefined): string {
  if (!num(dias)) return ''
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
}
