import type { LayerFn } from '../types';

/** Palette name label in a bordered box, top-left corner */
export const paletteLabel: LayerFn = (ctx, _rng, dayLog, colors) => {
  const label = (dayLog.paletteId ?? '').toUpperCase();
  if (!label) return;

  ctx.font = 'bold 12px JetBrainsMono';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const metrics = ctx.measureText(label);
  const x = 12;
  const y = 12;
  const padH = 8;
  const padV = 6;
  const boxW = metrics.width + padH * 2;
  const boxH = 14 + padV * 2;

  // Dark filled background
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = colors.BLK;
  ctx.fillRect(x - padH, y - padV, boxW, boxH);

  // Bright border outline
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = colors.WHT;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - padH, y - padV, boxW, boxH);

  // Label text
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = colors.WHT;
  ctx.fillText(label, x, y);

  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
};
