import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion';
import { getLength, getPointAtLength, getTangentAtLength } from '@remotion/paths';
import { JOYCOMBO } from '../clientes';
import { H, W, mix, prog } from '../lib/anim';
import { JOYCOMBO_SORA, SORA } from '../lib/fontes';
import { ALVO_FECHAMENTO, MURAL_FECHAMENTO, Mural } from './Mural';

// o CTA segura 4s na tela antes do fade para preto (que emenda no começo)
export const FECHAMENTO = 267;

const F = { zoomOut: 0, zoomDur: 30, apagar: 30, apagarDur: 30, voo: 58, vooDur: 50, pouso: 104, cta: 112, fade: 252 };

// Logo JOYCOMBO (public/joycombo/logo-joycombo.svg). O Y fica de fora: quem faz o Y é a nave.
const LOGO_VB = { w: 858.17, h: 123.77 };
const LOGO_SEM_Y = [
  'M734.39,0h-90.77v123.77h115.53V49.51h-24.75V0ZM726.15,90.77h-49.51s0-57.76,0-57.76h24.75v41.26h24.77v16.5Z',
  'M486.85 0L486.86 123.77L519.86 123.77L519.85 33.01L544.61 33.01L544.62 123.77L577.63 123.77L577.61 33.01L602.37 33.01L602.38 123.77L635.39 123.77L635.37 0Z',
  'M387.83,0v123.77h90.78V0h-90.78ZM420.85,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z',
  'M99.01,0v123.77h90.78V0h-90.78ZM132.03,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z',
  'M858.16,0h-90.77v123.77h90.78V0ZM800.41,90.77v-57.76s24.74,0,24.74,0v57.76s-24.74,0-24.74,0Z',
  'M297.06 123.77L379.58 123.77L379.58 90.77L330.07 90.76L330.07 33.01L379.58 33.01L379.58 0L297.06 0Z',
  'M57.76 0L57.76 90.77L33 90.77L33 74.27L0 74.27L0 123.77L90.76 123.77L90.76 74.27L90.75 0Z',
];
const Y_CENTRO = { x: (198.03 + 288.81) / 2, y: 123.77 / 2 };

// Nave (public/joycombo/nave.svg): é o Y girado 90°, bico para a esquerda
const NAVE_PONTOS = '83.32 50.72 9.67 50.72 9.67 99.79 83.32 99.79 83.32 142.83 132.39 142.83 193.95 142.82 193.95 93.69 132.39 93.7 132.39 56.83 193.95 56.82 193.95 7.68 132.39 7.7 83.32 7.68';
const NAVE_VB = { x: 9.67, y: 7.68, w: 184.28, h: 135.15 };
const NAVE_PARA_Y = 90.78 / 135.15; // a nave reduzida vira exatamente o Y

const LOGO_W = 900;
const K = LOGO_W / LOGO_VB.w;
const LOGO_H = LOGO_VB.h * K;
const LOGO_X = (W - LOGO_W) / 2;
// logo + frase centralizados no quadro
const LOGO_CY = H / 2 - 95;
const LOGO_Y = LOGO_CY - LOGO_H / 2;
const YX = LOGO_X + Y_CENTRO.x * K;
const ESQ = LOGO_X - 90;

// rota: entra pelo canto inferior direito, passa da direita para a esquerda
// revelando as letras, faz a curva por cima e desce de bico para baixo no lugar do Y
const ROTA_PARTES = [
  `M ${W + 200} ${LOGO_CY + 360}`,
  `C ${W - 20} ${LOGO_CY + 360} ${LOGO_X + LOGO_W + 160} ${LOGO_CY} ${LOGO_X + LOGO_W + 40} ${LOGO_CY}`,
  `L ${ESQ} ${LOGO_CY}`,
  `C ${ESQ - 230} ${LOGO_CY} ${ESQ - 190} ${LOGO_CY - 260} ${(ESQ + YX) / 2} ${LOGO_CY - 260}`,
  `C ${YX - 30} ${LOGO_CY - 260} ${YX} ${LOGO_CY - 230} ${YX} ${LOGO_CY - 150}`,
  `L ${YX} ${LOGO_CY}`,
];
const ROTA = ROTA_PARTES.join(' ');
const ROTA_LEN = getLength(ROTA);
// ponto da rota em que a nave passa da última letra (J): dali em diante a logo está toda revelada
const LEN_ESQ = getLength(ROTA_PARTES.slice(0, 3).join(' '));
const PIXEL = 14;

// a rota é fixa e válida: os helpers só devolvem null fora dela
const noPonto = (l: number) => getPointAtLength(ROTA, l)!;
const tangente = (l: number) => getTangentAtLength(ROTA, l)!;

const ponto = (f: number) => {
  const p = interpolate(f, [F.voo, F.voo + F.vooDur], [0, 1], { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return p * ROTA_LEN;
};

export const Fechamento: React.FC = () => {
  const f = useCurrentFrame();

  // 1) zoom out da Milvus revelando o mural; 2) tiles apagam de fora para o centro
  // espelho do zoom da abertura: sai devagar da Milvus
  const zoom = prog(F.zoomOut + F.zoomDur - f, 0, F.zoomDur);
  const apagar = interpolate(f, [F.apagar, F.apagar + F.apagarDur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 3) voo da nave
  const len = ponto(f);
  const pos = noPonto(len);
  const tan = tangente(len);
  const angulo = (Math.atan2(tan.y, tan.x) * 180) / Math.PI - 180;
  const voando = f >= F.voo;
  const revelado = len >= LEN_ESQ ? 0 : Math.min(LOGO_W, Math.max(0, pos.x - LOGO_X));
  const preenche = prog(f, F.pouso, 8);

  // rastro pixelado: blocos na grade que somem com o tempo
  const rastro: React.ReactNode[] = [];
  if (voando) {
    const VIDA = 12;
    for (let g = Math.max(F.voo, f - VIDA); g <= Math.min(f, F.voo + F.vooDur); g++) {
      for (let sub = 0; sub < 4; sub++) {
        const l = ponto(g - 1 + (sub + 1) / 4) - 50;
        if (l < 0) continue;
        const pt = noPonto(l);
        const tg = tangente(l);
        const idade = (f - g) / VIDA;
        for (let j = -4; j <= 4; j++) {
          const seed = `${g}-${sub}-${j}`;
          if (random(seed) > 0.55 - Math.abs(j) * 0.06) continue;
          const px = Math.round((pt.x - tg.y * j * PIXEL) / PIXEL) * PIXEL;
          const py = Math.round((pt.y + tg.x * j * PIXEL) / PIXEL) * PIXEL;
          const lado = PIXEL * (1 - idade * 0.6);
          rastro.push(
            <div
              key={seed}
              style={{ position: 'absolute', left: px - lado / 2, top: py - lado / 2, width: lado, height: lado, background: JOYCOMBO.verde, opacity: 1 - idade }}
            />,
          );
        }
      }
    }
  }

  const s = K * NAVE_PARA_Y; // escala da nave = tamanho do Y
  const naveW = NAVE_VB.w * s;
  const naveH = NAVE_VB.h * s;
  const pCta = prog(f, F.cta, 20);

  return (
    <AbsoluteFill style={{ background: JOYCOMBO.preto }}>
      {f < F.apagar + F.apagarDur && <Mural tempo={MURAL_FECHAMENTO + f} zoom={zoom} alvo={ALVO_FECHAMENTO} apagar={apagar} />}

      {voando && (
        <>
          <svg
            width={LOGO_W}
            height={LOGO_H}
            viewBox={`0 0 ${LOGO_VB.w} ${LOGO_VB.h}`}
            style={{ position: 'absolute', left: LOGO_X, top: LOGO_Y, clipPath: `inset(0 0 0 ${revelado}px)` }}
          >
            {LOGO_SEM_Y.map((d) => (
              <path key={d} d={d} fill={JOYCOMBO.branco} />
            ))}
          </svg>
          {rastro}
          <svg
            width={naveW}
            height={naveH}
            viewBox={`${NAVE_VB.x} ${NAVE_VB.y} ${NAVE_VB.w} ${NAVE_VB.h}`}
            overflow="visible"
            style={{ position: 'absolute', left: pos.x - naveW / 2, top: pos.y - naveH / 2, transform: `rotate(${angulo}deg)` }}
          >
            <polygon
              points={NAVE_PONTOS}
              fill={JOYCOMBO.branco}
              fillOpacity={preenche}
              stroke={JOYCOMBO.verde}
              strokeOpacity={1 - preenche}
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </>
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: LOGO_Y + LOGO_H + 70,
          textAlign: 'center',
          opacity: pCta,
          transform: `translateY(${mix(pCta, 24, 0)}px)`,
          color: JOYCOMBO.branco,
          fontSize: 44,
          lineHeight: 1.35,
        }}
      >
        <div style={{ fontFamily: SORA, fontWeight: 400 }}>Pensando no futuro do seu negócio?</div>
        <div style={{ fontFamily: JOYCOMBO_SORA, fontWeight: 700, color: JOYCOMBO.verde }}>Bora construir junto.</div>
      </div>

      <AbsoluteFill style={{ background: JOYCOMBO.preto, opacity: prog(f, F.fade, FECHAMENTO - F.fade) }} />
    </AbsoluteFill>
  );
};
