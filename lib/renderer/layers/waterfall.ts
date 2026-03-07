import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layer 5: Waterfall streaks — wide gradient columns */
export const waterfall: LayerFn = (ctx, rng, dayLog, colors) => {
  const widthMult = 1.0 + dayLog.mcapNorm * 1.2; // 1.0–2.2×
  const streakCount = 8 + Math.floor(rng() * 8);  // 8–15

  for (let i = 0; i < streakCount; i++) {
    const x = Math.floor(rng() * 760);
    const w = Math.floor((20 + rng() * 40) * widthMult); // 20–60px scaled
    const h = 100 + Math.floor(rng() * 320);
    const y = Math.floor(rng() * (760 - h));
    const col = [colors.DOM, colors.SEC, colors.ACC][Math.floor(rng() * 3)];
    const alpha = 0.30 + rng() * 0.30; // 0.30–0.60

    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'hsla(0,0%,0%,0)');
    grad.addColorStop(0.2, withAlpha(col, alpha));
    grad.addColorStop(0.8, withAlpha(col, alpha));
    grad.addColorStop(1, 'hsla(0,0%,0%,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
};
