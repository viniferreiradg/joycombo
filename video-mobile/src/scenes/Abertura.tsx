import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { prog } from '../lib/anim';
import { ALVO_ABERTURA, MURAL_ABERTURA, Mural } from './Mural';

export const ABERTURA = 90;

// Mural de mockups (neutro, sem JOYCOMBO) com zoom no tile da Sollevo
export const Abertura: React.FC = () => {
  const f = useCurrentFrame();
  // o tile da Sollevo passa pelo centro em MURAL_ABERTURA: o zoom começa ali
  const zoom = prog(f, MURAL_ABERTURA, ABERTURA - MURAL_ABERTURA);
  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      <AbsoluteFill style={{ opacity: prog(f, 0, 10) }}>
        <Mural tempo={f} zoom={zoom} alvo={ALVO_ABERTURA} browserAlvo={1 - prog(f, 74, 14)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
