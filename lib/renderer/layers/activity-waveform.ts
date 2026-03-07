import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layer 8: Jagged vertical waveform on left 14% of canvas */
export const activityWaveform: LayerFn = (ctx, rng, dayLog, colors) => {
  const peakHour = dayLog.peakHour ?? 14;
  const waveW    = 760 * 0.14;
  const centerX  = waveW * 0.5;

  // Build activity curve — bell around peakHour
  const activity = new Float32Array(760);
  for (let py = 0; py < 760; py++) {
    const hour = (py / 760) * 24;
    const dist = Math.abs(hour - peakHour);
    activity[py] = Math.exp(-dist * dist / 16);
  }

  // Waveform line
  ctx.strokeStyle = withAlpha(colors.ACC, 0.70);
  ctx.lineWidth = 1;
  ctx.beginPath();
  let penDown = false;
  for (let py = 0; py < 760; py++) {
    const n1 = Math.sin(py * 0.8 + rng() * 0.5) * 4;
    const n2 = Math.sin(py * 2.3) * 2;
    const n3 = (rng() - 0.5) * 8;
    const x = centerX + (n1 + n2 + n3) * activity[py];
    const pt = Math.max(1, Math.min(waveW - 1, x));
    if (!penDown) { ctx.moveTo(pt, py); penDown = true; }
    else { ctx.lineTo(pt, py); }
    if (rng() < 0.04) { ctx.stroke(); ctx.beginPath(); penDown = false; }
  }
  ctx.stroke();

  // Amplitude fill bars
  for (let py = 0; py < 760; py += 2) {
    const noise = (rng() - 0.5) * 6;
    const barW = activity[py] * (waveW * 0.5) + 1 + noise;
    if (barW < 1) continue;
    ctx.fillStyle = withAlpha(colors.ACC, 0.15 + activity[py] * 0.35);
    ctx.fillRect(0, py, Math.max(1, barW), 1);
  }

  // Vertical spine
  ctx.strokeStyle = withAlpha(colors.ACC, 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, 760);
  ctx.stroke();
};
