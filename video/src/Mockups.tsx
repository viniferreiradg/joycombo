import React from 'react';
import { capturas } from './clientes';
import { Browser, BROWSER } from './scenes/Browser';
import { PaginaEstatica, type Captura } from './scenes/CenaSite';

// Mockups estáticos (browser com a página montada) sem o fundo da marca,
// para exportar em PNG transparente: `npm run mockups`.
export const MOCKUP = { width: BROWSER.width, height: BROWSER.height + BROWSER.bar };

export const MOCKUPS: { id: string; site: string; cap: Captura; videoDe?: number }[] = [
  { id: 'sollevo-hero', site: 'sollevo', cap: capturas.sollevo.hero },
  { id: 'sollevo-servicos', site: 'sollevo', cap: capturas.sollevo.secao2 },
  { id: 'plathanus-hero', site: 'plathanus', cap: capturas.plathanus.hero, videoDe: 51 },
  { id: 'plathanus-numeros', site: 'plathanus', cap: capturas.plathanus.secao2 },
  { id: 'cereja-bloom-hero', site: 'cereja-bloom', cap: capturas.cereja.hero },
  { id: 'cereja-bloom-musicas', site: 'cereja-bloom', cap: capturas.cereja.secao2 },
  { id: 'milvus-hero', site: 'milvus', cap: capturas.milvus.hero },
  { id: 'milvus-chatbot', site: 'milvus', cap: capturas.milvus.secao2 },
];

export const Mockup: React.FC<{ site: string; cap: Captura; videoDe?: number }> = ({ site, cap, videoDe }) => (
  <Browser style={{ left: 0, top: 0, boxShadow: 'none' }}>
    <PaginaEstatica id={site} cap={cap} videoDe={videoDe} />
  </Browser>
);
