import type { LayerFn } from '../types';
import { withAlpha } from '../utils';

/** Layer 11: Geometry — rectangles, squares, strips, barcodes, crosses, dots, edge bleeds */
export const geometry: LayerFn = (ctx, rng, dayLog, colors) => {
  const intensity = Math.max(0.3, (dayLog.glitchIndex ?? 0) / 100);

  // Large filled rectangles (4–8)
  const rectCount = 4 + Math.floor(rng() * 5);
  for (let i = 0; i < rectCount; i++) {
    const x = Math.floor(rng() * 760 * 0.8);
    const y = Math.floor(rng() * 760 * 0.8);
    const w = 80 + Math.floor(rng() * 200);
    const h = 50 + Math.floor(rng() * 180);
    const col = [colors.DOM, colors.SEC, colors.ACC, colors.BLK][Math.floor(rng() * 4)];
    ctx.fillStyle = withAlpha(col, 0.30 + rng() * 0.25);
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = withAlpha(colors.ACC, 0.75);
    ctx.lineWidth = 1.5;
    const tick = 10;
    ([[x,y],[x+w,y],[x,y+h],[x+w,y+h]] as [number,number][]).forEach(([cx,cy]) => {
      ctx.beginPath(); ctx.moveTo(cx - tick, cy); ctx.lineTo(cx + tick, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - tick); ctx.lineTo(cx, cy + tick); ctx.stroke();
    });
  }

  // Concentric squares (2–4)
  const sqCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < sqCount; i++) {
    const cx = 100 + Math.floor(rng() * 560);
    const cy = 100 + Math.floor(rng() * 560);
    const sizes = [120, 88, 60, 36, 18].slice(0, 3 + Math.floor(rng() * 3));
    const sqColors = [colors.WHT, colors.ACC, colors.SEC, colors.DOM];
    sizes.forEach((s, idx) => {
      ctx.strokeStyle = withAlpha(sqColors[idx % sqColors.length], 0.45 + idx * 0.08);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - s/2, cy - s/2, s, s);
    });
  }

  // Glitch strips
  const stripCount = Math.floor(intensity * 18) + 5;
  for (let i = 0; i < stripCount; i++) {
    const y = Math.floor(rng() * 760);
    const h = 1 + Math.floor(rng() * 4);
    const w = 30 + Math.floor(rng() * (760 * 0.85));
    const x = Math.floor(rng() * (760 - w));
    ctx.fillStyle = withAlpha(rng() < 0.5 ? colors.ACC : colors.WHT, 0.25 + rng() * 0.40);
    ctx.fillRect(x, y, w, h);
  }

  // Barcode structures (2–3)
  const bcCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < bcCount; i++) {
    const bx = Math.floor(rng() * (760 - 100));
    const by = Math.floor(rng() * 760);
    const bh = 24 + Math.floor(rng() * 50);
    const barCount = 16 + Math.floor(rng() * 24);
    for (let b = 0; b < barCount; b++) {
      const bw = 1 + Math.floor(rng() * 4);
      const gap = 1 + Math.floor(rng() * 3);
      const bxPos = bx + b * (bw + gap);
      if (bxPos + bw > 760) break;
      ctx.fillStyle = withAlpha(rng() < 0.6 ? colors.WHT : colors.SEC, 0.40 + rng() * 0.45);
      ctx.fillRect(bxPos, by, bw, bh);
    }
  }

  // Crosses (3–6)
  const crossCount = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < crossCount; i++) {
    const cx = Math.floor(rng() * 760);
    const cy = Math.floor(rng() * 760);
    const arm = 20 + Math.floor(rng() * 60);
    const thick = 2 + Math.floor(rng() * 3);
    const col = [colors.WHT, colors.ACC, colors.DOM][Math.floor(rng() * 3)];
    ctx.fillStyle = withAlpha(col, 0.40 + rng() * 0.40);
    ctx.fillRect(cx - arm, cy - Math.floor(thick/2), arm * 2, thick);
    ctx.fillRect(cx - Math.floor(thick/2), cy - arm, thick, arm * 2);
  }

  // Dot grid
  const activity = Math.min(1, (dayLog.txns ?? 0) / 500 + (dayLog.posts ?? 0) / 200);
  const dotSpacing = Math.max(16, Math.floor(36 - activity * 20));
  for (let gx = dotSpacing; gx < 760 - dotSpacing; gx += dotSpacing) {
    for (let gy = dotSpacing; gy < 760 - dotSpacing; gy += dotSpacing) {
      if (rng() < 0.35) continue;
      ctx.fillStyle = withAlpha(colors.WHT, 0.10 + rng() * 0.18);
      ctx.fillRect(gx + Math.floor(rng() * 4 - 2), gy + Math.floor(rng() * 4 - 2), 1, 1);
    }
  }

  // Mosaic patches (2–4)
  const mosCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < mosCount; i++) {
    const mx = Math.floor(rng() * (760 - 80));
    const my = Math.floor(rng() * (760 - 80));
    const tileSize = 5 + Math.floor(rng() * 8);
    const tiles = 5 + Math.floor(rng() * 7);
    const mosCols = [colors.DOM, colors.SEC, colors.ACC, colors.BLK, colors.WHT];
    for (let tx = 0; tx < tiles; tx++) {
      for (let ty = 0; ty < tiles; ty++) {
        if (rng() < 0.25) continue;
        ctx.fillStyle = withAlpha(mosCols[Math.floor(rng() * mosCols.length)], 0.50 + rng() * 0.40);
        ctx.fillRect(mx + tx * tileSize, my + ty * tileSize, tileSize, tileSize);
      }
    }
  }

  // Edge bleeds
  const leftGrad = ctx.createLinearGradient(0, 0, 22, 0);
  leftGrad.addColorStop(0, withAlpha(colors.DOM, 0.55));
  leftGrad.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, 22, 760);

  const rightGrad = ctx.createLinearGradient(760 - 22, 0, 760, 0);
  rightGrad.addColorStop(0, 'hsla(0,0%,0%,0)');
  rightGrad.addColorStop(1, withAlpha(colors.SEC, 0.55));
  ctx.fillStyle = rightGrad;
  ctx.fillRect(760 - 22, 0, 22, 760);

  // Vertical tear
  const tearX = 50 + Math.floor(rng() * 660);
  const tearW = 1 + Math.floor(rng() * 3);
  const tearGrad = ctx.createLinearGradient(0, 760 * 0.1, 0, 760 * 0.9);
  tearGrad.addColorStop(0, 'hsla(0,0%,0%,0)');
  tearGrad.addColorStop(0.3, withAlpha(colors.WHT, 0.45));
  tearGrad.addColorStop(0.7, withAlpha(colors.WHT, 0.45));
  tearGrad.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = tearGrad;
  ctx.fillRect(tearX, 76, tearW, 608);
};
