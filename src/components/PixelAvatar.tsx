// Avatar pixel gerado a partir do nome (estilo identicon): grade 5x5
// espelhada, sempre igual para o mesmo nome. Usado quando nao ha foto.
function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export default function PixelAvatar({ name, className = '' }: { name: string; className?: string }) {
  const h = hash(name.trim().toLowerCase())
  const cells: [number, number][] = []
  // 3 colunas sorteadas (15 bits) e espelhadas: 0 1 2 1 0
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if ((h >> (y * 3 + x)) & 1) {
        cells.push([x, y])
        if (x < 2) cells.push([4 - x, y])
      }
    }
  }

  return (
    <svg viewBox="-1 -1 7 7" className={className} role="img" aria-label={name} shapeRendering="crispEdges">
      <rect x="-1" y="-1" width="7" height="7" fill="var(--color-accent)" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--color-black)" />
      ))}
    </svg>
  )
}
