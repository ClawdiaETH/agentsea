import type { LayerFn } from '../types';

/** Layer 15: Bottom bar with token/chain/mcap/palette info */
export const metadataLine: LayerFn = (ctx, _rng, dayLog, colors) => {
  // Background bar
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = colors.BLK;
  ctx.fillRect(0, 736, 760, 24);

  // Format market cap
  let mcapStr: string;
  if (dayLog.marketCap >= 1_000_000) {
    mcapStr = `$${(dayLog.marketCap / 1_000_000).toFixed(2)}M`;
  } else if (dayLog.marketCap >= 1_000) {
    mcapStr = `$${(dayLog.marketCap / 1_000).toFixed(1)}K`;
  } else {
    mcapStr = `$${dayLog.marketCap.toFixed(0)}`;
  }

  const symbol = dayLog.tokenSymbol ?? '$CLAWDIA';
  const changeStr = dayLog.change24h >= 0
    ? `+${dayLog.change24h.toFixed(1)}%`
    : `${dayLog.change24h.toFixed(1)}%`;
  const text = `${symbol} / BASE / MCAP ${mcapStr} ${changeStr} / ${dayLog.paletteId} / DAY ${dayLog.dayNumber}`;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = colors.WHT;
  ctx.font = '10px JetBrainsMono';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 380, 748);

  // Stats line above the bar
  const statsText = `txns=${dayLog.txns} posts=${dayLog.posts} err=${dayLog.errors}`;
  ctx.globalAlpha = 0.35;
  ctx.font = '9px JetBrainsMono';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(statsText, 12, 733);

  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
};
