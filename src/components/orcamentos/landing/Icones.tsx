import { Brush, Check, FileText, Folder, GitBranch, Monitor, Upload } from 'pixelarticons/react'

const ICONES = {
  documento: FileText,
  fluxo: GitBranch,
  monitor: Monitor,
  paleta: Brush,
  pasta: Folder,
  // valor 'foguete' guardado nas propostas; o icone e o de publicar (upload)
  foguete: Upload,
  check: Check,
} as const

export function IconeEntrega({ nome, className }: { nome: string; className?: string }) {
  const Icone = ICONES[nome as keyof typeof ICONES] || FileText
  return <Icone className={className} aria-hidden />
}
