import { chromium } from 'playwright';
import fs from 'node:fs';
const sites: Record<string, string> = {
  sollevo: 'https://sollevoengenharia.com.br/',
  plathanus: 'https://www.plathanus.com.br/pt',
  'cereja-bloom': 'https://cerejabloom.com.br/',
  milvus: 'https://milvus.com.br/',
};
const browser = await chromium.launch({ channel: 'chrome' });
for (const [id, url] of Object.entries(sites)) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } catch (e) { console.log(id, 'goto warn', String(e).slice(0, 100)); }
  await page.waitForTimeout(2500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(200); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
  await page.screenshot({ path: `recon/${id}-full.png`, fullPage: true });
  const info = await page.evaluate(() => {
    const vars: Record<string, string> = {};
    for (const sheet of Array.from(document.styleSheets)) {
      try { for (const r of Array.from(sheet.cssRules) as CSSStyleRule[]) {
        if (r.selectorText === ':root' || r.selectorText === 'html' || r.selectorText === 'body') for (const p of Array.from(r.style)) if (p.startsWith('--')) vars[p] = r.style.getPropertyValue(p).trim();
      } } catch {}
    }
    const colors: Record<string, number> = {}; const fonts: Record<string, number> = {};
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const area = Math.min(r.width * r.height, 4e6);
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') colors['bg ' + cs.backgroundColor] = (colors['bg ' + cs.backgroundColor] || 0) + area;
      if (el.childNodes[0]?.nodeType === 3 && el.textContent!.trim()) { colors['text ' + cs.color] = (colors['text ' + cs.color] || 0) + 1; fonts[cs.fontFamily] = (fonts[cs.fontFamily] || 0) + 1; }
    }
    const sections = Array.from(document.querySelectorAll('section, header, footer, main > div')).map((s) => { const r = s.getBoundingClientRect(); return { tag: s.tagName, id: s.id, cls: (s.className + '').slice(0, 60), y: Math.round(r.top + scrollY), h: Math.round(r.height), text: (s.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) }; }).filter((s) => s.h > 200);
    return { body: getComputedStyle(document.body).backgroundColor, vars, colors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 15), fonts: Object.entries(fonts).sort((a, b) => b[1] - a[1]).slice(0, 5), sections };
  });
  fs.writeFileSync(`recon/${id}.json`, JSON.stringify({ url, h, ...info }, null, 2));
  console.log('ok', id, h);
  await page.close();
}
await browser.close();
