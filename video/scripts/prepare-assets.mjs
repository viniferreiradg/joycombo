// Copia logos, gera cores.json e src/logos.generated.ts (SVGs com classes/ids prefixados)
import fs from 'node:fs';
const src = '../video dos clientes/links/';
const clientes = {
  sollevo: { svg: 'sollevo marca.svg', cores: { principal: '#ED4224', principalGradiente: ['#A01F22', '#ED4224'], secundaria: '#A01F22', escura: '#000000', clara: '#F2F2F2' } },
  plathanus: { svg: 'plathanus marca.svg', cores: { principal: '#00FF9C', secundaria: '#9C64FF', destaque: '#00E2FF', neutra: '#BEC3C5', escura: '#000000', clara: '#FFFFFF' } },
  attalar: { svg: 'attalar marca.svg', cores: { principal: '#372EE8', escura: '#000000', clara: '#FBF6EF' } },
  'cereja-bloom': { svg: 'cereja marca.svg', cores: { principal: '#D70008', laranja: '#FA6E33', rosa: '#EE737C', mostarda: '#F7A92F', pessego: '#F9BA8E', azul: '#3948A7', escura: '#303030', clara: '#F9F8ED' } },
  milvus: { svg: 'milvus marca.svg', cores: { principal: '#0073E9', secundaria: '#00D7A0', escura: '#2D2D2D', clara: '#FFFFFF' } },
};
let out = '// Gerado por scripts/prepare-assets.mjs — não editar à mão\n';
for (const [id, c] of Object.entries(clientes)) {
  const dir = `public/clientes/${id}`;
  fs.mkdirSync(dir, { recursive: true });
  let svg = fs.readFileSync(src + c.svg, 'utf8');
  fs.writeFileSync(`${dir}/logo.svg`, svg);
  fs.writeFileSync(`${dir}/cores.json`, JSON.stringify(c.cores, null, 2));
  const p = id.replace(/[^a-z]/g, '');
  svg = svg
    .replace(/<\?xml[^>]*>/, '')
    .replace(/\.cls-/g, `.${p}-cls-`)
    .replace(/class="cls-/g, `class="${p}-cls-`)
    .replace(/id="linear-gradient/g, `id="${p}-linear-gradient`)
    .replace(/url\(#linear-gradient/g, `url(#${p}-linear-gradient`)
    .replace(/xlink:href="#linear-gradient/g, `xlink:href="#${p}-linear-gradient`)
    .replace(/\s+/g, ' ');
  out += `export const logo_${p} = ${JSON.stringify(svg.trim())};\n`;
}
fs.writeFileSync('src/logos.generated.ts', out);
console.log('ok');
