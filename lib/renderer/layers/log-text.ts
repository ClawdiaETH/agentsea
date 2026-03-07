import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layer 12: Sparse operational stats scatter — lower half of canvas */
export const logText: LayerFn = (ctx, rng, dayLog, _colors) => {
  // Use colors via the passed-in colors parameter
  const lines = [
    `txns=${dayLog.txns ?? 0} posts=${dayLog.posts ?? 0} err=${dayLog.errors ?? 0}`,
    `msgs=${dayLog.messages ?? 0} peak=${dayLog.peakHour ?? 0}:00 UTC`,
    `glitch_idx=${dayLog.glitchIndex ?? 0}`,
    `projects: ${dayLog.reposActive?.join(', ') || 'none'}`,
    `[corrupt memory]`,
    `[clawdia.operational.base]`,
    `context overflow → truncating`,
    `[MEM] pre-compaction flush`,
  ];

  ctx.font = '9px monospace';
  const lineCount = 8 + Math.floor(rng() * 8);
  for (let i = 0; i < lineCount; i++) {
    const x = Math.floor(rng() * (760 - 220));
    const y = 760 * 0.68 + Math.floor(rng() * (760 * 0.28));
    const line = lines[i % lines.length];
    // Need colors from outer scope — use global alpha trick
    ctx.globalAlpha = 0.12 + rng() * 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, x, y);
  }
  ctx.globalAlpha = 1;
};
