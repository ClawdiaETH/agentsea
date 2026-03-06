import { NextResponse } from 'next/server';
import { getRegistry, setRegistry } from '@/lib/kv-registry';
import { revalidatePath } from 'next/cache';

export const maxDuration = 30;

/**
 * Patch stats for a specific day in the KV registry.
 *
 * POST /api/admin/patch-stats?secret=CRON_SECRET
 * Body: { dayNumber: 5, stats: { commits: 21, errors: 132, ... } }
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { dayNumber, stats } = body;

  if (!dayNumber || !stats || typeof stats !== 'object') {
    return NextResponse.json({ error: 'Missing dayNumber or stats' }, { status: 400 });
  }

  const registry = await getRegistry();
  const entry = registry.find(e => e.dayNumber === Number(dayNumber));

  if (!entry) {
    return NextResponse.json({ error: `Day ${dayNumber} not found` }, { status: 404 });
  }

  const oldStats = { ...entry.stats };
  entry.stats = { ...entry.stats, ...stats };
  await setRegistry(registry);

  revalidatePath('/');
  revalidatePath('/gallery');
  revalidatePath('/collections/corrupt-memory');

  return NextResponse.json({ dayNumber, oldStats, newStats: entry.stats });
}
