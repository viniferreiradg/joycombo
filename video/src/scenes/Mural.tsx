import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { capturas, cores, SOLLEVO_GRADIENTE } from '../clientes';
import { H, W, mix } from '../lib/anim';
import { Browser } from './Browser';
import { PaginaEstatica } from './CenaSite';

// Formas dos tiles: paisagem, 16:9 (cenas), quadrado e vertical
type Forma = 'L' | 'W' | 'S' | 'V';
type Tile = {
  id: string;
  forma: Forma;
  // imagem em public/mural (corte com object-fit: cover)
  src?: string;
  pos?: string;
  // print chapado de site: entra dentro do frame de browser
  browser?: boolean;
  // tile que é o quadro de uma cena de cliente (para o zoom emendar com a cena)
  cena?: 'sollevo' | 'milvus' | 'cereja';
};

export const COLW = 372;
const GAP = 16;
// W = proporção do quadro do vídeo (os tiles de cena emendam com as cenas no zoom)
const ALTURA: Record<Forma, number> = { L: COLW / 1.6, W: (COLW * H) / W, S: COLW, V: COLW * 1.25 };
const VEL = 1.1; // px por frame, constante
const DIR = [1, -1, 1, -1, 1]; // colunas vizinhas em sentidos opostos
const RAIO = 10;

const m = (n: string) => `mural/${n}.webp`;
const T: Record<string, Tile> = {
  impulsa: { id: 'mural-01-impulsa-notebook', forma: 'S', src: m('mural-01-impulsa-notebook') },
  plathanusCase: { id: 'mural-02-plathanus-case', forma: 'L', src: m('mural-02-plathanus-case') },
  cakers: { id: 'mural-03-cakers', forma: 'L', src: m('mural-03-cakers'), pos: '60% 50%' },
  calmo: { id: 'mural-04-calmo-caixa', forma: 'S', src: m('mural-04-calmo-caixa'), pos: '75% 40%' },
  bradda: { id: 'mural-05-bradda-apresentacao', forma: 'L', src: m('mural-05-bradda-apresentacao') },
  habitenge: { id: 'mural-06-habitenge-site', forma: 'W', src: m('mural-06-habitenge-site'), browser: true },
  orbitytrack: { id: 'mural-07-orbitytrack-outdoor', forma: 'L', src: m('mural-07-orbitytrack-outdoor') },
  login: { id: 'mural-08-notebook-login', forma: 'S', src: m('mural-08-notebook-login') },
  facility: { id: 'mural-09-facility-papelaria', forma: 'S', src: m('mural-09-facility-papelaria'), pos: '55% 50%' },
  attalarQuadros: { id: 'mural-10-attalar-quadros', forma: 'L', src: m('mural-10-attalar-quadros') },
  attalarFachada: { id: 'mural-11-attalar-fachada', forma: 'V', src: m('mural-11-attalar-fachada'), pos: '62% 50%' },
  attalarCartao: { id: 'mural-12-attalar-cartao', forma: 'S', src: m('mural-12-attalar-cartao'), pos: '35% 45%' },
  milvusPonto: { id: 'mural-13-milvus-ponto', forma: 'L', src: m('mural-13-milvus-ponto') },
  milvusNotebook: { id: 'mural-14-milvus-notebook', forma: 'S', src: m('mural-14-milvus-notebook') },
  cerejaLogos: { id: 'mural-15-cereja-logos', forma: 'L', src: m('mural-15-cereja-logos') },
  cerejaVariacoes: { id: 'mural-16-cereja-variacoes', forma: 'S', src: m('mural-16-cereja-variacoes') },
  plathanusMoletom: { id: 'mural-17-plathanus-moletom', forma: 'L', src: m('mural-17-plathanus-moletom') },
  plathanusCaneca: { id: 'mural-18-plathanus-caneca', forma: 'L', src: m('mural-18-plathanus-caneca') },
  sollevo: { id: 'cena-sollevo', forma: 'W', cena: 'sollevo' },
  milvus: { id: 'cena-milvus', forma: 'W', cena: 'milvus' },
  cereja: { id: 'cena-cereja-bloom', forma: 'W', cena: 'cereja' },
};

// imagens iguais nunca na mesma coluna nem em colunas vizinhas
export const COLUNAS: Tile[][] = [
  [T.impulsa, T.milvusPonto, T.cerejaVariacoes, T.orbitytrack, T.attalarQuadros, T.plathanusCaneca],
  [T.cakers, T.attalarFachada, T.facility, T.cereja, T.bradda],
  [T.plathanusCase, T.login, T.sollevo, T.calmo, T.milvusNotebook],
  [T.attalarCartao, T.habitenge, T.cerejaLogos, T.milvus, T.plathanusCaneca],
  [T.plathanusMoletom, { ...T.login, forma: 'L' }, { ...T.cerejaVariacoes }, T.bradda, { ...T.attalarFachada, forma: 'S' }],
];

// momentos (no relógio do mural) em que os tiles-alvo passam pelo centro
export const MURAL_ABERTURA = 60;
export const MURAL_FECHAMENTO = 400;
export const ALVO_ABERTURA = { col: 2, id: 'cena-sollevo' };
export const ALVO_FECHAMENTO = { col: 3, id: 'cena-milvus' };

const periodo = (col: Tile[]) => col.reduce((s, t) => s + ALTURA[t.forma] + GAP, 0);
const acumulado = (col: Tile[], idx: number) => col.slice(0, idx).reduce((s, t) => s + ALTURA[t.forma] + GAP, 0);
const xCol = (c: number) => c * (COLW + GAP) - 2;

// deslocamento base de cada coluna: os alvos ficam centralizados no momento certo
const base = (c: number) => {
  const alvo = c === ALVO_ABERTURA.col ? { ...ALVO_ABERTURA, t: MURAL_ABERTURA } : c === ALVO_FECHAMENTO.col ? { ...ALVO_FECHAMENTO, t: MURAL_FECHAMENTO } : null;
  if (!alvo) return -c * 137;
  const col = COLUNAS[c];
  const idx = col.findIndex((t) => t.id === alvo.id);
  return H / 2 - ALTURA[col[idx].forma] / 2 - acumulado(col, idx) - DIR[c] * VEL * alvo.t;
};

// retângulo de um tile (posição sem dar a volta) no tempo t
const retangulo = (c: number, id: string, t: number) => {
  const col = COLUNAS[c];
  const idx = col.findIndex((x) => x.id === id);
  const y = base(c) + DIR[c] * VEL * t + acumulado(col, idx);
  return { x: xCol(c), y, w: COLW, h: ALTURA[col[idx].forma] };
};

// conteúdo de um tile que é cena de cliente: o quadro inteiro da cena
const QuadroCena: React.FC<{ cena: NonNullable<Tile['cena']>; browser: number }> = ({ cena, browser }) => {
  const fundo = cena === 'sollevo' ? SOLLEVO_GRADIENTE : cena === 'milvus' ? cores.milvus.principal : cores.cereja.principal;
  const cap = cena === 'sollevo' ? capturas.sollevo.hero : cena === 'milvus' ? capturas.milvus.secao2 : capturas.cereja.hero;
  const id = cena === 'cereja' ? 'cereja-bloom' : cena;
  return (
    <div style={{ position: 'absolute', inset: 0, background: fundo }}>
      <Browser style={{ opacity: browser }}>
        <PaginaEstatica id={id} cap={cap} />
      </Browser>
    </div>
  );
};

const ConteudoTile: React.FC<{ tile: Tile; browser?: number }> = ({ tile, browser = 1 }) => {
  const s = COLW / W;
  if (tile.cena || tile.browser) {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0' }}>
        {tile.cena ? (
          <QuadroCena cena={tile.cena} browser={browser} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
            <Browser>
              <Img src={staticFile(tile.src!)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </Browser>
          </div>
        )}
      </div>
    );
  }
  return <Img src={staticFile(tile.src!)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: tile.pos ?? 'center' }} />;
};

type Props = {
  // relógio do mural (rolagem das colunas)
  tempo: number;
  // 0 = mural inteiro, 1 = tile-alvo ocupando a tela
  zoom: number;
  alvo: { col: number; id: string };
  // opacidade do browser dentro do tile-alvo (a abertura dissolve no gradiente)
  browserAlvo?: number;
  // 0→1: tiles apagam de fora para o centro
  apagar?: number;
};

export const Mural: React.FC<Props> = ({ tempo, zoom, alvo, browserAlvo = 1, apagar = 0 }) => {
  // câmera: zoom em escala logarítmica, centro acompanha o tile-alvo
  const r = retangulo(alvo.col, alvo.id, tempo);
  const escalaFinal = Math.max(W / r.w, H / r.h);
  const escala = Math.exp(mix(zoom, 0, Math.log(escalaFinal)));
  const q = (escala - 1) / (escalaFinal - 1);
  const cx = mix(q, W / 2, r.x + r.w / 2);
  const cy = mix(q, H / 2, r.y + r.h / 2);

  return (
    <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px) scale(${escala}) translate(${-cx}px, ${-cy}px)` }}>
        {COLUNAS.map((col, c) => {
          const P = periodo(col);
          const off = (((base(c) + DIR[c] * VEL * tempo) % P) + P) % P;
          const tiles: React.ReactNode[] = [];
          for (let k = -1; k * P < H + P; k++) {
            col.forEach((tile, i) => {
              const y = off + (k - 1) * P + acumulado(col, i);
              const h = ALTURA[tile.forma];
              if (y > H + 40 || y + h < -40) return;
              const ehAlvo = c === alvo.col && tile.id === alvo.id && Math.abs(y - r.y) < 1;
              const x = xCol(c);
              // distância ao centro decide a ordem de apagar (de fora para dentro)
              const d = Math.min(1, Math.hypot(x + COLW / 2 - W / 2, y + h / 2 - H / 2) / 1050);
              const inicio = (1 - d) * 0.6;
              const opacidade = 1 - Math.min(1, Math.max(0, (apagar - inicio) / 0.4));
              tiles.push(
                <div
                  key={`${c}-${k}-${i}`}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: COLW,
                    height: h,
                    borderRadius: ehAlvo ? RAIO * (1 - zoom) : RAIO,
                    overflow: 'hidden',
                    background: '#111111',
                    opacity: opacidade,
                  }}
                >
                  <ConteudoTile tile={tile} browser={ehAlvo ? browserAlvo : 1} />
                </div>,
              );
            });
          }
          return <React.Fragment key={c}>{tiles}</React.Fragment>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// Composição de revisão: todos os cortes do mural com o nome do arquivo
export const MuralCortes: React.FC = () => {
  const unicos = new Map<string, Tile>();
  COLUNAS.flat().forEach((t) => unicos.set(`${t.id}-${t.forma}`, t));
  return (
    <AbsoluteFill style={{ background: '#222222', padding: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignContent: 'flex-start' }}>
      {Array.from(unicos.values()).map((t) => (
        <div key={`${t.id}-${t.forma}`} style={{ width: COLW * 0.62, fontFamily: 'Arial', fontSize: 13, color: '#FFFFFF' }}>
          <div style={{ position: 'relative', width: COLW * 0.62, height: ALTURA[t.forma] * 0.62, borderRadius: RAIO, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: COLW, height: ALTURA[t.forma], transform: 'scale(0.62)', transformOrigin: '0 0' }}>
              <ConteudoTile tile={t} />
            </div>
          </div>
          <div style={{ marginTop: 4 }}>
            {t.id} ({t.forma})
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
