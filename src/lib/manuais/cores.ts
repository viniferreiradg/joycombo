// Conversoes de cor da paleta do manual. RGB sai exato do hex; CMYK e so uma
// sugestao (a conversao ingenua difere do CMYK real de impressao, por isso o
// painel tem um campo para sobrescrever).

export type Rgb = [number, number, number]

export function hexValido(hex: unknown): hex is string {
  return typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex.trim())
}

export function hexParaRgb(hex: string): Rgb {
  const h = hex.trim().replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb
}

export function rgbParaCmyk([r, g, b]: Rgb): [number, number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const k = 1 - Math.max(R, G, B)
  if (k >= 1) return [0, 0, 0, 100]
  const c = (1 - R - k) / (1 - k)
  const m = (1 - G - k) / (1 - k)
  const y = (1 - B - k) / (1 - k)
  return [c, m, y, k].map((v) => Math.round(v * 100)) as [number, number, number, number]
}

export const formatRgb = (rgb: Rgb) => rgb.join(' / ')
export const formatCmyk = (cmyk: number[]) => cmyk.join(' / ')

/** Luminancia relativa (0 a 1), para escolher texto claro ou escuro sobre a cor */
export function luminancia(hex: string): number {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
