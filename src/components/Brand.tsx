// Desenhos da marca (de public/brand), em componentes para herdar a cor do
// texto via currentColor. Usados no site e no admin.
import type { SVGProps } from 'react'

export function LogoPaths() {
  return (
    <>
      <path d="M734.39,0h-90.77v123.77h115.53V49.51h-24.75V0ZM726.15,90.77h-49.51s0-57.76,0-57.76h24.75v41.26h24.77v16.5Z" />
      <polygon points="486.85 0 486.86 123.77 519.86 123.77 519.85 33.01 544.61 33.01 544.62 123.77 577.63 123.77 577.61 33.01 602.37 33.01 602.38 123.77 635.39 123.77 635.37 0 486.85 0" />
      <polygon points="288.81 41.35 288.81 41.35 288.8 0 255.8 0 255.81 41.35 231.05 41.35 231.04 0 198.03 0 198.05 41.35 198.03 41.35 198.03 74.3 198.05 74.3 226.95 74.3 226.95 123.77 259.9 123.77 259.9 74.3 288.81 74.3 288.81 74.3 288.81 57.09 288.81 41.35" />
      <path d="M387.83,0v123.77h90.78V0h-90.78ZM420.85,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z" />
      <path d="M99.01,0v123.77h90.78V0h-90.78ZM132.03,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z" />
      <path d="M858.16,0h-90.77v123.77h90.78V0ZM800.41,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z" />
      <polygon points="297.06 123.77 379.58 123.77 379.58 90.77 330.07 90.76 330.07 33.01 379.58 33.01 379.58 0 297.06 0 297.06 123.77" />
      <polygon points="57.76 0 57.76 90.77 33 90.77 33 74.27 0 74.27 0 123.77 90.76 123.77 90.76 74.27 90.75 0 57.76 0" />
    </>
  )
}

/** Wordmark JOYCOMBO. A cor vem de `color` (currentColor). */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 858.17 123.77" fill="currentColor" role="img" aria-label="Joycombo" {...props}>
      <LogoPaths />
    </svg>
  )
}

/** A nave (o Y do logo girado), no viewBox 300x300 do simbolo. */
export function SymbolShip(props: SVGProps<SVGPolygonElement>) {
  return (
    <polygon
      points="188.19 146.5 240.27 94.42 205.57 59.73 153.5 111.81 123.06 81.37 123.06 81.37 104.85 99.58 88.37 116.06 88.37 116.07 44.85 159.6 79.59 194.34 123.11 150.8 149.18 176.87 105.65 220.41 140.4 255.16 183.92 211.61 183.93 211.63 218.63 176.94 218.61 176.92 188.19 146.5"
      {...props}
    />
  )
}

/** Simbolo: nave dentro do circulo. Circulo no verde, nave em preto. */
export function BrandSymbol({ title = 'Joycombo', ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={title} {...props}>
      <circle cx="150" cy="150" r="150" fill="var(--color-accent)" />
      <SymbolShip fill="var(--color-black)" />
    </svg>
  )
}

// Contorno da nave do jogo (public/brand/joycombo-nave.svg), com o bico
// apontando para a esquerda. Coordenadas centralizadas em (0,0).
export const SHIP_POINTS: [number, number][] = (
  [
    [83.32, 50.72], [9.67, 50.72], [9.67, 99.79], [83.32, 99.79], [83.32, 142.83],
    [132.39, 142.83], [132.39, 142.82], [193.95, 142.82], [193.95, 93.69], [132.39, 93.7],
    [132.39, 56.83], [193.95, 56.82], [193.95, 7.68], [132.39, 7.7], [83.32, 7.68],
  ] as [number, number][]
).map(([x, y]) => [x - 101.81, y - 75.25])
