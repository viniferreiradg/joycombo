import React from 'react';
import { H, W } from '../lib/anim';

// Frame de browser neutro (preto e branco puros), idêntico em todas as cenas de site
// viewport 16:9 (igual à captura dos sites), centrada no quadro 1920x840
export const BROWSER = { width: 1216, height: 684, bar: 40 };

export const Browser: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const { width, height, bar } = BROWSER;
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - width) / 2,
        top: (H - height - bar) / 2,
        width,
        height: height + bar,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 40px 80px rgba(0,0,0,0.28)',
        ...style,
      }}
    >
      <div style={{ height: bar, background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.16)' }} />
        ))}
        <div style={{ marginLeft: 16, flex: 1, maxWidth: 520, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.06)' }} />
      </div>
      <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#FFFFFF' }}>{children}</div>
    </div>
  );
};
