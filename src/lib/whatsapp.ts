/** Link wa.me com a mensagem pronta. O numero vem das Configuracoes. */
export function whatsappUrl(number: string, message: string): string {
  const digits = (number || '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
