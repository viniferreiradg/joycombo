'use client'

import Image, { type ImageProps } from 'next/image'

// Imagens do manual com no maximo 1920px de largura (o tamanho da pagina).
// Sem esse teto, telas de alta densidade pedem 3840px e o otimizador do Next
// passa do tempo limite em fotos grandes (ex.: 9MB), e a imagem nao aparece.
const MAX = 1920

const tetoDeLargura: ImageProps['loader'] = ({ src, width, quality }) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${Math.min(width, MAX)}&q=${quality || 75}`

export default function ImagemManual(props: ImageProps) {
  // alt vem sempre das props (vazio quando a imagem e decorativa)
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image loader={tetoDeLargura} {...props} />
}
