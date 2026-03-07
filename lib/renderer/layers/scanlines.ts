import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layer 17: Scan lines — every 2px, opacity scales with glitch index */
export const scanlines: LayerFn = (ctx, _rng, dayLog, colors) => {
  const intensity = (dayLog.glitchIndex ?? 0) / 100;
  const opacity = 0.06 + intensity * 0.10;
  ctx.fillStyle = withAlpha(colors.BLK, opacity);
  for (let y = 0; y < 760; y += 2) {
    ctx.fillRect(0, y, 760, 1);
  }
};
