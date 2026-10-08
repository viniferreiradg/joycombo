// Sobe os vídeos do topo (feitos no Remotion: video/ no desktop e
// video-mobile/ no celular) e as capas para a Mídia e liga tudo no Topo da
// landing. Rodar depois de exportar (pastas out/): `npm run hero:video`.
// Só envia os arquivos que existirem. O nome leva um hash do conteúdo: o CDN do
// Blob guarda cada URL por 1 ano, então arquivo novo precisa de URL nova.
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../payload.config'

type Arquivo = { dir: string; file: string; mimetype: string; alt: string; campo: 'heroVideo' | 'heroPoster' | 'heroVideoMobile' | 'heroPosterMobile' }
const altVideo = 'Trabalhos de marca e site feitos pelo Joycombo'
const altCapa = 'Mural com trabalhos do Joycombo'
const arquivos: Arquivo[] = [
  { dir: 'video/out', file: 'joycombo-hero.mp4', mimetype: 'video/mp4', alt: altVideo, campo: 'heroVideo' },
  { dir: 'video/out', file: 'joycombo-hero-poster.jpg', mimetype: 'image/jpeg', alt: altCapa, campo: 'heroPoster' },
  { dir: 'video-mobile/out', file: 'joycombo-hero-mobile.mp4', mimetype: 'video/mp4', alt: altVideo, campo: 'heroVideoMobile' },
  { dir: 'video-mobile/out', file: 'joycombo-hero-mobile-poster.jpg', mimetype: 'image/jpeg', alt: altCapa, campo: 'heroPosterMobile' },
]

const payload = await getPayload({ config })

async function subir({ dir, file, mimetype, alt }: Arquivo) {
  const caminho = path.resolve(process.cwd(), dir, file)
  const data = fs.readFileSync(caminho)
  const hash = crypto.createHash('sha1').update(data).digest('hex').slice(0, 8)
  const nome = file.replace(/(\.[a-z0-9]+)$/, `-${hash}$1`)
  // mesmo conteúdo já enviado: reaproveita (a capa vira .webp no upload)
  const { docs } = await payload.find({ collection: 'media', where: { filename: { like: `-${hash}.` } }, limit: 1, depth: 0 })
  if (docs[0]) {
    payload.logger.info(`[hero] já estava no ar: ${docs[0].filename}`)
    return docs[0].id
  }
  const doc = await payload.create({ collection: 'media', data: { alt }, file: { data, mimetype, name: nome, size: data.length } })
  payload.logger.info(`[hero] enviado: ${doc.filename} (${(data.length / 1e6).toFixed(1)} MB)`)
  return doc.id
}

const data: Partial<Record<Arquivo['campo'], number>> = {}
for (const a of arquivos) {
  if (!fs.existsSync(path.resolve(process.cwd(), a.dir, a.file))) {
    payload.logger.warn(`[hero] não exportado ainda, pulando: ${a.dir}/${a.file}`)
    continue
  }
  data[a.campo] = (await subir(a)) as number
}
await payload.updateGlobal({ slug: 'landing', data })
payload.logger.info(`[hero] Topo da landing atualizado: ${Object.keys(data).join(', ')}`)
process.exit(0)
