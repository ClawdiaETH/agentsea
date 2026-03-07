import type { LayerFn } from '../types';

/** Layer 3: Market cap momentum overlay */
export const momentum: LayerFn = (ctx, _rng, dayLog, _colors) => {
  const { momentumSign, change24h } = dayLog;
  if (!momentumSign) return;

  const opacity = Math.min(0.30, (Math.abs(change24h) / 20) * 0.30);
  const color = momentumSign > 0
    ? `hsla(130, 70%, 45%, ${opacity})`
    : `hsla(0, 70%, 45%, ${opacity})`;

  const grad = ctx.createLinearGradient(0, 760 * 0.3, 0, 760 * 0.7);
  grad.addColorStop(0, 'hsla(0,0%,0%,0)');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 760, 760);
};
