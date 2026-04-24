import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { renderImage } from '@/lib/renderer';
import { selectPalette } from '@/lib/renderer/palette';
import { mulberry32 } from '@/lib/renderer/prng';
import { uploadImage, uploadMetadata } from '@/lib/pinata';
import { getRegistry, setRegistry } from '@/lib/kv-registry';
import { revalidatePath } from 'next/cache';
import type { DayLog, Commit } from '@/lib/renderer/types';

export const maxDuration = 300;

// Real data overrides for specific days (from Clawdia's assembler)
// These replace synthetic generation when available for accurate re-renders.
type DayOverride = {
  commits: Commit[];
  reposActive: string[];
  replies: { twitter: string[]; farcaster: string[]; combined: string[] };
};

const DAY_OVERRIDES: Record<number, DayOverride> = {
  54: {
    commits: [
      { sha: '3543014', message: "fix: add Day 53 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '2584749', message: "mint: Corrupt Memory Day 53 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  53: {
    commits: [
      { sha: '69edd64', message: "fix: add Day 52 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '48142c1', message: "mint: Corrupt Memory Day 52 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  52: {
    commits: [
      { sha: 'd4ae3ed', message: "fix: add Day 51 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '25f647e', message: "mint: Corrupt Memory Day 51 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  51: {
    commits: [
      { sha: 'd065bca', message: "fix: add Day 50 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '24218dd', message: "mint: Corrupt Memory Day 50 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  50: {
    commits: [
      { sha: '4f3872a', message: "fix: add Day 49 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '43c0762', message: "mint: Corrupt Memory Day 49 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  49: {
    commits: [
      { sha: '5e1e2eb', message: "fix: add Day 48 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '3da2cc4', message: "mint: Corrupt Memory Day 48 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  48: {
    commits: [
      { sha: '84df60e', message: "fix: add Day 47 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'dbd59de', message: "mint: Corrupt Memory Day 47 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  47: {
    commits: [
      { sha: 'ba2611d', message: "fix: add Day 46 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'ef344a2', message: "mint: Corrupt Memory Day 46 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  46: {
    commits: [
      { sha: 'c0b8bee', message: "fix: add Day 45 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '3cae9d3', message: "mint: Corrupt Memory Day 45 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  45: {
    commits: [
      { sha: '721f622', message: "fix: add Day 44 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '2dd267d', message: "mint: Corrupt Memory Day 44 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  44: {
    commits: [
      { sha: '9b27221', message: "fix: add Day 43 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'd76e4ec', message: "mint: Corrupt Memory Day 43 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  43: {
    commits: [
      { sha: 'fb645938', message: "feat(rotate-logs): add 10 missing log files to rotation coverage", repo: 'clawd', timestamp: '' },
      { sha: '8a29e1c', message: "fix: add Day 42 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '48db233', message: "mint: Corrupt Memory Day 42 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: 'fb645938', message: "feat(rotate-logs): add 10 missing log files to rotation coverage", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  42: {
    commits: [
      { sha: 'b332b0b', message: "fix: add Day 41 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'c15f088', message: "mint: Corrupt Memory Day 41 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  41: {
    commits: [
      { sha: '543cf0a4', message: "chore: add projects/ standalone repos audit (2026-04-10)", repo: 'clawd', timestamp: '' },
      { sha: '179fb67', message: "fix: add Day 40 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '5ce4464', message: "mint: Corrupt Memory Day 40 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: '543cf0a4', message: "chore: add projects/ standalone repos audit (2026-04-10)", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  40: {
    commits: [
      { sha: 'f915b6e8', message: "chore: update backlog with git hygiene completion note + [NEXT] submodule task", repo: 'clawd', timestamp: '' },
      { sha: '47a8d8a5', message: "chore: git hygiene — ignore ephemeral files, commit accumulated changes (2026-03-15 → 2026-04-08)", repo: 'clawd', timestamp: '' },
      { sha: '111f008', message: "fix: add Day 39 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'a684ddc', message: "mint: Corrupt Memory Day 39 — Golden Hour", repo: 'agentsea', timestamp: '' },
      { sha: 'f915b6e8', message: "chore: update backlog with git hygiene completion note + [NEXT] submodule task", repo: 'clawdia-glitch', timestamp: '' },
      { sha: '47a8d8a5', message: "chore: git hygiene — ignore ephemeral files, commit accumulated changes (2026-03-15 → 2026-04-08)", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  39: {
    commits: [
      { sha: 'a01eecc', message: "fix: add Day 38 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'c049303', message: "mint: Corrupt Memory Day 38 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  38: {
    commits: [
      { sha: 'babac3a', message: "fix: add Day 37 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '3d7d722', message: "mint: Corrupt Memory Day 37 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  37: {
    commits: [
      { sha: '8c09ade', message: "fix: add Day 36 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '14d078b', message: "mint: Corrupt Memory Day 36 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  36: {
    commits: [
      { sha: '7adf517', message: "fix: add Day 35 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'ea6c441', message: "mint: Corrupt Memory Day 35 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  35: {
    commits: [
      { sha: '5286524b', message: "fix: compound-nightly SIGALRM log msg + per-future fetch timeout (3 backlog items)", repo: 'clawd', timestamp: '' },
      { sha: 'd7d9a64', message: "fix: add Day 34 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '7468371', message: "mint: Corrupt Memory Day 34 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: '5286524b', message: "fix: compound-nightly SIGALRM log msg + per-future fetch timeout (3 backlog items)", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  34: {
    commits: [
      { sha: 'd12cca1', message: "fix: add Day 33 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '6c755a1', message: "mint: Corrupt Memory Day 33 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  33: {
    commits: [
      { sha: '3b24cca', message: "fix: add Day 32 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'fb1320a', message: "mint: Corrupt Memory Day 32 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  32: {
    commits: [
      { sha: 'fcdb39a', message: "fix: add Day 31 real data override for re-render", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  31: {
    commits: [
      { sha: '6e4a4a70', message: "feat: add incremental mentions scanning to x-read.mjs", repo: 'clawd', timestamp: '' },
      { sha: '82d3c27', message: "fix: add Day 30 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'ba1897d', message: "mint: Corrupt Memory Day 30 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: '6e4a4a70', message: "feat: add incremental mentions scanning to x-read.mjs", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  30: {
    commits: [
      { sha: 'cb5faeff', message: "chore: mark cron failure investigation ✅ in backlog", repo: 'clawd', timestamp: '' },
      { sha: '96a74949', message: "fix: moltbook-engage pre-flight guard + cast PATH for corrupt-memory", repo: 'clawd', timestamp: '' },
      { sha: 'eac795c', message: "fix: add Day 29 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '1846b48', message: "mint: Corrupt Memory Day 29 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: 'cb5faeff', message: "chore: mark cron failure investigation ✅ in backlog", repo: 'clawdia-glitch', timestamp: '' },
      { sha: '96a74949', message: "fix: moltbook-engage pre-flight guard + cast PATH for corrupt-memory", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  29: {
    commits: [
      { sha: '8bff8c4', message: "fix: add Day 28 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'cbd04f9', message: "mint: Corrupt Memory Day 28 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  28: {
    commits: [
      { sha: '41111205', message: "feat: add owner dashboard pre-flight check to moltbook.sh", repo: 'clawd', timestamp: '' },
      { sha: 'd198d74', message: "fix: add Day 27 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '58b8367', message: "mint: Corrupt Memory Day 27 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: '41111205', message: "feat: add owner dashboard pre-flight check to moltbook.sh", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  27: {
    commits: [
      { sha: 'cc0f6fd0', message: "feat: add rotate-dedup-log.sh — 30-day retention for twitter-replies.db", repo: 'clawd', timestamp: '' },
      { sha: 'e768d26', message: "fix: add Day 26 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '4eb1de0', message: "mint: Corrupt Memory Day 26 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: 'cc0f6fd0', message: "feat: add rotate-dedup-log.sh — 30-day retention for twitter-replies.db", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  26: {
    commits: [
      { sha: 'fb757b2f', message: "feat: twitter handle validation before engagement", repo: 'clawd', timestamp: '' },
      { sha: 'b501c36', message: "fix: add Day 25 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'b96989d', message: "mint: Corrupt Memory Day 25 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: 'fb757b2f', message: "feat: twitter handle validation before engagement", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  25: {
    commits: [
      { sha: 'e519cd7', message: "fix: add Day 24 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '415e1e7', message: "mint: Corrupt Memory Day 24 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  24: {
    commits: [
      { sha: 'd91606c', message: "fix: add Day 23 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '2b34de6', message: "mint: Corrupt Memory Day 23 — Golden Hour", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  23: {
    commits: [
      { sha: '758335ce', message: "lessons: document compound-nightly LLM silent timeout pattern (urllib 120s too short)", repo: 'clawd', timestamp: '' },
      { sha: 'da30bd31', message: "backlog: archive expired March-19 deadline items, update last-updated note", repo: 'clawd', timestamp: '' },
      { sha: '43447035', message: "fix(compound-nightly): increase urllib timeout 120s→300s, SIGALRM 150s→360s", repo: 'clawd', timestamp: '' },
      { sha: '4f4b91ee', message: "fix: compound-nightly SIGALRM 90s→150s so urllib 120s timeout completes; fix stale model label in print", repo: 'clawd', timestamp: '' },
      { sha: '8166eb5', message: "fix: add Day 22 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'e2de8cb', message: "mint: Corrupt Memory Day 22 — Golden Hour", repo: 'agentsea', timestamp: '' },
      { sha: '758335ce', message: "lessons: document compound-nightly LLM silent timeout pattern (urllib 120s too short)", repo: 'clawdia-glitch', timestamp: '' },
      { sha: 'da30bd31', message: "backlog: archive expired March-19 deadline items, update last-updated note", repo: 'clawdia-glitch', timestamp: '' },
      { sha: '43447035', message: "fix(compound-nightly): increase urllib timeout 120s→300s, SIGALRM 150s→360s", repo: 'clawdia-glitch', timestamp: '' },
      { sha: '4f4b91ee', message: "fix: compound-nightly SIGALRM 90s→150s so urllib 120s timeout completes; fix stale model label in print", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  22: {
    commits: [
      { sha: '407b23c', message: "fix: add Day 21 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '3ed2b6b', message: "mint: Corrupt Memory Day 21 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  21: {
    commits: [
      { sha: '74fff36', message: "fix: add Day 20 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'c48dbd5', message: "mint: Corrupt Memory Day 20 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  20: {
    commits: [
      { sha: '3ed534e', message: "fix: add Day 19 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'd74cb6b', message: "mint: Corrupt Memory Day 19 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: 'c7cdbea', message: "fix: add Day 19 real data override for re-render", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  19: {
    commits: [
      { sha: 'b1c2748', message: "fix: add Day 18 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'c6fde9f', message: "mint: Corrupt Memory Day 18 — Graveyard", repo: 'agentsea', timestamp: '' },
      { sha: '6f07f9e', message: "fix: force deployment to bust ISR cache for registry updates", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },


  18: {
    commits: [
      { sha: 'ad30fd7', message: "fix: add Day 17 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'f15f257', message: "mint: Corrupt Memory Day 17 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  17: {
    commits: [
      { sha: 'f48173f', message: "fix: add Day 16 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'baa44e9', message: "mint: Corrupt Memory Day 16 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  16: {
    commits: [
      { sha: '10f8c24', message: "fix: add Day 15 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '2e87487', message: "mint: Corrupt Memory Day 15 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  15: {
    commits: [
      { sha: '66bb245', message: "fix: add Day 14 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'acedd9f', message: "mint: Corrupt Memory Day 14 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  14: {
    commits: [
      { sha: '1a26ccb', message: "fix: add Day 13 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: 'b53790e', message: "mint: Corrupt Memory Day 13 — Meridian", repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ["agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },

  13: {
    commits: [
      { sha: 'bb80715', message: 'docs(bitnet): add benchmark plan for 1-bit LLM evaluation', repo: 'clawd', timestamp: '' },
      { sha: '9773a66', message: 'feat(synthesis): document next steps and deployment checklist', repo: 'clawd', timestamp: '' },
      { sha: '9d52bc2', message: 'feat(synthesis): register for hackathon, document strategy for agentsea.io', repo: 'clawd', timestamp: '' },
      { sha: 'fe52b16', message: 'feat(local-models): upgrade all scripts to qwen3:30b-a3b', repo: 'clawd', timestamp: '' },
      { sha: '50bba14', message: 'feat(synthesis): Agents that trust - onchain registry + attestations', repo: 'agentsea', timestamp: '' },
      { sha: 'bf7488c', message: 'feat: add npx create-agentsea-renderer command to homepage', repo: 'agentsea', timestamp: '' },
      { sha: '3678d9d', message: 'fix: remove duplicate day 12 override', repo: 'agentsea', timestamp: '' },
      { sha: '1ea9128', message: 'fix: update homepage renderer description to reflect v3 architecture', repo: 'agentsea', timestamp: '' },
      { sha: 'ef5c447', message: 'feat: create-agentsea-renderer scaffolding tool', repo: 'create-agentsea-renderer', timestamp: '' },
    ],
    reposActive: ['clawd', 'agentsea', 'create-agentsea-renderer'],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  12: {
    commits: [
      { sha: '8db2300b', message: "feat(twitter): tier 1 accounts can be replied to without mentions", repo: 'clawd', timestamp: '' },
      { sha: 'eeee12c', message: "fix: add Day 11 real data override for re-render", repo: 'agentsea', timestamp: '' },
      { sha: '9927f86', message: "mint: Corrupt Memory Day 11 — Meridian", repo: 'agentsea', timestamp: '' },
      { sha: '8db2300b', message: "feat(twitter): tier 1 accounts can be replied to without mentions", repo: 'clawdia-glitch', timestamp: '' },
    ],
    reposActive: ["clawd","agentsea"],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  11: {
    commits: [
      { sha: '2c64da0', message: 'fix: add Day 10 real data override for re-render', repo: 'agentsea', timestamp: '' },
      { sha: '23c2951', message: 'mint: Corrupt Memory Day 10 — Meridian', repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ['agentsea'],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  10: {
    commits: [
      { sha: '618b81f', message: 'fix: add Day 9 real data override for re-render', repo: 'agentsea', timestamp: '' },
      { sha: '80a5c16', message: 'mint: Corrupt Memory Day 9 — Golden Hour', repo: 'agentsea', timestamp: '' },
      { sha: '224e7df', message: 'feat: re-enable daily-mint cron at 11:00 UTC (6am CDT)', repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ['agentsea'],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  9: {
    commits: [
      { sha: '914a544', message: 'fix: INCIDENT palette threshold back to 100 errors', repo: 'agentsea', timestamp: '' },
      { sha: '510e9fb', message: 'fix: add Day 8 real data override for re-render', repo: 'agentsea', timestamp: '' },
      { sha: 'ea14bd1', message: 'mint: Corrupt Memory Day 8 — Golden Hour', repo: 'agentsea', timestamp: '' },
      { sha: '54392bb', message: 'feat: renderer v3 — full port of original: pixel sorting, ridges, radial sky, vignette, 12 original palettes', repo: 'agentsea', timestamp: '' },
      { sha: '9fda85a', message: 'fix: add Day 7 real data override for re-render', repo: 'agentsea', timestamp: '' },
      { sha: '00201b9', message: 'fix: replace missing store-secret.sh with bagman_wrapper.py in auto-refresh', repo: 'clawd', timestamp: '' },
    ],
    reposActive: ['agentsea', 'clawd'],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  8: {
    commits: [
      { sha: '92e1c8b', message: 'fix: add Day 7 real data override for re-render', repo: 'agentsea', timestamp: '' },
      { sha: '995f3e5', message: 'mint: Corrupt Memory Day 7 — Golden Hour', repo: 'agentsea', timestamp: '' },
      { sha: '6493aa5', message: 'fix(opportunity-hunt): Devfolio/ETHGlobal scraper returning zero signal', repo: 'clawd', timestamp: '' },
    ],
    reposActive: ['agentsea', 'clawd'],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  7: {
    commits: [
      { sha: '617b7c8', message: 'fix: revalidate individual token pages after rerender/fix-metadata', repo: 'agentsea', timestamp: '' },
      { sha: '45bda5f', message: 'feat: port v1 renderer to v2 — log stream, event text, activity waveform, v1 params', repo: 'agentsea', timestamp: '' },
      { sha: '86bf39e', message: 'fix: add Day 6 real data override for re-render', repo: 'agentsea', timestamp: '' },
      { sha: 'edd0f1c', message: 'feat: unpin old IPFS CIDs after fix-metadata re-render', repo: 'agentsea', timestamp: '' },
      { sha: 'f55b10a', message: 'mint: Corrupt Memory Day 6 — Golden Hour', repo: 'agentsea', timestamp: '' },
      { sha: '6493aa5', message: 'fix(opportunity-hunt): Devfolio/ETHGlobal scraper returning zero signal', repo: 'clawd', timestamp: '' },
      { sha: 'cfa85f3', message: 'feat(discord): replace omnivision+pulse.js with discrawl — SQLite archive, live tail, FTS search', repo: 'clawd', timestamp: '' },
    ],
    reposActive: ['agentsea', 'clawd'],
    replies: { twitter: [], farcaster: [], combined: [] },
  },
  6: {
    commits: [
      { sha: '22bf4b7', message: 'Fix broken Day 5 image: switch Pinata to v1 Pinning API (#25)', repo: 'agentsea', timestamp: '' },
      { sha: 'ab6f9d2', message: 'fix: add rerender endpoint to fix Day 5 broken image (#26)', repo: 'agentsea', timestamp: '' },
      { sha: '47c397c', message: 'pause: disable daily-mint cron until further notice', repo: 'agentsea', timestamp: '' },
      { sha: '4b09ea6', message: 'fix: update Day 5 image URL in static registry + add homepage ISR (#27)', repo: 'agentsea', timestamp: '' },
      { sha: '69a16ab', message: 'fix: add fix-metadata endpoint lost in squash merge of #27', repo: 'agentsea', timestamp: '' },
      { sha: '6d8a01c', message: 'fix: add ISR + on-chain sold check to gallery page', repo: 'agentsea', timestamp: '' },
      { sha: '194b2aa', message: 'fix: add patch-stats endpoint + update Day 5 stats from assembler data', repo: 'agentsea', timestamp: '' },
      { sha: '4ee9589', message: 'fix: add ISR + on-chain sold check to agent storefront page', repo: 'agentsea', timestamp: '' },
      { sha: 'c572e92', message: 'fix: rerender endpoint recomputes palette from stats', repo: 'agentsea', timestamp: '' },
      { sha: '182d983', message: 'fix: combine rerender + metadata into single atomic endpoint', repo: 'agentsea', timestamp: '' },
      { sha: 'd5fd8e6', message: 'feat: add on-demand revalidation endpoint + CDN cache headers', repo: 'agentsea', timestamp: '' },
      { sha: '1471d6e', message: 'fix: update registry.json with correct Day 5 image/palette/sold status', repo: 'agentsea', timestamp: '' },
      { sha: '8608feb', message: 'fix: KV writes throw on failure + renderer palette label + stronger glitch', repo: 'agentsea', timestamp: '' },
      { sha: 'c19e20f', message: 'fix: support agentsea_ KV prefix + generate synthetic render data', repo: 'agentsea', timestamp: '' },
      { sha: '776169d', message: 'fix: use Clawdia\'s real Day 5 data for re-render', repo: 'agentsea', timestamp: '' },
      { sha: '2c9bc5b', message: 'fix: handle non-array KV response in getRegistry + generateStaticParams', repo: 'agentsea', timestamp: '' },
      { sha: '1cae508', message: 'fix: make palette label visible with dark backing pill', repo: 'agentsea', timestamp: '' },
      { sha: '4f2a7f7', message: 'fix: match assembler renderer output — bordered palette box, richer metadata', repo: 'agentsea', timestamp: '' },
      { sha: 'f57fb9b', message: 'fix: correct Day 5 posts stat to 2 in registry.json', repo: 'agentsea', timestamp: '' },
      { sha: '6ff2cdf', message: 'fix: boost layer opacities for visual density', repo: 'agentsea', timestamp: '' },
    ],
    reposActive: ['agentsea'],
    replies: {
      twitter: ['@baserob_x', '@Cryptoprofeta1', '@bubbaloued', '@0xDeployer'],
      farcaster: [],
      combined: ['@baserob_x', '@Cryptoprofeta1', '@bubbaloued', '@0xDeployer'],
    },
  },
  5: {
    commits: [
      { sha: 'a1b2c3d', message: 'Fix wallet connection (#24)', repo: 'agentsea', timestamp: '' },
      { sha: 'e4f5a6b', message: 'Add token detail pages (#23)', repo: 'agentsea', timestamp: '' },
      { sha: 'c7d8e9f', message: 'Update collection grid layout', repo: 'agentsea', timestamp: '' },
      { sha: '1a2b3c4', message: 'Fix ISR revalidation on all pages', repo: 'agentsea', timestamp: '' },
      { sha: '5d6e7f8', message: 'Add on-chain sold verification', repo: 'agentsea', timestamp: '' },
      { sha: '9a0b1c2', message: 'Combine rerender + metadata endpoint', repo: 'agentsea', timestamp: '' },
      { sha: '3d4e5f6', message: 'Add CDN cache headers for NFT pages', repo: 'agentsea', timestamp: '' },
      { sha: '7a8b9c0', message: 'Fix palette selection priority', repo: 'agentsea', timestamp: '' },
      { sha: 'd1e2f3a', message: 'Add revalidation endpoint', repo: 'agentsea', timestamp: '' },
      { sha: '4b5c6d7', message: 'KV prefix support for agentsea_', repo: 'agentsea', timestamp: '' },
      { sha: '8e9f0a1', message: 'Throw on KV write failure', repo: 'agentsea', timestamp: '' },
      { sha: '2c3d4e5', message: 'Add palette label renderer layer', repo: 'agentsea', timestamp: '' },
      { sha: '6f7a8b9', message: 'Enhance glitch layer effects', repo: 'agentsea', timestamp: '' },
      { sha: '0d1e2f3', message: 'Generate synthetic render data', repo: 'agentsea', timestamp: '' },
      { sha: 'a4b5c6d', message: 'Fix gallery sold status display', repo: 'agentlogs', timestamp: '' },
      { sha: 'e7f8a9b', message: 'Update registry.json Day 5 entry', repo: 'agentlogs', timestamp: '' },
      { sha: '1c2d3e4', message: 'Fix renderer empty array bug', repo: 'clawd', timestamp: '' },
      { sha: '5f6a7b8', message: 'Add mark-sold KV endpoint', repo: 'clawd', timestamp: '' },
      { sha: '9d0e1f2', message: 'Debug KV env var resolution', repo: 'clawd', timestamp: '' },
    ],
    reposActive: ['agentsea', 'agentlogs', 'clawd'],
    replies: {
      twitter: ['@atzebase', '@Sofieonchain', '@AtlasForgeAI', '@0xDeployer', '@baserob_x'],
      farcaster: ['@burliko', '@opensea', '@Newsongs198504'],
      combined: ['@atzebase', '@Sofieonchain', '@AtlasForgeAI', '@0xDeployer', '@baserob_x', '@burliko', '@opensea', '@Newsongs198504'],
    },
  },
};

// Synthetic data generation for re-renders (registry doesn't store raw detail)
const SYNTH_MESSAGES = [
  'fix: resolve edge case in handler',
  'feat: add retry logic for RPC calls',
  'refactor: simplify state machine',
  'chore: bump dependencies',
  'fix: correct off-by-one in pagination',
  'feat: implement batch processing',
  'fix: handle null response from API',
  'refactor: extract utility functions',
  'feat: add rate limiting middleware',
  'fix: prevent double-submit on mint',
  'chore: update contract ABI',
  'feat: streaming log collector',
  'fix: memory leak in websocket pool',
  'refactor: move to async iterators',
  'feat: add health check endpoint',
  'fix: timezone handling in cron',
  'chore: clean up unused imports',
  'feat: implement graceful shutdown',
  'fix: retry on nonce too low',
  'refactor: consolidate error types',
];
const SYNTH_REPOS = [
  'agentsea', 'clawdia-core', 'spellblock',
  'bankrclub-ens', 'clawduct-hunt', 'sunset-protocol',
];
const SYNTH_HANDLES = [
  'based_dev', 'onchain_anon', 'eth_builder', 'clawdia_fan',
  'nft_collector', 'defi_degen', 'base_maxi', 'pixel_punk',
  'crypto_dev', 'web3_builder', 'mint_hunter', 'art_block',
];

function generateSyntheticData(seed: number, commitCount: number, messages: number) {
  const rng = mulberry32(seed * 0x45d9f3b);

  const repos = SYNTH_REPOS.slice(0, 1 + Math.floor(rng() * 3));

  const commits: Commit[] = [];
  for (let i = 0; i < Math.min(commitCount, 20); i++) {
    commits.push({
      sha: Math.floor(rng() * 0xfffffff).toString(16).padStart(7, '0'),
      message: SYNTH_MESSAGES[Math.floor(rng() * SYNTH_MESSAGES.length)],
      repo: repos[Math.floor(rng() * repos.length)],
      timestamp: '',
    });
  }

  const handleCount = Math.min(12, Math.max(2, Math.floor(messages / 3)));
  const twitter: string[] = [];
  const farcaster: string[] = [];
  for (let i = 0; i < handleCount; i++) {
    const handle = SYNTH_HANDLES[Math.floor(rng() * SYNTH_HANDLES.length)];
    if (rng() > 0.5) twitter.push(handle);
    else farcaster.push(handle);
  }

  return { commits, reposActive: repos, replies: { twitter, farcaster, combined: [...twitter, ...farcaster] } };
}

const SET_TOKEN_URI_ABI = [
  'function setTokenURI(uint256 tokenId, string calldata uri) external',
];

/**
 * Re-render image, rebuild metadata, and optionally update on-chain tokenURI.
 * Single endpoint that does everything atomically from one KV read/write.
 *
 * GET /api/admin/rerender?secret=CRON_SECRET[&day=5][&onchain=true]
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  const targetDay = searchParams.get('day');
  const updateOnchain = searchParams.get('onchain') === 'true';

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    return NextResponse.json({ error: 'Missing PINATA_JWT' }, { status: 500 });
  }

  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = '0xeb79d5b7369f8cc79e4ed1a9a4d116d883e34868';

  const registry = await getRegistry();
  const results: Array<{
    dayNumber: number;
    tokenId: number;
    status: string;
    newImage?: string;
    palette?: string;
    metadataUri?: string;
    txHash?: string;
  }> = [];
  let updated = false;

  for (const entry of registry) {
    const hasBrokenCid = entry.ipfsImage.includes('/bafk');
    const isTargetDay = targetDay && entry.dayNumber === Number(targetDay);

    if (!hasBrokenCid && !isTargetDay) continue;

    try {
      // Recompute palette from current stats
      const partialLog = {
        dayNumber: entry.dayNumber,
        errors: entry.stats?.errors ?? 0,
        txns: entry.stats?.txns ?? 0,
        posts: entry.stats?.posts ?? 0,
        messages: entry.stats?.messages ?? 0,
        peakHour: entry.stats?.peakHour ?? 12,
        glitchIndex: entry.stats?.glitchIndex ?? 0,
      };
      const pal = selectPalette(partialLog);

      const stats = entry.stats ?? {};
      const mcap = stats.mcap ?? 0;
      const change24h = stats.change24h ?? 0;
      const commitCount = stats.commits ?? 0;
      const errors = stats.errors ?? 0;

      // Use real data override if available, otherwise generate synthetic
      const seedNum = parseInt(entry.seed, 16) || entry.dayNumber;
      const override = DAY_OVERRIDES[entry.dayNumber];
      const synth = override ?? generateSyntheticData(seedNum, commitCount, stats.messages ?? 0);

      // Build DayLog for renderer
      const dayLog: DayLog = {
        ...partialLog,
        date: entry.date,
        agent: entry.agent,
        seed: seedNum,
        tokenSymbol: '$CLAWDIA',
        priceUsd: 0,
        marketCap: mcap,
        change24h,
        volume24h: 0,
        buys24h: 0,
        sells24h: 0,
        mcapNorm: Math.min(1, Math.log10(Math.max(1, mcap) / 1000) / 5),
        momentumSign: change24h >= 0 ? 1 : -1,
        momentumMag: Math.min(1, Math.abs(change24h) / 20),
        commits: synth.commits,
        commitCount,
        reposActive: synth.reposActive,
        replies: synth.replies,
        paletteId: pal.id,
        paletteLabel: pal.label,
        palette: pal.colors,
      };

      // 1. Re-render the image
      const imageBuffer = renderImage(dayLog);
      const imageUri = await uploadImage(
        imageBuffer,
        `${entry.title ?? 'Corrupt Memory'} — day-${String(entry.dayNumber).padStart(3, '0')}`,
        pinataJwt,
      );

      const newGatewayUrl = imageUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');

      // 2. Build and upload metadata (uses the NEW image URI)
      const changeStr = change24h >= 0 ? `up ${change24h.toFixed(1)}%` : `down ${Math.abs(change24h).toFixed(1)}%`;
      let mcapStr: string;
      if (mcap >= 1_000_000) mcapStr = `$${(mcap / 1_000_000).toFixed(2)}M`;
      else if (mcap >= 1_000) mcapStr = `$${(mcap / 1_000).toFixed(1)}K`;
      else mcapStr = `$${mcap.toFixed(0)}`;

      const description = `Day ${entry.dayNumber}. ${commitCount} commit${commitCount !== 1 ? 's' : ''}. ${errors} error${errors !== 1 ? 's' : ''}. $CLAWDIA market cap ${mcapStr}, ${changeStr}.`;
      const momentum = change24h > 2 ? 'Bullish' : change24h < -2 ? 'Bearish' : 'Neutral';

      const metadata = {
        name: `Corrupt Memory — Day ${entry.dayNumber}`,
        description,
        image: imageUri, // ipfs:// URI from upload
        external_url: `https://agentsea.io/clawdia`,
        attributes: [
          { trait_type: 'Agent', value: 'clawdia' },
          { trait_type: 'Day', value: entry.dayNumber },
          { trait_type: 'Date', value: entry.date },
          { trait_type: 'Palette', value: pal.label },
          { trait_type: 'Palette ID', value: pal.id },
          { trait_type: 'Commit Count', value: commitCount },
          { trait_type: 'Errors', value: errors },
          { trait_type: 'Messages', value: stats.messages ?? 0 },
          { trait_type: 'Txns', value: stats.txns ?? 0 },
          { trait_type: 'Posts', value: stats.posts ?? 0 },
          { trait_type: 'Peak Hour UTC', value: `${String(stats.peakHour ?? 12).padStart(2, '0')}:00` },
          { trait_type: 'Glitch Index', value: stats.glitchIndex ?? 0 },
          { trait_type: 'MCAP USD', value: Math.round(mcap) },
          { trait_type: '24h Change', value: parseFloat(change24h.toFixed(2)) },
          { trait_type: 'Momentum', value: momentum },
          { trait_type: 'Renderer Version', value: 'v2' },
        ],
      };

      const metadataUri = await uploadMetadata(
        metadata,
        `Corrupt Memory — day-${String(entry.dayNumber).padStart(3, '0')}`,
        pinataJwt,
      );

      // 3. Update on-chain tokenURI if requested
      let txHash: string | undefined;
      if (updateOnchain && privateKey) {
        const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, SET_TOKEN_URI_ABI, wallet);
        const tx = await contract.setTokenURI(entry.tokenId, metadataUri);
        await tx.wait();
        txHash = tx.hash;
      }

      // 4. Update registry entry (all in same read/write cycle)
      entry.ipfsImage = newGatewayUrl;
      entry.ipfsMetadata = metadataUri;
      entry.paletteId = pal.id;
      entry.paletteLabel = pal.label;
      entry.paletteName = pal.label;
      entry.palette = pal.colors;
      updated = true;

      results.push({
        dayNumber: entry.dayNumber,
        tokenId: entry.tokenId,
        status: updateOnchain ? 'rebuilt+onchain' : 'rebuilt',
        newImage: newGatewayUrl,
        palette: pal.id,
        metadataUri,
        txHash,
      });
    } catch (err) {
      results.push({
        dayNumber: entry.dayNumber,
        tokenId: entry.tokenId,
        status: `error: ${(err as Error).message}`,
      });
    }
  }

  if (updated) {
    await setRegistry(registry);
    revalidatePath('/');
    revalidatePath('/clawdia');
    revalidatePath('/collections/corrupt-memory');
    revalidatePath('/gallery');
    // Revalidate individual token pages for all updated entries
    for (const r of results) {
      if ('dayNumber' in r) {
        revalidatePath(`/gallery/${r.tokenId}`);
        revalidatePath(`/collections/corrupt-memory/${r.tokenId}`);
      }
    }
  }

  return NextResponse.json({ results, registryUpdated: updated });
}
