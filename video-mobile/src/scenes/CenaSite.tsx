import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { CENA, H, LOGO_EXTRA, TRANSICAO, W, mix, prog } from '../lib/anim';
import { Browser, BROWSER, VIEWPORT } from './Browser';
import { Transicao, type TipoTransicao } from './Transicao';

export type Camada = { name: string; file: string; x: number; y: number; width: number; height: number; order: number };
// menu: capturado à parte (scripts/capture.ts) para ficar fixo no topo durante a rolagem
export type MenuCaptura = { file: string; height: number };
export type Captura = { site: string; section: string; video?: string; menu?: MenuCaptura; layers: Camada[] };

// como cada camada entra no stagger
export type Entrada = 'sobe' | 'direita' | 'esquerda' | 'escala' | 'fade';
// chave: "hero/h1", "secao-2/celular"
type Ajuste = { entrada?: Entrada; atraso?: number };

type Props = {
  id: string;
  fundo: string;
  intro: (frame: number) => React.ReactNode;
  hero: Captura;
  secao2: Captura;
  ajustes?: Record<string, Ajuste>;
  // sem transição: a cena termina parada (a última cena sai pelo zoom out do mural)
  transicao?: { tipo: TipoTransicao; fundo: string; origem?: { x: number; y: number } };
};

// Linha do tempo da cena de site (7s / 210 frames)
const L = LOGO_EXTRA;
export const T = {
  introFim: 38 + L, // logo construída, assentada e segurando
  browserIn: 34 + L, // browser entra no quadro
  browserDur: 22,
  heroFundo: 54 + L,
  heroCamadas: 60 + L,
  heroPasso: 4,
  scroll: 108 + L,
  scrollDur: 20,
  secaoCamadas: 118 + L,
  secaoPasso: 3,
  camadaDur: 16,
  transicao: CENA - TRANSICAO,
};

// a página capturada tem viewport de celular e é escalada para a tela do aparelho
const S = BROWSER.width / VIEWPORT.width;

const CamadaAnimada: React.FC<{ dir: string; c: Camada; inicio: number; entrada: Entrada }> = ({ dir, c, inicio, entrada }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, inicio, T.camadaDur);
  let transform = '';
  if (entrada === 'sobe') transform = `translateY(${mix(p, 36, 0)}px)`;
  if (entrada === 'direita') transform = `translateX(${mix(p, 220, 0)}px)`;
  if (entrada === 'esquerda') transform = `translateX(${mix(p, -220, 0)}px)`;
  if (entrada === 'escala') transform = `scale(${mix(p, 0.85, 1)})`;
  return (
    <Img
      src={staticFile(`${dir}/${c.file}`)}
      style={{ position: 'absolute', left: c.x, top: c.y, width: c.width, height: c.height, opacity: p, transform }}
    />
  );
};

const Pagina: React.FC<{ id: string; cap: Captura; inicioFundo: number; inicio: number; passo: number; ajustes: Record<string, Ajuste> }> = ({
  id,
  cap,
  inicioFundo,
  inicio,
  passo,
  ajustes,
}) => {
  const frame = useCurrentFrame();
  const dir = `clientes/${id}/captura/${cap.section}`;
  return (
    // a página é montada no tamanho da viewport capturada e escalada para a tela
    <div style={{ position: 'absolute', left: 0, top: 0, width: VIEWPORT.width, height: VIEWPORT.height, transform: `scale(${S})`, transformOrigin: '0 0' }}>
      {cap.video && (
        // vídeo de fundo do site começa a tocar quando o fundo aparece
        <Sequence from={inicioFundo} layout="none">
          <OffthreadVideo
            src={staticFile(`${dir}/${cap.video}`)}
            muted
            style={{ position: 'absolute', inset: 0, width: VIEWPORT.width, height: VIEWPORT.height, objectFit: 'cover', opacity: prog(frame, inicioFundo, 12) }}
          />
        </Sequence>
      )}
      <Img src={staticFile(`${dir}/fundo.png`)} style={{ position: 'absolute', inset: 0, width: VIEWPORT.width, height: VIEWPORT.height, opacity: prog(frame, inicioFundo, 12) }} />
      {cap.layers.map((c, i) => (
        <CamadaAnimada
          key={c.name}
          dir={dir}
          c={c}
          inicio={inicio + i * passo + (ajustes[`${cap.section}/${c.name}`]?.atraso ?? 0)}
          entrada={ajustes[`${cap.section}/${c.name}`]?.entrada ?? 'sobe'}
        />
      ))}
    </div>
  );
};

export const CenaSite: React.FC<Props> = ({ id, fundo, intro, hero, secao2, ajustes = {}, transicao }) => {
  const frame = useCurrentFrame();
  const pBrowser = prog(frame, T.browserIn, T.browserDur);
  const pScroll = prog(frame, T.scroll, T.scrollDur);
  const altura = BROWSER.height;

  return (
    <AbsoluteFill style={{ background: fundo }}>
      {frame < T.browserIn + T.browserDur && intro(frame)}
      {frame >= T.browserIn && (
        <Browser style={{ transform: `translateY(${mix(pBrowser, H, 0)}px)` }}>
          {/* rolagem: hero sobe e a segunda seção entra por baixo */}
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-pScroll * altura}px)` }}>
            <Pagina id={id} cap={hero} inicioFundo={T.heroFundo} inicio={T.heroCamadas} passo={T.heroPasso} ajustes={ajustes} />
          </div>
          {frame >= T.scroll && (
            <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - pScroll) * altura}px)` }}>
              <Pagina id={id} cap={secao2} inicioFundo={T.scroll} inicio={T.secaoCamadas} passo={T.secaoPasso} ajustes={ajustes} />
            </div>
          )}
          <MenuFixo id={id} topo={hero.menu} rolado={secao2.menu} pRolado={pScroll} opacidade={prog(frame, T.heroFundo, 12)} />
        </Browser>
      )}
      {transicao && <Transicao {...transicao} inicio={T.transicao} dur={TRANSICAO} />}
    </AbsoluteFill>
  );
};

// Menu fixo no topo da tela: não rola com a página. Se o site tem um estado
// "rolado" do menu (ex.: ganha fundo), troca durante a rolagem.
const MenuFixo: React.FC<{ id: string; topo?: MenuCaptura; rolado?: MenuCaptura; pRolado: number; opacidade: number }> = ({ id, topo, rolado, pRolado, opacidade }) => {
  if (!topo) return null;
  const dir = `clientes/${id}/captura`;
  const img = (m: MenuCaptura, o: number) => (
    <Img src={staticFile(`${dir}/${m.file}`)} style={{ position: 'absolute', left: 0, top: 0, width: VIEWPORT.width, height: m.height, opacity: o }} />
  );
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: VIEWPORT.width, height: VIEWPORT.height, transform: `scale(${S})`, transformOrigin: '0 0' }}>
      {img(topo, opacidade * (rolado ? 1 - pRolado : 1))}
      {rolado && img(rolado, opacidade * pRolado)}
    </div>
  );
};

// página já montada (todas as camadas no lugar), usada nos tiles do mural
// videoDe: frame do vídeo de fundo do site (ex.: Plathanus) para mostrar parado
export const PaginaEstatica: React.FC<{ id: string; cap: Captura; menu?: MenuCaptura; videoDe?: number }> = ({ id, cap, menu, videoDe }) => {
  const dir = `clientes/${id}/captura/${cap.section}`;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: VIEWPORT.width, height: VIEWPORT.height, transform: `scale(${S})`, transformOrigin: '0 0' }}>
      {cap.video && videoDe !== undefined && (
        <OffthreadVideo
          src={staticFile(`${dir}/${cap.video}`)}
          muted
          startFrom={videoDe}
          style={{ position: 'absolute', inset: 0, width: VIEWPORT.width, height: VIEWPORT.height, objectFit: 'cover' }}
        />
      )}
      <Img src={staticFile(`${dir}/fundo.png`)} style={{ position: 'absolute', inset: 0, width: VIEWPORT.width, height: VIEWPORT.height }} />
      {cap.layers.map((c) => (
        <Img key={c.name} src={staticFile(`${dir}/${c.file}`)} style={{ position: 'absolute', left: c.x, top: c.y, width: c.width, height: c.height }} />
      ))}
      {menu && <Img src={staticFile(`clientes/${id}/captura/${menu.file}`)} style={{ position: 'absolute', left: 0, top: 0, width: VIEWPORT.width, height: menu.height }} />}
    </div>
  );
};

// centro de uma camada da segunda seção em coordenadas do vídeo (origem de transição)
export const centroCamada = (cap: Captura, nome: string) => {
  const c = cap.layers.find((l) => l.name === nome);
  if (!c) return undefined;
  const left = (W - BROWSER.width) / 2;
  const top = (H - BROWSER.height - BROWSER.bar) / 2 + BROWSER.bar;
  return { x: left + (c.x + c.width / 2) * S, y: top + (c.y + c.height / 2) * S };
};
