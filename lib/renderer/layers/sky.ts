import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layer 4: DOM color sky gradient — top 60% of canvas */
export const sky: LayerFn = (ctx, _rng, _dayLog, colors) => {
  const grad = ctx.createLinearGradient(0, 0, 0, 760 * 0.6);
  grad.addColorStop(0, withAlpha(colors.DOM, 0.35));
  grad.addColorStop(0.6, withAlpha(colors.DOM, 0.10));
  grad.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 760, 760 * 0.6);
};
