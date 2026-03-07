import type { LayerFn } from '../types';
import { eventColor, syntheticEvents } from '../utils';

/**
 * Layer 6: Dense horizontal event log bars.
 * Covers top 65% of canvas. Each bar = one event. 0.40–0.75 opacity.
 * THIS is the layer that creates the intense horizontal stripe aesthetic.
 */
export const logStream: LayerFn = (ctx, rng, dayLog, colors) => {
  const events = syntheticEvents(
    { txns: dayLog.txns, posts: dayLog.posts, errors: dayLog.errors, messages: dayLog.messages, peakHour: dayLog.peakHour },
    dayLog.commits,
    rng,
  );
  if (!events.length) return;

  const streamTop    = 28;
  const streamHeight = 760 * 0.65;
  const barCount     = Math.min(events.length, 80);
  const baseStep     = streamHeight / barCount;

  for (let i = 0; i < barCount; i++) {
    const ev = events[i];
    const barH = 12 + Math.floor(rng() * 13); // 12–24px
    const yBase = streamTop + i * baseStep;
    const y = Math.max(streamTop, yBase - Math.floor(rng() * 4));

    const fullWidth = rng() < 0.55;
    const barW = fullWidth ? 760 : Math.floor(760 * (0.4 + rng() * 0.6));
    const barX = fullWidth ? 0 : Math.floor(rng() * (760 - barW));

    const alpha = 0.40 + rng() * 0.35; // 0.40–0.75
    ctx.fillStyle = eventColor(ev.type, colors, alpha);
    ctx.fillRect(barX, y, barW, barH);

    // Accent stripe at top of bar
    ctx.fillStyle = eventColor(ev.type, colors, Math.min(0.9, alpha + 0.2));
    ctx.fillRect(barX, y, barW, 1);
  }
};
