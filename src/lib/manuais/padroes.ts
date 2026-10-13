// Textos padrao e limites dos manuais de marca.
// Regra de paginacao: cada bloco ocupa exatamente uma pagina 16:9. Os limites
// de caracteres garantem que o texto cabe, entao o numero de paginas (e o
// sumario) e calculado sem medir layout.

export const grupoManuais = 'Manuais de marca'

export const LIMITES = {
  titulo: 40,
  textoBloco: 900,
  textoBlocoComparacao: 650,
  textoDivisoria: 320,
  textoApresentacao: 750,
  textoCreditos: 700,
  exemploFonte: 60,
} as const

export const TEXTO_APRESENTACAO =
  'O documento "Manual de Marca" tem como objetivo mostrar como nos comunicamos e como nos parecemos.\n\n' +
  'É muito importante que este material seja lido por todas as pessoas envolvidas na manutenção e divulgação da marca.\n\n' +
  'A partir da leitura atenta deste material, é possível garantir uma comunicação clara e construir uma imagem consistente na mente de seus diferentes públicos.'

export const TEXTO_UNIVERSO =
  'A seguir mostraremos o detalhamento por trás da marca gráfica e da identidade visual, bem como suas diretrizes de aplicação.'

export const TEXTO_APLICACOES =
  'Nessa seção, mostraremos alguns exemplos de aplicação do universo visual. As peças a seguir não representam aplicações reais, são apenas exercícios e têm função meramente ilustrativa.'

export const TEXTO_NORMAS =
  'A seguir estão dispostas as variações da marca gráfica em suas diversas possibilidades de aplicação, assim como as especificações técnicas referentes às dimensões, área de segurança, redução máxima e usos incorretos da marca.'

export const TEXTO_CREDITOS =
  'Todas as imagens utilizadas nesta apresentação são meramente ilustrativas.\n\n' +
  'As fontes das quais foram retiradas estas imagens são diversas e originárias da internet.\n\n' +
  'Estas imagens não devem ser utilizadas publicamente sem consultar direitos autorais de uso, em nenhum tipo de mídia offline ou online, nem devem ser utilizadas como referência visual da marca.'

/** "Cereja Bloom Café" -> "cereja-bloom-cafe" */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Validacao de tamanho para textos que precisam caber numa pagina */
export const ateLimite =
  (limite: number) =>
  (valor: unknown): true | string => {
    const n = typeof valor === 'string' ? valor.length : 0
    return n <= limite || `Este texto tem ${n} caracteres e cabe até ${limite} na página. Encurte ${n - limite} caracteres.`
  }

export const dicaLimite = (limite: number, extra = '') => `Até ${limite} caracteres (para caber na página).${extra ? ` ${extra}` : ''}`
