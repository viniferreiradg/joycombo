import React from 'react';
import { AbsoluteFill, Sequence, staticFile } from 'remotion';
import { CENA, LOGO_EXTRA, mix, prog } from './lib/anim';
import { CenaMarca } from './scenes/CenaMarca';
import { CenaSite, centroCamada } from './scenes/CenaSite';
import { Logo } from './scenes/Logo';
import { logo_attalar, logo_cerejabloom, logo_milvus, logo_plathanus, logo_sollevo } from './logos.generated';
import { capturas, cores, SOLLEVO_GRADIENTE } from './clientes';
import { Abertura, ABERTURA } from './scenes/Abertura';
import { Fechamento, FECHAMENTO } from './scenes/Fechamento';

const sollevoCores = cores.sollevo;
const plathanusCores = cores.plathanus;
const attalarCores = cores.attalar;
const cerejaCores = cores.cereja;
const milvusCores = cores.milvus;

const Centro: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', ...style }}>{children}</AbsoluteFill>
);

// saída comum da logo quando o browser entra
const saida = (f: number) => {
  const p = prog(f, 32 + LOGO_EXTRA, 16);
  return { opacity: 1 - p, transform: `translateY(${-p * 120}px) scale(${mix(p, 1, 0.92)})` };
};

// Sollevo: símbolo, depois o nome, depois a assinatura
const introSollevo = (f: number) => {
  const simbolo = prog(f, 0, 16);
  const nome = prog(f, 10, 16);
  const assinatura = prog(f, 20, 14);
  return (
    <AbsoluteFill style={saida(f)}>
      <Centro>
        <Logo
          svg={logo_sollevo}
          id="sollevo"
          width={430}
          color={sollevoCores.clara}
          parts={{
            0: { opacity: simbolo, x: mix(simbolo, -40, 0), y: mix(simbolo, 40, 0) },
            // no SVG: 0 = símbolo, 1 = "ENGENHARIA CRIATIVA", 2 = "Sollevo"
            2: { opacity: nome, y: mix(nome, 30, 0) },
            1: { opacity: assinatura, y: mix(assinatura, 16, 0) },
          }}
        />
      </Centro>
    </AbsoluteFill>
  );
};

// Plathanus: símbolo primeiro, nome depois
const introPlathanus = (f: number) => {
  return (
    <AbsoluteFill style={saida(f)}>
      <Centro>
        <Logo
          svg={logo_plathanus}
          id="plathanus"
          width={760}
          parts={{
            0: { opacity: prog(f, 0, 12), scale: mix(prog(f, 0, 16), 0.4, 1), rotate: mix(prog(f, 0, 16), -90, 0) },
            // no SVG: 0 = símbolo, 1 = "Software & Design", 2 = "PLATHANUS"
            2: { opacity: prog(f, 10, 14), y: mix(prog(f, 10, 14), 40, 0) },
            1: { opacity: prog(f, 18, 12), y: mix(prog(f, 18, 12), 24, 0) },
          }}
        />
      </Centro>
    </AbsoluteFill>
  );
};

// Cereja Bloom: fundo de anéis do universo visual e logo com balanço
const introCereja = (f: number) => {
  const balanco = Math.sin(f / 3.2) * 6 * (1 - prog(f, 6, 30));
  return (
    <AbsoluteFill style={saida(f)}>
      {/* a cena chega no vermelho da transição e revela o fundo de anéis */}
      <AbsoluteFill style={{ background: cores.cereja.principal, opacity: 1 - prog(f, 0, 14) }} />
      <Centro>
        <Logo
          svg={logo_cerejabloom}
          id="cereja"
          width={820}
          style={{ transform: `rotate(${balanco}deg)` }}
          parts={{
            0: { opacity: prog(f, 0, 8), scale: mix(prog(f, 0, 14), 0.2, 1) },
            1: { opacity: prog(f, 5, 8), scale: mix(prog(f, 5, 16), 1.6, 1), y: mix(prog(f, 5, 16), -30, 0) },
          }}
        />
      </Centro>
    </AbsoluteFill>
  );
};

// Milvus: entrada seca e precisa, com o grid de pontos do universo visual
const introMilvus = (f: number) => {
  const c = milvusCores;
  const pontos = [];
  for (let gx = 0; gx < 12; gx++)
    for (let gy = 0; gy < 6; gy++) {
      const p = prog(f, (gx + gy) * 0.8, 8);
      pontos.push(<circle key={`${gx}-${gy}`} cx={gx * 25 + 3} cy={gy * 25 + 3} r={3 * p} fill={c.clara} opacity={0.5} />);
    }
  const pAsa = prog(f, 0, 8);
  return (
    <AbsoluteFill style={saida(f)}>
      <svg width={300} height={150} style={{ position: 'absolute', left: 1500, top: 110 }}>
        {pontos}
      </svg>
      <svg width={300} height={150} style={{ position: 'absolute', left: 150, top: 590 }}>
        {pontos}
      </svg>
      <Centro>
        <Logo
          svg={logo_milvus}
          id="milvus"
          width={680}
          color={c.clara}
          parts={{
            0: { color: c.secundaria, scale: pAsa, opacity: pAsa > 0 ? 1 : 0 },
            1: { opacity: prog(f, 6, 6), y: mix(prog(f, 6, 10), 20, 0) },
          }}
        />
      </Centro>
    </AbsoluteFill>
  );
};

export const DURACAO = ABERTURA + CENA * 5 + FECHAMENTO;

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      <Sequence durationInFrames={ABERTURA} name="Abertura">
        <Abertura />
      </Sequence>
      <Sequence from={ABERTURA} durationInFrames={CENA} name="Sollevo">
        <CenaSite
          id="sollevo"
          fundo={SOLLEVO_GRADIENTE}
          intro={introSollevo}
          hero={capturas.sollevo.hero}
          secao2={capturas.sollevo.secao2}
          transicao={{ tipo: 'listras', fundo: plathanusCores.principal }}
        />
      </Sequence>
      <Sequence from={ABERTURA + CENA} durationInFrames={CENA} name="Plathanus">
        <CenaSite
          id="plathanus"
          fundo={plathanusCores.principal}
          intro={introPlathanus}
          hero={capturas.plathanus.hero}
          secao2={capturas.plathanus.secao2}
          transicao={{ tipo: 'seta', fundo: attalarCores.principal }}
        />
      </Sequence>
      <Sequence from={ABERTURA + CENA * 2} durationInFrames={CENA} name="Attalar">
        <CenaMarca
          id="attalar"
          svg={logo_attalar}
          cores={attalarCores}
          partes={{ simbolo: 1, nome: 0 }}
          simbolo={{ viewBox: '120 60 219 139' }}
          aplicacoes={['clientes/attalar/aplicacoes/fachada.png', 'clientes/attalar/aplicacoes/cartao.png']}
          transicao={{ tipo: 'losango', fundo: cerejaCores.principal }}
        />
      </Sequence>
      <Sequence from={ABERTURA + CENA * 3} durationInFrames={CENA} name="Cereja Bloom">
        <CenaSite
          id="cereja-bloom"
          fundo={`url(${staticFile('clientes/cereja-bloom/fundo-intro.jpg')}) center / cover no-repeat, ${cerejaCores.principal}`}
          intro={introCereja}
          hero={capturas.cereja.hero}
          secao2={capturas.cereja.secao2}
          ajustes={{ 'hero/lettering': { entrada: 'escala' } }}
          transicao={{ tipo: 'circulo', fundo: milvusCores.principal, origem: centroCamada(capturas.cereja.secao2, 'capa') }}
        />
      </Sequence>
      <Sequence from={ABERTURA + CENA * 4} durationInFrames={CENA} name="Milvus">
        <CenaSite
          id="milvus"
          fundo={milvusCores.principal}
          intro={introMilvus}
          hero={capturas.milvus.hero}
          secao2={capturas.milvus.secao2}
          ajustes={{
            'hero/h1-azul': { atraso: 4 },
            'hero/mockup': { entrada: 'direita', atraso: 4 },
            'secao-2/celular': { entrada: 'direita' },
            'secao-2/robo': { entrada: 'escala' },
          }}
        />
      </Sequence>
      <Sequence from={ABERTURA + CENA * 5} durationInFrames={FECHAMENTO} name="Fechamento">
        <Fechamento />
      </Sequence>
    </AbsoluteFill>
  );
};
