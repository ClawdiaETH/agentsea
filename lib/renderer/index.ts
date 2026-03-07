import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { mulberry32 } from './prng';
import type { DayLog, Colors } from './types';

// Layers in render order — matching v1 renderer.js exactly
import { background }        from './layers/background';
import { momentum }          from './layers/momentum';
import { sky }               from './layers/sky';
import { waterfall }         from './layers/waterfall';
import { logStream }         from './layers/log-stream';
import { eventText }         from './layers/event-text';
import { activityWaveform }  from './layers/activity-waveform';
import { paletteLabel }      from './layers/palette-label';
import { glitch }            from './layers/glitch';
import { geometry }          from './layers/geometry';
import { logText }           from './layers/log-text';
import { replies }           from './layers/replies';
import { commits }           from './layers/commits';
import { repoGlyphs }        from './layers/repo-glyphs';
import { priceWaveform }     from './layers/price-waveform';
import { scanlines }         from './layers/scanlines';
import { metadataLine }      from './layers/metadata-line';
import { statsBar }          from './layers/stats-bar';
import { watermark }         from './layers/watermark';

const LAYERS = [
  background,       // 1+2: fill + noise
  momentum,         // 3
  sky,              // 4
  waterfall,        // 5
  logStream,        // 6: dense horizontal bars (THE signature layer)
  eventText,        // 7: text on bars
  activityWaveform, // 8: left waveform
  paletteLabel,     // 9: bordered label box
  glitch,           // 10: pixel displacement + RGB split
  geometry,         // 11: rects, strips, barcodes, crosses
  logText,          // 12: stats scatter
  replies,          // 13: handle scatter
  commits,          // 14: commit messages + code rain
  repoGlyphs,       // 15: repo markers
  priceWaveform,    // 16: waveform + ticker
  scanlines,        // 17: scan lines every 2px
  metadataLine,     // 18: bottom metadata
  statsBar,         // 19: event type counts
  watermark,        // 20: seed + date
];

let fontRegistered = false;

function ensureFont() {
  if (fontRegistered) return;
  const fontPath = path.join(process.cwd(), 'public/fonts/JetBrainsMono-Regular.ttf');
  try {
    GlobalFonts.registerFromPath(fontPath, 'JetBrainsMono');
  } catch {
    // fall back to default monospace
  }
  fontRegistered = true;
}

/**
 * Render a 760x760 PNG from a DayLog. Deterministic.
 */
export function renderImage(dayLog: DayLog): Buffer {
  ensureFont();

  const canvas = createCanvas(760, 760);
  const ctx = canvas.getContext('2d');

  const seed = (dayLog.dayNumber * 0x9e3779b9) % 0x100000000;
  const rng = mulberry32(seed);

  const [BLK, DOM, SEC, ACC, WHT] = dayLog.palette;
  const colors: Colors = { BLK, DOM, SEC, ACC, WHT };

  const log = { ...dayLog, seed };

  for (const layer of LAYERS) {
    ctx.save();
    layer(ctx, rng, log, colors);
    ctx.restore();
  }

  return Buffer.from(canvas.toBuffer('image/png'));
}
