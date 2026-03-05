import { rpcCall, rpcGetLogs } from './rpc';

const MARKET_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT || '';

// Precomputed event topic0 hashes
const LISTED_TOPIC = '0x8b06cda60618abf2b2d07227f9dd63ec6349ca3269ce0eb18d49122a48362ad8';

export interface MarketListing {
  nftAddress: string;
  tokenId: number;
  seller: string;
  price: string; // wei
  priceEth: string;
}

/**
 * Check if a specific token is listed on the marketplace.
 * Uses direct contract read — efficient for checking individual tokens.
 */
export async function getTokenListing(
  nftAddress: string,
  tokenId: number,
): Promise<MarketListing | null> {
  if (!MARKET_ADDRESS) return null;

  try {
    // getListing(address nft, uint256 tokenId) → (address seller, uint256 price)
    // selector: first 4 bytes of keccak256("getListing(address,uint256)")
    const selector = '0x88700d1c'; // keccak256("getListing(address,uint256)")
    const paddedNft = nftAddress.slice(2).toLowerCase().padStart(64, '0');
    const paddedId = tokenId.toString(16).padStart(64, '0');

    const result = await rpcCall(MARKET_ADDRESS, `${selector}${paddedNft}${paddedId}`);
    if (!result || result === '0x') return null;

    const stripped = result.slice(2);
    const seller = '0x' + stripped.slice(24, 64); // address is right-aligned in 32 bytes
    const priceHex = stripped.slice(64, 128);
    const priceWei = BigInt('0x' + priceHex);

    // Zero seller means not listed
    if (seller === '0x' + '0'.repeat(40)) return null;
    if (priceWei === BigInt(0)) return null;

    return {
      nftAddress,
      tokenId,
      seller,
      price: priceWei.toString(),
      priceEth: (Number(priceWei) / 1e18).toFixed(4),
    };
  } catch {
    return null;
  }
}

/**
 * Check listings for multiple tokens in a collection.
 * Returns only tokens that are actively listed.
 */
export async function getListingsForTokens(
  nftAddress: string,
  tokenIds: number[],
): Promise<Map<number, MarketListing>> {
  const listings = new Map<number, MarketListing>();
  if (!MARKET_ADDRESS) return listings;

  // Check each token in parallel batches
  const BATCH = 6;
  for (let i = 0; i < tokenIds.length; i += BATCH) {
    const batch = tokenIds.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((id) => getTokenListing(nftAddress, id))
    );
    for (const r of results) {
      if (r) listings.set(r.tokenId, r);
    }
  }

  return listings;
}

/**
 * Discover all active listings for a collection by scanning Listed events,
 * then validating each with a direct getListing() call.
 */
export async function getCollectionListings(
  nftAddress: string,
  fromBlock = 1_000_000,
): Promise<MarketListing[]> {
  if (!MARKET_ADDRESS) return [];

  try {
    // Scan Listed events filtered by NFT address (topic1)
    const logs = await rpcGetLogs({
      address: MARKET_ADDRESS,
      topics: [
        LISTED_TOPIC,
        '0x' + nftAddress.slice(2).toLowerCase().padStart(64, '0'),
      ],
      fromBlock,
    });

    // Collect unique tokenIds from Listed events
    const candidateTokenIds = new Set<number>();
    for (const log of logs) {
      if (log.topics.length >= 3) {
        const tokenId = parseInt(log.topics[2], 16);
        candidateTokenIds.add(tokenId);
      }
    }

    // Validate each with direct read
    const listings: MarketListing[] = [];
    const ids = Array.from(candidateTokenIds);
    const BATCH = 6;
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((id) => getTokenListing(nftAddress, id))
      );
      for (const r of results) {
        if (r) listings.push(r);
      }
    }

    return listings;
  } catch {
    return [];
  }
}

export function getMarketAddress(): string {
  return MARKET_ADDRESS;
}
