/** Parse hsl() string → [h, s, l] */
function parseHsl(hsl: string): [number, number, number] {
  const m = hsl.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  return m ? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])] : [0, 0, 50];
}

/** Return hsla() with adjusted opacity */
export function withAlpha(color: string, alpha: number): string {
  const [h, s, l] = parseHsl(color);
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

export type EventType = 'TRADE' | 'POST' | 'ERR' | 'API' | 'SYS' | 'MEM' | 'COMMIT';
export interface SynthEvent { time: string; type: EventType; message: string; }

export function eventColor(type: EventType | string, colors: { DOM: string; SEC: string; ACC: string; WHT: string }, alpha = 0.55): string {
  switch (type) {
    case 'TRADE':  return withAlpha(colors.DOM, alpha);
    case 'POST':   return withAlpha(colors.SEC, alpha);
    case 'ERR':    return `hsla(8, 92%, 55%, ${alpha})`;
    case 'API':    return withAlpha(colors.ACC, alpha);
    case 'SYS':    return withAlpha(colors.WHT, alpha * 0.85);
    case 'MEM':    return withAlpha(colors.ACC, alpha * 0.9);
    case 'COMMIT': return withAlpha(colors.SEC, alpha * 1.1);
    default:       return withAlpha(colors.WHT, alpha * 0.7);
  }
}

export function syntheticEvents(
  op: { txns?: number; posts?: number; errors?: number; messages?: number; peakHour?: number; },
  commits: Array<{ repo: string; message: string; sha?: string }>,
  rng: () => number,
): SynthEvent[] {
  const { txns = 0, posts = 0, errors = 0, messages = 0, peakHour = 14 } = op;
  const events: SynthEvent[] = [];

  function spreadTimes(count: number, type: EventType, msgFn: (i: number) => string) {
    for (let i = 0; i < count; i++) {
      const offset = Math.round((rng() - 0.5) * 10);
      const h = Math.max(0, Math.min(23, peakHour + offset + Math.round((i / count) * 4 - 2)));
      const m = Math.floor(rng() * 60);
      const s = Math.floor(rng() * 60);
      const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      events.push({ time, type, message: msgFn(i) });
    }
  }

  // SYS heartbeats
  const hbCount = Math.max(8, Math.min(49, messages > 0 ? messages : 24));
  for (let i = 0; i < hbCount; i++) {
    const h = Math.floor((i / hbCount) * 24);
    const mi = Math.floor(rng() * 60);
    const si = Math.floor(rng() * 60);
    const time = `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(si).padStart(2,'0')}`;
    events.push({ time, type: 'SYS', message: 'heartbeat nominal' });
  }

  const cronNames = ['compound-nightly','auto-compound','reply-scan','token-check','memory-flush'];
  spreadTimes(Math.min(6, Math.max(2, Math.floor(hbCount / 8))), 'SYS', i => `cron: ${cronNames[i % cronNames.length]}`);
  spreadTimes(Math.max(2, Math.floor(hbCount / 12)), 'SYS', () => 'session opened');

  commits.slice(0, 20).forEach((c, i) => {
    const h = Math.max(0, Math.min(23, peakHour - 2 + Math.floor(i / 4)));
    const mi = Math.floor(rng() * 60);
    const si = Math.floor(rng() * 60);
    const time = `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(si).padStart(2,'0')}`;
    events.push({ time, type: 'COMMIT', message: `${c.repo}: ${(c.message ?? '').slice(0, 40)}` });
  });

  const platforms = ['Farcaster','Twitter','Farcaster','Moltbook','Twitter'];
  const postMsgs  = ['cast: on the clock','reply: @anon','cast: new drop','tweet: live now','reply: ngmi'];
  spreadTimes(Math.max(4, Math.min(30, posts)), 'POST', i => `${platforms[i % platforms.length]}: ${postMsgs[i % postMsgs.length]}`);

  const tradeMsgs = ['buyback: CLAWDIA','yoink: flag captured','LP: add liquidity','swap: ETH → CLAWDIA','bridge: Base → mainnet','bid: BASED DAO','tx: contract deploy','claim: LP fees'];
  spreadTimes(Math.max(2, Math.min(20, txns > 0 ? Math.floor(txns / 5) : 4)), 'TRADE', i => tradeMsgs[i % tradeMsgs.length]);

  const errMsgs = ['rate limit: Twitter 25','context overflow → truncating','API timeout: Neynar','ECONNRESET: basescan','sqlite lock: retry','429: too many requests','rate limit: Farcaster 60s','chromadb: embedding fail'];
  spreadTimes(Math.max(1, Math.min(12, errors > 0 ? errors : 3)), 'ERR', i => errMsgs[i % errMsgs.length]);

  const apiMsgs = ['92% context','78% context','model: sonnet-4','tokens: 24k','API: 100%'];
  spreadTimes(4, 'API', i => apiMsgs[i % apiMsgs.length]);

  const memMsgs = ['updated: MEMORY.md','updated: platform-apis.md','updated: lessons.md','flush: pre-compaction','chromadb: 12 new chunks'];
  spreadTimes(3, 'MEM', i => memMsgs[i % memMsgs.length]);

  events.sort((a, b) => a.time.localeCompare(b.time));
  return events;
}
