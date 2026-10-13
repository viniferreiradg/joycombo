// Download com o nome certo. Os arquivos ficam em outro endereco (Vercel Blob),
// onde o atributo download e ignorado: busca o arquivo e salva daqui. Se a busca
// falhar, abre o endereco direto (o navegador baixa ou mostra o arquivo).

export function salvar(blob: Blob, nome: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function baixarArquivo(url: string, nome: string) {
  try {
    const r = await fetch(url)
    if (!r.ok) throw new Error(String(r.status))
    salvar(await r.blob(), nome)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}
