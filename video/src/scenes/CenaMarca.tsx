import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CENA, H, LOGO_EXTRA, TRANSICAO, mix, prog } from '../lib/anim';
import { Logo } from './Logo';
import { Transicao, type TipoTransicao } from './Transicao';

type Props = {
  id: string;
  svg: string;
  cores: { principal: string; escura: string; clara: string };
  // índice das partes do SVG
  partes: { simbolo: number; nome: number };
  // largura do símbolo isolado em relação ao logo inteiro e onde ele fica (para recortar)
  simbolo: { viewBox: string };
  aplicacoes: string[];
  transicao: { tipo: TipoTransicao; fundo: string };
};

// Linha do tempo da cena de marca (7s / 210 frames)
const M = { blocos: 46 + LOGO_EXTRA, passo: 6, blocoDur: 20, trocaAplicacao: 100 + LOGO_EXTRA, transicao: CENA - TRANSICAO };

const Bloco: React.FC<{ x: number; y: number; w: number; h: number; de: 'esq' | 'dir' | 'cima' | 'baixo'; inicio: number; fundo: string; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  de,
  inicio,
  fundo,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, inicio, M.blocoDur);
  const r = `${(1 - p) * 100}%`;
  const clip = { esq: `inset(0 ${r} 0 0)`, dir: `inset(0 0 0 ${r})`, cima: `inset(0 0 ${r} 0)`, baixo: `inset(${r} 0 0 0)` }[de];
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: fundo, clipPath: clip, overflow: 'hidden' }}>{children}</div>;
};

export const CenaMarca: React.FC<Props> = ({ id, svg, cores, partes, simbolo, aplicacoes, transicao }) => {
  const frame = useCurrentFrame();
  const { principal, escura, clara } = cores;

  // 1) logo grande negativa sobre a cor principal
  const pSimb = prog(frame, 2, 18);
  const pNome = prog(frame, 10, 18);
  const deriva = mix(prog(frame, 0, M.blocos), 1.04, 1);

  // 2) mini brandbook
  const i0 = M.blocos;
  const pTroca = prog(frame, M.trocaAplicacao, 18);
  const ken = mix(prog(frame, i0, CENA), 1.12, 1.02);

  // símbolo isolado: o mesmo SVG com o nome escondido, recortado no viewBox do símbolo
  const svgSimbolo = svg.replace(/viewBox="[^"]*"/, `viewBox="${simbolo.viewBox}"`);

  return (
    <AbsoluteFill style={{ background: principal, overflow: 'hidden' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${deriva})` }}>
        <Logo
          svg={svg}
          id={`${id}-grande`}
          width={600}
          color={clara}
          parts={{
            [partes.simbolo]: { opacity: pSimb, x: mix(pSimb, -80, 0), y: mix(pSimb, 80, 0) },
            [partes.nome]: { opacity: pNome, y: mix(pNome, 50, 0) },
          }}
        />
      </AbsoluteFill>

      {/* aplicação */}
      <Bloco x={0} y={0} w={960} h={H} de="esq" inicio={i0} fundo={escura}>
        {aplicacoes.slice(0, 2).map((src, i) => (
          <Img
            key={src}
            src={staticFile(src)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${ken})`,
              clipPath: i === 1 ? `inset(0 0 0 ${(1 - pTroca) * 100}%)` : undefined,
            }}
          />
        ))}
      </Bloco>

      {/* paleta */}
      <Bloco x={960} y={0} w={480} h={H / 2} de="cima" inicio={i0 + M.passo} fundo={clara}>
        {[principal, escura, clara].map((c, i) => {
          const p = prog(frame, i0 + M.passo + 8 + i * 4, 18);
          return (
            <div
              key={c}
              style={{ position: 'absolute', left: i * 160, bottom: 0, width: 160, height: `${p * 100}%`, background: c, borderLeft: c === clara ? `1px solid ${escura}14` : undefined }}
            />
          );
        })}
      </Bloco>

      {/* símbolo (versão avatar) */}
      <Bloco x={1440} y={0} w={480} h={H / 2} de="dir" inicio={i0 + M.passo * 2} fundo={escura}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: 120,
              background: principal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${mix(prog(frame, i0 + M.passo * 2 + 8, 20), 0.6, 1)})`,
            }}
          >
            <Logo svg={svgSimbolo} id={`${id}-simbolo`} width={150} color={clara} parts={{ [partes.nome]: { opacity: 0 } }} />
          </div>
        </AbsoluteFill>
      </Bloco>

      {/* logo positiva + losangos */}
      <Bloco x={960} y={H / 2} w={960} h={H / 2} de="baixo" inicio={i0 + M.passo * 3} fundo={clara}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const p = prog(frame, i0 + M.passo * 3 + 10 + i * 3, 16);
          const lado = i % 2 ? 1 : -1;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 480 + lado * 380 - 14,
                top: 70 + Math.floor(i / 2) * 110,
                width: 28,
                height: 40,
                border: `2px solid ${principal}`,
                transform: `rotate(45deg) scale(${p}, ${p * 1.4})`,
                opacity: p,
              }}
            />
          );
        })}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Logo
            svg={svg}
            id={`${id}-positiva`}
            width={420}
            parts={{ [partes.simbolo]: { opacity: prog(frame, i0 + M.passo * 3 + 8, 16) }, [partes.nome]: { opacity: prog(frame, i0 + M.passo * 3 + 12, 16) } }}
          />
        </AbsoluteFill>
      </Bloco>

      <Transicao {...transicao} origem={{ x: 1680, y: H / 4 }} inicio={M.transicao} dur={TRANSICAO} />
    </AbsoluteFill>
  );
};
