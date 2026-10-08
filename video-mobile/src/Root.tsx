import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './lib/anim';
import { MuralCortes } from './scenes/Mural';
import { DURACAO, Video } from './Video';

export const Root: React.FC = () => (
  <>
    <Composition id="HeroClientesMobile" component={Video} durationInFrames={DURACAO} fps={FPS} width={W} height={H} />
    {/* revisão dos cortes do mural */}
    <Composition id="MuralCortesMobile" component={MuralCortes} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
