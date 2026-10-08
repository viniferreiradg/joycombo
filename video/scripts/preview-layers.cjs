// prévia: fundo | fundo + camadas (com contorno e nome) para cada seção
const sharp = require('../../node_modules/sharp'); const fs = require('fs'); const path = require('path');
(async () => {
  const out = []; const S = 0.25;
  for (const site of ['sollevo', 'plathanus', 'cereja-bloom', 'milvus']) for (const sec of ['hero', 'secao-2']) {
    const dir = `public/clientes/${site}/captura/${sec}`; const d = JSON.parse(fs.readFileSync(dir + '/layers.json'));
    const bg = await sharp(dir + '/fundo.png').resize(480, 270).toBuffer();
    const comps = []; let svg = '';
    for (const l of d.layers) {
      comps.push({ input: await sharp(dir + '/' + l.file).resize(Math.max(1, Math.round(l.width * S)), Math.max(1, Math.round(l.height * S))).toBuffer(), left: Math.round(l.x * S), top: Math.round(l.y * S) });
      svg += `<rect x="${l.x*S}" y="${l.y*S}" width="${l.width*S}" height="${l.height*S}" fill="none" stroke="magenta" stroke-width="1"/><text x="${l.x*S+2}" y="${l.y*S+9}" font-size="9" fill="magenta" font-family="Arial">${l.name}</text>`;
    }
    comps.push({ input: Buffer.from(`<svg width="480" height="270" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`), left: 0, top: 0 });
    const full = await sharp(bg).composite(comps).toBuffer();
    out.push(bg, full);
  }
  const tiles = out.map((b, i) => ({ input: b, left: (i % 4) * 490, top: Math.floor(i / 4) * 280 }));
  await sharp({ create: { width: 1960, height: 1120, channels: 3, background: '#777' } }).composite(tiles).png().toFile('recon/layers-preview.png');
})();
