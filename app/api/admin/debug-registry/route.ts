import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint: reads Day 5 directly from KV (bypasses getRegistry fallback).
 * GET /api/admin/debug-registry?secret=CRON_SECRET
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kvUrl = process.env.KV_REST_API_URL ? 'set' : 'missing';
  const kvToken = process.env.KV_REST_API_TOKEN ? 'set' : 'missing';

  let kvData: unknown = null;
  let kvError: string | null = null;

  try {
    const registry = await kv.get<Array<Record<string, unknown>>>('registry:clawdia');
    if (registry && registry.length > 0) {
      const day5 = registry.find((e: Record<string, unknown>) => e.dayNumber === 5);
      kvData = day5 ? {
        ipfsImage: day5.ipfsImage,
        ipfsMetadata: day5.ipfsMetadata,
        paletteId: day5.paletteId,
        paletteLabel: day5.paletteLabel,
        sold: day5.sold,
        buyer: day5.buyer,
      } : 'Day 5 not found in KV registry';
    } else {
      kvData = 'KV returned empty or null';
    }
  } catch (err) {
    kvError = (err as Error).message;
  }

  return NextResponse.json({
    envVars: { KV_REST_API_URL: kvUrl, KV_REST_API_TOKEN: kvToken },
    kvData,
    kvError,
  });
}
