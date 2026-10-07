import Image, { type ImageProps } from 'next/image'

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i

export function isVideo(media?: { url?: string | null; mimeType?: string | null } | null) {
  if (!media?.url) return false
  return !!media.mimeType?.startsWith('video/') || VIDEO_EXT.test(media.url)
}

type Props = ImageProps & { mimeType?: string | null }

// Mostra qualquer mídia do CMS: se for vídeo vira <video> em loop, mudo e automático;
// senão cai no next/image com as mesmas props. Use no lugar de <Image> pra mídia vinda do Payload.
export default function MediaView({ mimeType, ...props }: Props) {
  const src = typeof props.src === 'string' ? props.src : undefined

  if (src && isVideo({ url: src, mimeType })) {
    const { className, style, fill, priority } = props
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload={priority ? 'auto' : 'metadata'}
        aria-label={props.alt || undefined}
        className={`${fill ? 'absolute inset-0 w-full h-full' : ''} ${className || ''}`.trim()}
        style={style}
      />
    )
  }

  return <Image {...props} />
}
