// Datas dos orcamentos, sempre no fuso de Sao Paulo.

const TZ = 'America/Sao_Paulo'

/** "2026-10-12" no fuso de Sao Paulo. */
function ymd(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** Fim do dia (Sao Paulo) da data + N dias, em ISO. */
export function dataExpiracao(data: string | Date, dias: number | null | undefined): string {
  const [y, m, d] = ymd(new Date(data)).split('-').map(Number)
  const alvo = new Date(Date.UTC(y, m - 1, d + (typeof dias === 'number' ? dias : 0)))
  return new Date(`${alvo.toISOString().slice(0, 10)}T23:59:59.999-03:00`).toISOString()
}

export function expirou(expiracao: string | null | undefined, agora = new Date()): boolean {
  return Boolean(expiracao) && agora.getTime() > new Date(expiracao as string).getTime()
}

/** 12/10/2026 */
export function formatData(data: string | Date | null | undefined): string {
  if (!data) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(data))
}
