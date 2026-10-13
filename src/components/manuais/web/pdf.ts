// PDF do manual montado no navegador, com download direto (sem a janela de
// impressao): cada pagina 16:9 e copiada para fora da tela em 1920x1080 (o
// tamanho de desenho, qualquer que seja a tela), vira uma imagem com o dobro
// de resolucao e o jsPDF junta tudo. Os links internos (sumario, "Voltar ao
// sumario") e externos sao recolocados por cima, na mesma posicao.

const W = 1920
const H = 1080
// pt do PDF (1px = 0,75pt): pagina de 1440 x 810pt
const PT = 0.75

async function imagensProntas(raiz: ParentNode) {
  const imagens = Array.from(raiz.querySelectorAll<HTMLImageElement>('img'))
  imagens.forEach((img) => {
    img.loading = 'eager'
  })
  await Promise.all(imagens.map((img) => (img.complete && img.naturalWidth ? Promise.resolve() : img.decode().catch(() => undefined))))
}

export async function gerarPdf(arquivo: string, aoAvancar: (feitas: number, total: number) => void) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
  await document.fonts.ready

  const paginas = Array.from(document.querySelectorAll<HTMLElement>('.mn-conteudo .mn-pagina'))
  const indice = new Map(paginas.map((p, i) => [p.id, i + 1]))
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [W * PT, H * PT], compress: true })

  // palco fora da tela, fora de .mn-conteudo (as regras de celular nao valem aqui)
  const palco = document.createElement('div')
  palco.className = 'mn-palco-pdf'
  palco.style.cssText = `position:fixed;left:-${W * 2}px;top:0;width:${W}px;height:${H}px;overflow:hidden;pointer-events:none`
  document.body.appendChild(palco)

  try {
    for (const [i, original] of paginas.entries()) {
      aoAvancar(i, paginas.length)
      const pagina = original.cloneNode(true) as HTMLElement
      pagina.removeAttribute('id')
      Object.assign(pagina.style, { width: `${W}px`, height: `${H}px`, maxWidth: 'none', aspectRatio: 'auto', margin: '0', boxShadow: 'none' })
      palco.replaceChildren(pagina)
      await imagensProntas(pagina)

      const foto = await toJpeg(pagina, {
        quality: 0.9,
        pixelRatio: 2,
        width: W,
        height: H,
        backgroundColor: getComputedStyle(pagina).backgroundColor || '#ffffff',
        // as imagens sao /_next/image?url=...: sem a query no cache, todas
        // viravam a primeira (a da capa)
        includeQueryParams: true,
      })
      if (i > 0) pdf.addPage([W * PT, H * PT], 'landscape')
      pdf.addImage(foto, 'JPEG', 0, 0, W * PT, H * PT, undefined, 'FAST')

      // links na mesma posicao da copia (que ja esta em 1920px)
      const caixa = pagina.getBoundingClientRect()
      for (const a of Array.from(pagina.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
        const r = a.getBoundingClientRect()
        if (!r.width || !r.height) continue
        const [x, y, w, h] = [r.left - caixa.left, r.top - caixa.top, r.width, r.height].map((v) => v * PT)
        const href = a.getAttribute('href') || ''
        if (href.startsWith('#')) {
          const destino = indice.get(href.slice(1))
          if (destino) pdf.link(x, y, w, h, { pageNumber: destino })
        } else if (/^https?:\/\//.test(href)) {
          pdf.link(x, y, w, h, { url: href })
        }
      }
    }
  } finally {
    palco.remove()
  }

  aoAvancar(paginas.length, paginas.length)
  pdf.save(`${arquivo}.pdf`)
}
