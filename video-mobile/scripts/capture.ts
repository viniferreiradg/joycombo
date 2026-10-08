// Captura os sites dos clientes em camadas para o stagger reveal do vídeo.
// Uso: npx tsx scripts/capture.ts [cliente]
import { chromium, type Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

type Layer = {
  name: string;
  // JS executado na página que devolve os elementos da camada (a união vira um PNG)
  pick: string;
  // elementos escondidos só durante a captura desta camada
  exclude?: string;
};
type Section = {
  id: 'hero' | 'secao-2';
  // JS que devolve o elemento que vai para o topo da viewport (ou null = topo da página)
  scrollTo: string | null;
  offset?: number;
  // vídeo de fundo: sai do fundo.png (fica transparente) e o vídeo toca por baixo na cena
  video?: { selector: string; arquivo: string };
  // elementos do site que somem do vídeo (JS que devolve os elementos)
  ocultar?: string;
  // reposiciona camadas no vídeo (ex.: alinhar o bloco do hero no topo)
  mover?: { camadas: string[]; dy: number };
  layers: Layer[];
};
// menu do site: capturado à parte para ficar fixo no topo da tela durante a rolagem
type Menu = {
  pick: string;
  // captura também o estado depois da rolagem (ex.: menu que ganha fundo)
  rolado?: boolean;
};
type Site = { url: string; menu?: Menu; sections: Section[] };

// viewport de celular (versão mobile do vídeo)
const W = 430;
const H = 932;
const DSF = 3;
const PAD = 12;

// helpers disponíveis dentro do `pick`
const HELPERS = `
  window.$$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  window.byText = (tags, text, root = document) => {
    const els = $$(tags, root).filter((e) => (e.textContent || '').replace(/\\s+/g, ' ').includes(text));
    return els.filter((e) => !els.some((o) => o !== e && e.contains(o)));
  };
  window.closestUp = (el, sel) => el && el.closest(sel);
`;

const sites: Record<string, Site> = {
  sollevo: {
    url: 'https://sollevoengenharia.com.br/',
    menu: { pick: `$$('[data-id="9bac187"]')` },
    sections: [
      {
        id: 'hero',
        scrollTo: null,
        layers: [
          { name: 'kicker', pick: `$$('[data-id="c541225"]')` },
          { name: 'h1', pick: `$$('[data-id="a80111b"]')` },
          { name: 'imagem', pick: `$$('[data-id="3f49833"]')` },
          { name: 'texto', pick: `$$('[data-id="a2c6e14"]')` },
        ],
      },
      {
        id: 'secao-2',
        offset: -100, // desconta o menu fixo (97px) para o título não ficar atrás dele
        scrollTo: `$$('[data-id="f0f808e"]')[0]`,
        layers: [
          { name: 'titulo', pick: `$$('[data-id="4bec9ff"]')` },
          { name: 'texto', pick: `$$('[data-id="19ba76b"]')` },
          { name: 'servico-1', pick: `$$('[data-id="8374e61"], [data-id="0dc20e7"]')` },
          { name: 'servico-2', pick: `$$('[data-id="798da4c"], [data-id="052ea8b"]')` },
          { name: 'servico-3', pick: `$$('[data-id="900c67d"], [data-id="75ebdda"]')` },
          { name: 'servico-4', pick: `$$('[data-id="3f634b9"], [data-id="28997f5"]')` },
          { name: 'servico-5', pick: `$$('[data-id="6b28621"], [data-id="636a028"]')` },
          { name: 'botao', pick: `$$('[data-id="77f28af"] a')` },
        ],
      },
    ],
  },
  plathanus: {
    url: 'https://www.plathanus.com.br/pt',
    // no site o menu esconde ao rolar; no vídeo ele fica
    menu: { pick: `$$('header.fixed')` },
    sections: [
      {
        id: 'hero',
        scrollTo: null,
        video: { selector: '#home video', arquivo: 'video.mp4' },
        // setas decorativas que no celular ficam por cima do texto
        ocultar: `$$('#home svg').filter((s) => { const r = s.getBoundingClientRect(); return r.left > 300 && r.height > 200; })`,
        layers: [
          { name: 'h1', pick: `$$('#home h1')` },
          { name: 'subtitulo', pick: `byText('p', 'Antes do código').slice(0, 1)` },
          { name: 'botao', pick: `$$('#home button').filter((b) => b.textContent.includes('Conheça'))` },
        ],
      },
      {
        id: 'secao-2',
        scrollTo: `closestUp(byText('h2', 'Anos de experiência')[0], 'section')`,
        layers: [
          { name: 'numero-1', pick: `[closestUp(byText('h2', 'Anos de experiência')[0], 'div')]` },
          { name: 'numero-2', pick: `[closestUp(byText('h2', 'Países Alcançados')[0], 'div')]` },
          { name: 'numero-3', pick: `[closestUp(byText('h2', 'Empresas Impactadas')[0], 'div')]` },
          { name: 'parceiros-titulo', pick: `byText('h1,h2,h3,p,span', 'Nossos parceiros estratégicos').slice(0, 1)` },
          {
            name: 'parceiros-logos',
            pick: `(() => { const t = byText('h1,h2,h3,p,span', 'Nossos parceiros estratégicos')[0]; const s = closestUp(t, 'section'); return $$('img, svg', s).filter((e) => !e.closest('svg') || e.tagName === 'svg'); })()`,
          },
        ],
      },
    ],
  },
  'cereja-bloom': {
    url: 'https://cerejabloom.com.br/',
    menu: { pick: `$$('#siteHeader')`, rolado: true },
    sections: [
      {
        id: 'hero',
        scrollTo: null,
        // no vídeo, o bloco do hero fica alinhado em cima (logo abaixo do menu)
        mover: { camadas: ['kicker', 'lettering', 'subtitulo', 'botao-1', 'botao-2'], dy: -455 },
        layers: [
          { name: 'kicker', pick: `byText('section.hero p, section.hero span, section.hero div', 'Indie Rock').slice(0, 1)` },
          { name: 'lettering', pick: `$$('section.hero img').filter((i) => i.alt === 'Cereja Bloom')` },
          { name: 'subtitulo', pick: `$$('section.hero .hero-tagline')` },
          { name: 'botao-1', pick: `$$('section.hero a.btn-solid')` },
          { name: 'botao-2', pick: `$$('section.hero a.btn:not(.btn-solid)')` },
        ],
      },
      {
        id: 'secao-2',
        scrollTo: `document.querySelector('#musicas')`,
        layers: [
          { name: 'kicker', pick: `(() => { const h = $$('#musicas h2')[0]; const p = h.previousElementSibling; return p ? [p] : []; })()` },
          { name: 'titulo', pick: `$$('#musicas h2')` },
          { name: 'texto', pick: `$$('#musicas h2 ~ p, #musicas p').filter((p) => p.textContent.includes('Desaforo e Souvenir')).slice(0, 1)` },
          { name: 'capa', pick: `$$('#musicas img, #musicas iframe, #musicas [class*="cover"], #musicas [class*="art"]').filter((e) => e.getBoundingClientRect().width > 150).slice(0, 1)` },
          { name: 'single-1', pick: `(() => { const a = $$('#musicas a').filter((a) => a.textContent.includes('Ouvir'))[0]; return a ? [a.parentElement] : []; })()` },
          { name: 'single-2', pick: `(() => { const a = $$('#musicas a').filter((a) => a.textContent.includes('Ouvir'))[1]; return a ? [a.parentElement] : []; })()` },
          { name: 'nota', pick: `$$('#musicas .music-note')` },
        ],
      },
    ],
  },
  milvus: {
    url: 'https://milvus.com.br/',
    // no celular o menu da Milvus não é fixo: pega o bloco do topo (barra + logo)
    menu: {
      pick: `(() => { const els = $$('body *').filter((e) => { const r = e.getBoundingClientRect(); return r.top >= -1 && r.top < 5 && r.width >= 420 && r.height > 60 && r.height < 160 && (e.textContent || '').includes('Login'); }); return els.filter((e) => !els.some((o) => o !== e && e.contains(o))).slice(0, 1); })()`,
    },
    sections: [
      {
        id: 'hero',
        scrollTo: null,
        layers: [
          {
            name: 'asa',
            pick: `(() => { const h = $$('h1')[0]; const r = h.getBoundingClientRect(); return $$('svg').filter((s) => { const b = s.getBoundingClientRect(); return b.width > 50 && b.width < 150 && b.bottom <= r.top && b.top > r.top - 80 && Math.abs(b.left - r.left) < 20; }).slice(0, 1); })()`,
          },
          // o H1 da Milvus é azul com um span preto: o preto entra antes, o azul depois
          { name: 'h1', pick: `$$('h1 span').filter((e) => getComputedStyle(e).color === 'rgb(0, 0, 0)')` },
          { name: 'h1-azul', pick: `$$('h1').slice(0, 1)`, exclude: `$$('h1 span').filter((e) => getComputedStyle(e).color === 'rgb(0, 0, 0)')` },
          { name: 'texto', pick: `(() => { const h = $$('h1')[0]; return byText('p', 'Centralize solicitações').slice(0, 1); })()` },
          { name: 'botao-1', pick: `byText('a', 'Fale com um consultor agora').filter((a) => a.getBoundingClientRect().top < 932).slice(0, 1)` },
          { name: 'botao-2', pick: `byText('a', 'Agendar demonstração').filter((a) => a.getBoundingClientRect().top < 932).slice(0, 1)` },
          { name: 'mockup', pick: `$$('img').filter((i) => (i.alt || '').startsWith('Dashboard da plataforma'))` },
        ],
      },
      {
        id: 'secao-2',
        offset: -110, // desconta o menu do topo (99px)
        // o último item fica por cima do desenho do celular
        ocultar: `(() => { const p = byText('p', '100% integrado')[0]; return p ? [p.parentElement.parentElement] : []; })()`,
        scrollTo: `(() => { const t = byText('h1,h2,h3,h4,h5,h6,p', 'Automatize seu suporte')[0]; let s = t; while (s && s.getBoundingClientRect().height < 450) s = s.parentElement; return s; })()`,
        layers: [
          { name: 'titulo', pick: `byText('h1,h2,h3,h4,h5,h6,p', 'Automatize seu suporte').slice(0, 1)` },
          { name: 'texto', pick: `byText('p', 'Empresas que adotaram o Chatbot').slice(0, 1).map((p) => p.parentElement.tagName === 'DIV' && p.parentElement.children.length <= 3 ? p.parentElement : p)` },
          { name: 'item-1', pick: `(() => { const p = byText('p', 'Menos sobrecarga')[0]; return [p.parentElement.parentElement]; })()` },
          { name: 'item-2', pick: `(() => { const p = byText('p', 'Resolva chamados')[0]; return [p.parentElement.parentElement]; })()` },
          { name: 'item-3', pick: `(() => { const p = byText('p', 'Atendimento ágil')[0]; return [p.parentElement.parentElement]; })()` },
          { name: 'botao', pick: `(() => { const t = byText('p', 'Empresas que adotaram o Chatbot')[0]; return byText('a', 'Saiba Mais').filter((a) => Math.abs(a.getBoundingClientRect().top - t.getBoundingClientRect().top) < 500).slice(0, 1); })()` },
          { name: 'celular', pick: `$$('img').filter((i) => (i.alt || '').startsWith('Chatbot Milvus integrado') && i.getBoundingClientRect().width < 1000 && i.getBoundingClientRect().width > 0)` },
          { name: 'robo', pick: `$$('img').filter((i) => (i.alt || '').startsWith('Mascote robô') && i.getBoundingClientRect().width > 0)` },
        ],
      },
    ],
  },
};

async function prepare(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  } catch {
    // sites com conexões abertas nunca chegam a networkidle
  }
  await page.waitForTimeout(3000);
  await page.addScriptTag({ content: HELPERS });
  // dispara lazy load e animações de scroll
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
}

async function hideOverlays(page: Page, keepNav: boolean) {
  await page.evaluate(({ keepNav, W }) => {
    for (const el of Array.from(document.querySelectorAll('body *')) as HTMLElement[]) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      const text = (el.textContent || '').toLowerCase();
      const isNav = r.top < 40 && r.width > W * 0.9 && r.height < 200 && !text.includes('cookie');
      if (isNav && keepNav) continue;
      el.style.setProperty('display', 'none', 'important');
    }
    // preloaders e banners de cookie que não são fixed
    for (const el of Array.from(document.querySelectorAll('#loftloader-wrapper, [class*="preloader" i], [class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i]')) as HTMLElement[]) {
      el.style.setProperty('display', 'none', 'important');
    }
  }, { keepNav, W });
}

async function captureSection(page: Page, site: string, sec: Section, outDir: string, menu?: Menu) {
  fs.mkdirSync(outDir, { recursive: true });
  const scrollY = await page.evaluate(
    ({ js, offset }) => {
      const el = js ? (eval(js) as Element | null) : null;
      const y = el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
      window.scrollTo(0, y);
      return window.scrollY;
    },
    { js: sec.scrollTo, offset: sec.offset ?? 0 },
  );
  await page.waitForTimeout(3500); // animações de entrada do próprio site
  const realScrollY = await page.evaluate(() => window.scrollY);

  // menu fixo: no hero captura o estado do topo; na seção 2, o estado rolado
  let menuInfo: { file: string; height: number } | undefined;
  const capturarMenu = sec.id === 'hero' || menu?.rolado;
  if (menu && capturarMenu) {
    const altura = await page.evaluate((js) => {
      const els = (eval(js) as Element[]).filter(Boolean);
      els.forEach((e) => e.setAttribute('data-menu', ''));
      return Math.ceil(Math.max(0, ...els.map((e) => e.getBoundingClientRect().bottom)));
    }, menu.pick);
    if (altura > 0) {
      const tag = await page.addStyleTag({
        content: `html, body { background: transparent !important; } * { visibility: hidden !important; } [data-menu], [data-menu] * { visibility: visible !important; }`,
      });
      await page.waitForTimeout(200);
      const file = sec.id === 'hero' ? 'menu.png' : 'menu-rolado.png';
      await page.screenshot({ path: path.join(path.dirname(outDir), file), clip: { x: 0, y: 0, width: W, height: altura }, omitBackground: true });
      await tag.evaluate((t) => t.remove());
      menuInfo = { file, height: altura };
    } else {
      console.warn(`  ! ${site}/${sec.id}: menu não encontrado`);
    }
  }

  await hideOverlays(page, sec.id === 'hero');
  await page.waitForTimeout(300);

  if (sec.ocultar) {
    await page.evaluate((js) => (eval(js) as Element[]).forEach((e) => e.setAttribute('data-ocultar', '')), sec.ocultar);
  }
  const ocultos = '[data-ocultar], [data-ocultar] * { visibility: hidden !important; }';

  // marca as camadas
  const found = await page.evaluate((layers) => {
    return layers.map((l, i) => {
      let els: Element[] = [];
      try {
        els = (eval(l.pick) as Element[]).filter(Boolean);
      } catch (e) {
        return { name: l.name, count: 0, error: String(e) };
      }
      els.forEach((e) => e.setAttribute('data-cap', String(i)));
      if (l.exclude) {
        try {
          (eval(l.exclude) as Element[]).forEach((e) => e.setAttribute('data-cap-ex', String(i)));
        } catch {}
      }
      const rects = els.map((e) => e.getBoundingClientRect());
      if (!rects.length) return { name: l.name, count: 0 };
      const x = Math.min(...rects.map((r) => r.left));
      const y = Math.min(...rects.map((r) => r.top));
      const x2 = Math.max(...rects.map((r) => r.right));
      const y2 = Math.max(...rects.map((r) => r.bottom));
      return { name: l.name, count: els.length, x, y, w: x2 - x, h: y2 - y };
    });
  }, sec.layers);

  const style = await page.addStyleTag({ content: '/* cap */' });
  const setCss = (css: string) => style.evaluate((s, css) => (s.textContent = css), css);
  const noMotion = '*, *::before, *::after { transition: none !important; animation-play-state: paused !important; caret-color: transparent !important; }';

  // fundo limpo
  const semVideo = sec.video ? `${sec.video.selector} { visibility: hidden !important; } html, body { background: transparent !important; }` : '';
  await setCss(`${noMotion} ${ocultos} [data-cap], [data-cap] * { visibility: hidden !important; } [data-menu], [data-menu] * { visibility: hidden !important; } ${semVideo}`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, 'fundo.png'), clip: { x: 0, y: 0, width: W, height: H }, omitBackground: !!sec.video });

  const layers: unknown[] = [];
  for (const [i, f] of found.entries()) {
    if (!f.count || f.w === undefined) {
      console.warn(`  ! ${site}/${sec.id}/${f.name}: nada encontrado ${'error' in f ? f.error : ''}`);
      continue;
    }
    await setCss(
      `${noMotion} html, body { background: transparent !important; } * { visibility: hidden !important; }
       [data-cap="${i}"], [data-cap="${i}"] * { visibility: visible !important; }
       [data-cap-ex="${i}"], [data-cap-ex="${i}"] * { visibility: hidden !important; } ${ocultos}`,
    );
    await page.waitForTimeout(150);
    const x = Math.max(0, Math.floor(f.x - PAD));
    const y = Math.max(0, Math.floor(f.y! - PAD));
    const w = Math.min(W - x, Math.ceil(f.w + PAD * 2));
    const h = Math.min(H - y, Math.ceil(f.h! + PAD * 2));
    if (w <= 0 || h <= 0) {
      console.warn(`  ! ${site}/${sec.id}/${f.name}: fora da viewport`);
      continue;
    }
    const file = `${f.name}.png`;
    await page.screenshot({ path: path.join(outDir, file), clip: { x, y, width: w, height: h }, omitBackground: true });
    const dy = sec.mover?.camadas.includes(f.name) ? sec.mover.dy : 0;
    layers.push({ name: f.name, file, x, y: y + dy, width: w, height: h, order: layers.length });
  }
  await setCss('');
  await page.evaluate(() =>
    document.querySelectorAll('[data-cap],[data-cap-ex],[data-menu],[data-ocultar]').forEach((e) => ['data-cap', 'data-cap-ex', 'data-menu', 'data-ocultar'].forEach((a) => e.removeAttribute(a))),
  );

  fs.writeFileSync(
    path.join(outDir, 'layers.json'),
    JSON.stringify({ site, section: sec.id, scrollY: Math.round(realScrollY), viewport: { width: W, height: H }, scale: DSF, background: 'fundo.png', video: sec.video?.arquivo, menu: menuInfo, layers }, null, 2),
  );
  console.log(`  ${site}/${sec.id}: ${layers.length}/${sec.layers.length} camadas (scrollY ${Math.round(realScrollY)})`);
}

const only = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome' });
for (const [id, site] of Object.entries(sites)) {
  if (only && only !== id) continue;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  const page = await ctx.newPage();
  await prepare(page, site.url);
  const base = path.join('public', 'clientes', id, 'captura');
  for (const sec of site.sections) {
    // recarrega o estado de overlays a cada seção
    await captureSection(page, id, sec, path.join(base, sec.id), site.menu);
  }
  await page.screenshot({ path: path.join(base, 'full-page.png'), fullPage: true, scale: 'css' });
  await ctx.close();
}
await browser.close();
