// Cabecalho padrao das secoes: etiqueta, titulo curto e texto de apoio.
// `tone` acompanha o fundo da secao (o texto de apoio usa o cinza certo).
type Props = {
  kicker?: string
  title: string
  intro?: string
  tone?: 'light' | 'dark'
  className?: string
  kickerClassName?: string
}

export default function SectionHeading({ kicker, title, intro, tone = 'light', className = '', kickerClassName = '' }: Props) {
  return (
    <div className={`mb-10 flex flex-col gap-4 md:mb-14 ${className}`}>
      {kicker && <span className={`kicker self-start ${kickerClassName}`}>{kicker}</span>}
      <h2 className="title max-w-4xl">{title}</h2>
      {intro && <p className={`max-w-2xl text-lg ${tone === 'dark' ? 'text-muted-dark' : 'text-muted-light'}`}>{intro}</p>}
    </div>
  )
}
