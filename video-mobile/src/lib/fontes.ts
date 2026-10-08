import { continueRender, delayRender, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Sora';

export const { fontFamily: SORA } = loadFont('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] });

export const JOYCOMBO_SORA = 'Joycombo Sora';

const espera = delayRender('Fonte Joycombo Sora Bold');
new FontFace(JOYCOMBO_SORA, `url(${staticFile('joycombo/fontes/joycombo-sora-bold.woff2')}) format('woff2')`, { weight: '700' })
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(espera);
  })
  .catch((e) => {
    console.error(e);
    continueRender(espera);
  });
