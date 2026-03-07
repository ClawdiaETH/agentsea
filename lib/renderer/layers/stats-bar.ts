import type { LayerFn } from '../types';
import { eventColor, syntheticEvents } from '../utils';

/** Layer 19: Event type count bar at bottom — TRADE:N POST:N ERR:N ... */
export const statsBar: LayerFn = (ctx, rng, dayLog, colors) => {
  const events = syntheticEvents(
    { txns: dayLog.txns, posts: dayLog.posts, errors: dayLog.errors, messages: dayLog.messages, peakHour: dayLog.peakHour },
    dayLog.commits,
    rng,
  );
  if (!events.length) return;

  const types = ['TRADE','POST','ERR','API','SYS','MEM','COMMIT'] as const;
  const counts: Record<string, number> = {};
  types.forEach(t => { counts[t] = 0; });
  events.forEach(e => { if (counts[e.type] !== undefined) counts[e.type]++; });

  ctx.font = '8px monospace';
  let x = 760 * 0.38;
  const y = 760 - 10;
  types.forEach(t => {
    const label = `${t}:${counts[t]}`;
    ctx.fillStyle = eventColor(t, colors, 0.60);
    ctx.fillText(label, x, y);
    x += ctx.measureText(label).width + 8;
  });
};
