import type { LayerFn } from '../types';
import { eventColor, syntheticEvents, withAlpha } from '../utils';

/** Layer 7: Timestamped event text overlay on top of log stream bars */
export const eventText: LayerFn = (ctx, rng, dayLog, colors) => {
  const events = syntheticEvents(
    { txns: dayLog.txns, posts: dayLog.posts, errors: dayLog.errors, messages: dayLog.messages, peakHour: dayLog.peakHour },
    dayLog.commits,
    rng,
  );
  if (!events.length) return;

  ctx.font = '10px monospace';
  const streamTop    = 28;
  const streamHeight = 760 * 0.65;
  const barCount     = Math.min(events.length, 80);
  const baseStep     = streamHeight / barCount;

  for (let i = 0; i < barCount; i++) {
    const ev = events[i];
    const yBase = streamTop + i * baseStep;
    const y = Math.max(streamTop + 10, yBase + 10);
    const label = `${ev.time} [${ev.type}] ${ev.message}`.slice(0, 72);
    const textAlpha = 0.65 + rng() * 0.20;

    ctx.fillStyle = ev.type === 'ERR'
      ? `hsla(15, 100%, 80%, ${textAlpha})`
      : withAlpha(colors.WHT, textAlpha);
    ctx.fillText(label, 8, y);

    // Glow shadow offset
    ctx.fillStyle = eventColor(ev.type, colors, 0.25);
    ctx.fillText(label, 9, y + 1);
  }
};
