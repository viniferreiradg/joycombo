import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// www.joycombo.com.br -> joycombo.com.br: um dominio so, para o Google nao
// ver dois sites com o mesmo conteudo. Mantem a query (UTM, gclid, fbclid).
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const { pathname, search } = request.nextUrl
    return NextResponse.redirect(`https://${host.slice(4)}${pathname}${search}`, 301)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|admin|_next|favicon|brand|media).*)'],
}
