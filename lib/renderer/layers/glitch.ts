import type { LayerFn } from '../types';

/**
 * Layer 10: Horizontal pixel displacement + RGB channel split.
 * Always applies minimum glitch (effectiveIntensity ≥ 0.15).
 */
export const glitch: LayerFn = (ctx, rng, dayLog, _colors) => {
  const intensity = (dayLog.glitchIndex ?? 0) / 100;
  const eff = Math.max(0.15, intensity);

  // Phase 1: pixel displacement bands (8–20)
  const bandCount = 8 + Math.floor(eff * 12);
  const imgData = ctx.getImageData(0, 0, 760, 760);
  const data = imgData.data;

  for (let b = 0; b < bandCount; b++) {
    const y     = Math.floor(rng() * 760);
    const bandH = 1 + Math.floor(eff * 6);
    const shift = Math.floor((rng() - 0.5) * eff * 160); // ±80px max
    if (shift === 0) continue;

    for (let row = y; row < Math.min(y + bandH, 760); row++) {
      const rowOffset = row * 760 * 4;
      if (shift > 0) {
        for (let x = 759; x >= shift; x--) {
          const dst = rowOffset + x * 4, src = rowOffset + (x - shift) * 4;
          data[dst] = data[src]; data[dst+1] = data[src+1];
          data[dst+2] = data[src+2]; data[dst+3] = data[src+3];
        }
      } else {
        const abs = -shift;
        for (let x = 0; x < 760 - abs; x++) {
          const dst = rowOffset + x * 4, src = rowOffset + (x + abs) * 4;
          data[dst] = data[src]; data[dst+1] = data[src+1];
          data[dst+2] = data[src+2]; data[dst+3] = data[src+3];
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Phase 2: RGB channel split (chromatic aberration)
  const splitEff  = Math.max(0.2, eff);
  const redShift  = Math.floor(splitEff * (6 + rng() * 12));
  const blueShift = Math.floor(splitEff * (4 + rng() * 10));

  const channelData = ctx.getImageData(0, 0, 760, 760);
  const cd = channelData.data;
  const snap = ctx.getImageData(0, 0, 760, 760);
  const sd = snap.data;

  for (let row = 0; row < 760; row++) {
    if (rng() > 0.35) continue; // ~35% of rows
    const rowOff = row * 760 * 4;
    for (let x = 759; x >= redShift; x--) {
      const dst = rowOff + x * 4, src = rowOff + (x - redShift) * 4;
      cd[dst] = sd[src];
    }
    for (let x = 0; x < 760 - blueShift; x++) {
      const dst = rowOff + x * 4, src = rowOff + (x + blueShift) * 4;
      cd[dst + 2] = sd[src + 2];
    }
  }
  ctx.putImageData(channelData, 0, 0);
};
