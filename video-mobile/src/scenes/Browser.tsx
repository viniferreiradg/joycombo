import React from 'react';
import { H, W } from '../lib/anim';

// Versão mobile: os sites aparecem na versão de celular, dentro de um aparelho
// neutro (preto e branco puros), idêntico em todas as cenas de site.

// viewport em que os sites foram capturados (scripts/capture.ts)
export const VIEWPORT = { width: 430, height: 932 };
// tela do celular no vídeo (mesma proporção da viewport); bar = 0 porque não há barra de browser
export const BROWSER = { width: 508, height: 1101, bar: 0 };
const BORDA = 14;

export const Browser: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const { width, height } = BROWSER;
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - width) / 2 - BORDA,
        top: (H - height) / 2 - BORDA,
        width: width + BORDA * 2,
        height: height + BORDA * 2,
        borderRadius: 64,
        padding: BORDA,
        background: '#000000',
        boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
        ...style,
      }}
    >
      <div style={{ position: 'relative', width, height, borderRadius: 50, overflow: 'hidden', background: '#FFFFFF' }}>{children}</div>
    </div>
  );
};
