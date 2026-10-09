import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './lib/anim';
import { MuralCortes } from './scenes/Mural';
import { DURACAO, Video } from './Video';
import { MOCKUP, MOCKUPS, Mockup } from './Mockups';

export const Root: React.FC = () => (
  <>
    <Composition id="HeroClientesMobile" component={Video} durationInFrames={DURACAO} fps={FPS} width={W} height={H} />
    {/* revisão dos cortes do mural */}
    <Composition id="MuralCortesMobile" component={MuralCortes} durationInFrames={1} fps={FPS} width={W} height={H} />
    {/* mockups em PNG transparente (npm run mockups) */}
    {MOCKUPS.map((m) => (
      <Composition
        key={m.id}
        id={`mockup-${m.id}`}
        component={() => <Mockup {...m} />}
        durationInFrames={1}
        fps={FPS}
        width={MOCKUP.width}
        height={MOCKUP.height}
      />
    ))}
  </>
);
