import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { mix, prog, W, H } from '../lib/anim';

// Forma da invasão sai de um elemento da marca que está saindo
export type TipoTransicao = 'listras' | 'seta' | 'losango' | 'circulo' | 'asa';

type Props = {
  tipo: TipoTransicao;
  // cor (ou gradiente) do PRÓXIMO cliente
  fundo: string;
  origem?: { x: number; y: number };
  inicio: number;
  dur: number;
};

export const Transicao: React.FC<Props> = ({ tipo, fundo, origem = { x: W / 2, y: H / 2 }, inicio, dur }) => {
  const frame = useCurrentFrame();
  if (frame < inicio) return null;
  const p = prog(frame, inicio, dur);
  const { x, y } = origem;

  if (tipo === 'listras') {
    // faixas diagonais, como o símbolo da Sollevo
    const D = Math.hypot(W, H) + 200;
    const n = 4;
    return (
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: W / 2 - D / 2, top: H / 2 - D / 2, width: D, height: D, transform: 'rotate(-45deg)' }}>
          {Array.from({ length: n }).map((_, i) => {
            const pi = prog(frame, inicio + i * 3, dur - 9);
            return (
              <div
                key={i}
                style={{ position: 'absolute', left: 0, top: (D / n) * i - 1, width: D, height: D / n + 2, background: fundo, transform: `translateX(${mix(pi, i % 2 ? D : -D, 0)}px)` }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  let clip = '';
  if (tipo === 'circulo') {
    const r = mix(p, 0, Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 10);
    clip = `circle(${r}px at ${x}px ${y}px)`;
  } else if (tipo === 'losango') {
    const r = mix(p, 0, Math.max(x, W - x) + Math.max(y, H - y) + 10);
    clip = `polygon(${x}px ${y - r}px, ${x + r}px ${y}px, ${x}px ${y + r}px, ${x - r}px ${y}px)`;
  } else if (tipo === 'seta') {
    // chevron subindo, como as setas da Plathanus
    const ponta = 520;
    const top = mix(p, H + 20, -ponta - 20);
    clip = `polygon(0px ${top + ponta}px, ${x}px ${top}px, ${W}px ${top + ponta}px, ${W}px ${H + 2000}px, 0px ${H + 2000}px)`;
  } else if (tipo === 'asa') {
    // borda em V descendo, como a asa da Milvus
    const v = 260;
    const yb = mix(p, -v - 20, H + 20);
    clip = `polygon(0px -10px, ${W}px -10px, ${W}px ${yb}px, ${x}px ${yb + v}px, 0px ${yb}px)`;
  }
  return <AbsoluteFill style={{ background: fundo, clipPath: clip }} />;
};
