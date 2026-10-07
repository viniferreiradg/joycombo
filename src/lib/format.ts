const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 1590.9 -> "R$ 1.590,90" */
export function formatBRL(value: number): string {
  return brl.format(value).replace(/ /g, ' ')
}

/** Troca {chave} pelos valores. Chave sem valor fica vazia. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

/** Quebra um texto do admin em paragrafos (linha em branco separa). */
export function paragraphs(text: string | null | undefined): string[] {
  return (text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
