import type { LayerFn } from '../types';

/** Palette name label in the top-left corner with dark backing for legibility */
export const paletteLabel: LayerFn = (ctx, _rng, dayLog, colors) => {
  const label = (dayLog.paletteId ?? '').toUpperCase();
  if (!label) return;

  ctx.font = 'bold 11px JetBrainsMono';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Measure text for background pill
  const metrics = ctx.measureText(label);
  const px = 10;
  const py = 10;
  const padH = 6;
  const padV = 4;

  // Dark backing pill
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = colors.BLK;
  ctx.fillRect(px - padH, py - padV, metrics.width + padH * 2, 11 + padV * 2);

  // Label text
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = colors.WHT;
  ctx.fillText(label, px, py);

  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
};
