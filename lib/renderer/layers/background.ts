import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layers 1+2: Background fill + gradient wash + pixel noise */
export const background: LayerFn = (ctx, rng, _dayLog, colors) => {
  ctx.fillStyle = colors.BLK;
  ctx.fillRect(0, 0, 760, 760);

  // Subtle gradient wash to add depth
  const bgGrad = ctx.createLinearGradient(0, 0, 760, 760);
  bgGrad.addColorStop(0, withAlpha(colors.DOM, 0.08));
  bgGrad.addColorStop(1, withAlpha(colors.SEC, 0.06));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 760, 760);

  // Pixel noise — more visible (0.08–0.28 alpha)
  const noiseCount = 1200 + Math.floor(rng() * 600);
  for (let i = 0; i < noiseCount; i++) {
    const x = Math.floor(rng() * 760);
    const y = Math.floor(rng() * 760);
    const alpha = 0.08 + rng() * 0.20;
    ctx.fillStyle = withAlpha(rng() < 0.5 ? colors.DOM : colors.WHT, alpha);
    ctx.fillRect(x, y, 1, 1);
  }
};
