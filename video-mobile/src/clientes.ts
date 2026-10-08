import type { Captura } from './scenes/CenaSite';
import sollevoCores from '../public/clientes/sollevo/cores.json';
import plathanusCores from '../public/clientes/plathanus/cores.json';
import attalarCores from '../public/clientes/attalar/cores.json';
import cerejaCores from '../public/clientes/cereja-bloom/cores.json';
import milvusCores from '../public/clientes/milvus/cores.json';
import sollevoHero from '../public/clientes/sollevo/captura/hero/layers.json';
import sollevoSecao from '../public/clientes/sollevo/captura/secao-2/layers.json';
import plathanusHero from '../public/clientes/plathanus/captura/hero/layers.json';
import plathanusSecao from '../public/clientes/plathanus/captura/secao-2/layers.json';
import cerejaHero from '../public/clientes/cereja-bloom/captura/hero/layers.json';
import cerejaSecao from '../public/clientes/cereja-bloom/captura/secao-2/layers.json';
import milvusHero from '../public/clientes/milvus/captura/hero/layers.json';
import milvusSecao from '../public/clientes/milvus/captura/secao-2/layers.json';

export const cores = { sollevo: sollevoCores, plathanus: plathanusCores, attalar: attalarCores, cereja: cerejaCores, milvus: milvusCores };

export const capturas = {
  sollevo: { hero: sollevoHero as Captura, secao2: sollevoSecao as Captura },
  plathanus: { hero: plathanusHero as Captura, secao2: plathanusSecao as Captura },
  cereja: { hero: cerejaHero as Captura, secao2: cerejaSecao as Captura },
  milvus: { hero: milvusHero as Captura, secao2: milvusSecao as Captura },
};

export const SOLLEVO_GRADIENTE = `linear-gradient(210deg, ${sollevoCores.principalGradiente[1]} 0%, ${sollevoCores.principalGradiente[0]} 100%)`;

// JOYCOMBO: só no fechamento
export const JOYCOMBO = { preto: '#000000', branco: '#FFFFFF', verde: '#DCFF01' };
