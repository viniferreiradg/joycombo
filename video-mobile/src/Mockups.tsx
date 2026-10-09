import React from 'react';
import { capturas } from './clientes';
import { Browser, BROWSER } from './scenes/Browser';
import { PaginaEstatica, type Captura, type MenuCaptura } from './scenes/CenaSite';

// Mockups estáticos (celular com a página montada) sem o fundo da marca,
// para exportar em PNG transparente: `npm run mockups`.
const BORDA = 14;
export const MOCKUP = { width: BROWSER.width + BORDA * 2, height: BROWSER.height + BORDA * 2 };

export const MOCKUPS: { id: string; site: string; cap: Captura; menu?: MenuCaptura; videoDe?: number }[] = [
  { id: 'sollevo-hero', site: 'sollevo', cap: capturas.sollevo.hero, menu: capturas.sollevo.hero.menu },
  { id: 'sollevo-servicos', site: 'sollevo', cap: capturas.sollevo.secao2, menu: capturas.sollevo.hero.menu },
  { id: 'plathanus-hero', site: 'plathanus', cap: capturas.plathanus.hero, menu: capturas.plathanus.hero.menu, videoDe: 51 },
  { id: 'plathanus-numeros', site: 'plathanus', cap: capturas.plathanus.secao2, menu: capturas.plathanus.hero.menu },
  { id: 'cereja-bloom-hero', site: 'cereja-bloom', cap: capturas.cereja.hero, menu: capturas.cereja.hero.menu },
  { id: 'cereja-bloom-musicas', site: 'cereja-bloom', cap: capturas.cereja.secao2, menu: capturas.cereja.secao2.menu ?? capturas.cereja.hero.menu },
  { id: 'milvus-hero', site: 'milvus', cap: capturas.milvus.hero, menu: capturas.milvus.hero.menu },
  { id: 'milvus-chatbot', site: 'milvus', cap: capturas.milvus.secao2, menu: capturas.milvus.hero.menu },
];

export const Mockup: React.FC<{ site: string; cap: Captura; menu?: MenuCaptura; videoDe?: number }> = ({ site, cap, menu, videoDe }) => (
  <Browser style={{ left: 0, top: 0, boxShadow: 'none' }}>
    <PaginaEstatica id={site} cap={cap} menu={menu} videoDe={videoDe} />
  </Browser>
);
