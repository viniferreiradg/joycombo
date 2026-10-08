import React, { useMemo } from 'react';

export type PartStyle = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  // 0→1: desenho do contorno (traço técnico); 1 = traço completo
  draw?: number;
  // opacidade do preenchimento (para o efeito de traço antes de preencher)
  fill?: number;
  color?: string;
  stroke?: string;
};

type Props = {
  svg: string;
  id: string;
  width: number;
  // estilo por parte (filhos de primeiro nível do SVG, na ordem do arquivo)
  parts?: Record<number, PartStyle>;
  // recolore tudo (versão negativa/monocromática)
  color?: string;
  // recolore só algumas classes do SVG original: { 'cls-1': '#303030' }
  classColors?: Record<string, string>;
  style?: React.CSSProperties;
};

// Renderiza um SVG de logo marcando cada filho de primeiro nível com data-part
// para animar símbolo, nome e assinatura separadamente.
export const Logo: React.FC<Props> = ({ svg, id, width, parts = {}, color, classColors = {}, style }) => {
  const markup = useMemo(() => {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = doc.documentElement;
    root.removeAttribute('id');
    root.setAttribute('width', '100%');
    root.removeAttribute('height');
    root.setAttribute('style', 'display:block');
    root.setAttribute('overflow', 'visible');
    let i = 0;
    for (const child of Array.from(root.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'defs' || tag === 'style') continue;
      if (tag === 'line') {
        child.remove(); // guias sem traço que vêm no arquivo
        continue;
      }
      child.setAttribute('data-part', String(i++));
    }
    root.querySelectorAll('path, polygon, rect').forEach((el) => el.setAttribute('pathLength', '1'));
    return root.outerHTML;
  }, [svg]);

  const prefix = id.replace(/[^a-z]/g, '');
  const sel = `[data-logo="${id}"]`;
  let css = '';
  if (color) css += `${sel} path, ${sel} polygon, ${sel} rect { fill: ${color} !important; }`;
  for (const [cls, c] of Object.entries(classColors)) css += `${sel} .${prefix}-${cls} { fill: ${c} !important; }`;
  for (const [k, p] of Object.entries(parts)) {
    const s = `${sel} [data-part="${k}"]`;
    const t = `translate(${p.x ?? 0}px, ${p.y ?? 0}px) scale(${p.scale ?? 1}) rotate(${p.rotate ?? 0}deg)`;
    css += `${s} { opacity: ${p.opacity ?? 1}; transform: ${t}; transform-box: fill-box; transform-origin: center; }`;
    if (p.color) css += `${s} path, ${s} polygon, ${s} rect { fill: ${p.color} !important; }`;
    if (p.draw !== undefined) {
      const stroke = p.stroke ?? color ?? '#000000';
      css += `${s} path, ${s} polygon, ${s} rect { stroke: ${stroke}; stroke-width: 1.2px; vector-effect: non-scaling-stroke; stroke-dasharray: 1 1; stroke-dashoffset: ${1 - p.draw}; fill-opacity: ${p.fill ?? 1}; stroke-opacity: ${1 - (p.fill ?? 0)}; }`;
    }
  }

  return (
    <div data-logo={id} style={{ width, ...style }}>
      <style>{css}</style>
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
};
