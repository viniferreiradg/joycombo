// Copia para o Vercel Blob as midias que estao salvas em public/media
// (logos, video do Vini...). Rodar uma vez, com BLOB_READ_WRITE_TOKEN no
// .env.local: `npm run media:blob`. Pode rodar de novo sem duplicar.
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../../payload.config'

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Falta BLOB_READ_WRITE_TOKEN no .env.local (Vercel > Storage > Blob).')
  process.exit(1)
}

const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0 })

for (const doc of docs) {
  if (!doc.filename) continue
  const file = path.resolve(process.cwd(), 'public/media', doc.filename)
  if (!fs.existsSync(file)) {
    payload.logger.warn(`[blob] arquivo nao encontrado, pulando: ${doc.filename}`)
    continue
  }
  const data = fs.readFileSync(file)
  // Reenviar o arquivo faz o adaptador gravar no Blob (e gerar os tamanhos de novo)
  await payload.update({
    collection: 'media',
    id: doc.id,
    data: {},
    file: { data, mimetype: doc.mimeType || 'application/octet-stream', name: doc.filename, size: data.length },
    overwriteExistingFiles: true,
  })
  payload.logger.info(`[blob] enviado: ${doc.filename}`)
}

payload.logger.info('[blob] pronto')
process.exit(0)
