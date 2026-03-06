import { NextResponse } from 'next/server';
import { rpcCall } from '@/lib/rpc';
import { getRegistry, setRegistry } from '@/lib/kv-registry';
import { keccak256, toHex } from 'viem';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/mark-sold
 * Body: { tokenId: number, saleContract: string }
 *
 * Verifies on-chain that the listing is no longer active,
 * then marks the registry entry as sold.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tokenId, saleContract } = body;

    if (!tokenId || !saleContract) {
      return NextResponse.json({ error: 'Missing tokenId or saleContract' }, { status: 400 });
    }

    // Verify on-chain: getListing(uint256) returns (uint256 price, bool isListed)
    const selector = keccak256(toHex('getListing(uint256)')).slice(0, 10);
    const paddedId = BigInt(tokenId).toString(16).padStart(64, '0');
    const result = await rpcCall(saleContract, `${selector}${paddedId}`);

    // Parse isListed (second return value, offset 64-128)
    let isListed = true;
    if (result && result.length >= 130) {
      const isListedHex = result.slice(2 + 64, 2 + 128);
      isListed = BigInt('0x' + isListedHex) !== BigInt(0);
    }

    if (isListed) {
      return NextResponse.json({ error: 'Token is still listed on-chain' }, { status: 409 });
    }

    // Find and update registry entry
    const registry = await getRegistry();
    const entry = registry.find((e) => e.tokenId === Number(tokenId));
    if (!entry) {
      return NextResponse.json({ error: 'Token not found in registry' }, { status: 404 });
    }

    if (entry.sold) {
      return NextResponse.json({ message: 'Already marked as sold' });
    }

    // Read the owner from the NFT contract via ownerOf(uint256)
    // We don't have the NFT contract address here, so just mark as sold
    entry.sold = true;
    await setRegistry(registry);

    // Revalidate the collection page so it shows updated status
    revalidatePath('/collections/corrupt-memory');

    return NextResponse.json({ message: 'Marked as sold', tokenId });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
