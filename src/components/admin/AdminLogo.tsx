// Marca do Joycombo no admin, no lugar do logo do Payload. O wordmark usa
// currentColor para seguir o tema claro/escuro; o simbolo mantem as cores
// da marca (verde com a nave preta), que funcionam nos dois temas.
import { LogoPaths, SymbolShip } from '@/components/Brand'

export function AdminLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 858.17 123.77"
      fill="currentColor"
      role="img"
      aria-label="Joycombo"
      style={{ height: 28, width: 'auto', display: 'block' }}
    >
      <LogoPaths />
    </svg>
  )
}

export function AdminIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      role="img"
      aria-label="Joycombo"
      style={{ height: '100%', width: '100%', maxHeight: 28, display: 'block' }}
    >
      <circle cx="150" cy="150" r="150" fill="#DCFF01" />
      <SymbolShip fill="#000" />
    </svg>
  )
}

export default AdminLogo
