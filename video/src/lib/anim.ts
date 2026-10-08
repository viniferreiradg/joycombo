import { Easing, interpolate } from 'remotion';

// Uma única curva para o vídeo inteiro (ease-out quint)
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

// progresso 0→1 entre dois frames, com a curva do vídeo
export const prog = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const mix = (p: number, a: number, b: number) => a + (b - a) * p;

export const FPS = 30;
export const W = 1920;
// formato do hero do site: faixa larga 1920x840
export const H = 840;
// 7s por cliente (a logo fica ~2s sozinha na tela antes do browser entrar)
export const CENA = 210;
export const LOGO_EXTRA = 30; // tempo a mais segurando a logo
export const TRANSICAO = 30; // últimos frames de cada cena: cor do próximo invade
