'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { rpcCall } from '@/lib/rpc';
import { fetchFullTokenMetadata } from '@/lib/token-metadata';
import type { TokenMetadataFull } from '@/lib/token-metadata';
import { getTokenListing } from '@/lib/marketplace';
import type { MarketListing } from '@/lib/marketplace';
import { getCollectionClient } from '@/lib/collections-client';
import type { Collection } from '@/lib/collections';
import MarketBuyButton from '@/components/MarketBuyButton';
import DelistButton from '@/components/DelistButton';
import ListModal from '@/components/ListModal';

// ownerOf(uint256) selector
const OWNER_OF_SELECTOR = '0x6352211e';

export default function TokenDetailPage() {
  const params = useParams<{ slug: string; tokenId: string }>();
  const slug = params.slug;
  const tokenId = params.tokenId;
  const { address } = useAccount();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadataFull | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);

  const isOwner = address && owner ? address.toLowerCase() === owner.toLowerCase() : false;

  const loadData = useCallback(async () => {
    const col = getCollectionClient(slug);
    if (!col) {
      setLoading(false);
      return;
    }
    setCollection(col);

    const [meta, listingResult, ownerResult] = await Promise.all([
      fetchFullTokenMetadata(col.contractAddress, tokenId),
      getTokenListing(col.contractAddress, tokenId),
      Promise.resolve()
        .then(() =>
          rpcCall(col.contractAddress, `${OWNER_OF_SELECTOR}${BigInt(tokenId).toString(16).padStart(64, '0')}`)
        )
        .catch(() => null),
    ]);

    setMetadata(meta);
    setListing(listingResult);

    if (ownerResult && ownerResult !== '0x' && ownerResult.length >= 66) {
      setOwner('0x' + ownerResult.slice(26, 66));
    }

    setLoading(false);
  }, [slug, tokenId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleListed = useCallback(() => {
    setShowListModal(false);
    loadData();
  }, [loadData]);

  const handleDelisted = useCallback(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <main className="min-h-screen text-white font-mono">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 bg-zinc-800 rounded" />
            <div className="aspect-square w-full bg-zinc-900 rounded border border-zinc-800" />
            <div className="h-6 w-64 bg-zinc-800 rounded" />
            <div className="h-4 w-32 bg-zinc-800 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="min-h-screen text-white font-mono flex items-center justify-center">
        <p className="text-zinc-500">Collection not found.</p>
      </main>
    );
  }

  if (!metadata) {
    return (
      <main className="min-h-screen text-white font-mono">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <Link href={`/collections/${slug}`} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            &larr; Back to {collection.name}
          </Link>
          <p className="text-zinc-500 mt-8">Could not load token #{tokenId}.</p>
        </div>
      </main>
    );
  }

  const displayName = metadata.name || `${collection.name} #${tokenId}`;

  return (
    <main className="min-h-screen text-white font-mono">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        {/* Back link */}
        <Link href={`/collections/${slug}`} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          &larr; Back to {collection.name}
        </Link>

        {/* Image */}
        <div
          className="relative w-full mt-6 mb-6 bg-zinc-900 rounded overflow-hidden border border-zinc-800"
          style={{ aspectRatio: collection.aspectRatio || '1/1' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.image}
            alt={displayName}
            className="w-full h-full object-cover"
            style={{ imageRendering: collection.pixelArt ? 'pixelated' : undefined }}
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          <Link href={`/collections/${slug}`} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            {collection.name}
          </Link>
          {' · '}#{tokenId}
        </p>

        {/* Owner */}
        {owner && (
          <p className="text-xs text-zinc-500 mt-2">
            Owner:{' '}
            <a
              href={`https://basescan.org/address/${owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {owner.slice(0, 6)}...{owner.slice(-4)}
            </a>
            {isOwner && <span className="text-purple-400 ml-1">(you)</span>}
          </p>
        )}

        {/* Traits */}
        {metadata.attributes && metadata.attributes.length > 0 && (
          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h2 className="text-sm font-bold text-zinc-400 mb-3">Traits</h2>
            <div className="flex flex-wrap gap-2">
              {metadata.attributes.map((attr, i) => (
                <span
                  key={i}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5"
                >
                  <span className="text-zinc-500">{attr.trait_type}:</span>{' '}
                  <span className="text-zinc-200">{attr.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Marketplace actions */}
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <h2 className="text-sm font-bold text-zinc-400 mb-3">Market</h2>

          {listing && !isOwner && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">
                Listed for <span className="font-bold text-purple-300">{listing.priceEth} ETH</span>
              </p>
              <MarketBuyButton
                nftAddress={collection.contractAddress}
                tokenId={Number(tokenId)}
                priceWei={listing.price}
                priceEth={listing.priceEth}
                onBought={loadData}
              />
            </div>
          )}

          {listing && isOwner && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">
                Listed for <span className="font-bold text-purple-300">{listing.priceEth} ETH</span>
              </p>
              <DelistButton
                contractAddress={collection.contractAddress}
                tokenId={tokenId}
                onDelisted={handleDelisted}
                className="w-full text-sm font-bold text-red-400 border border-red-900 rounded px-4 py-2.5 hover:bg-red-950 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {!listing && isOwner && (
            <button
              onClick={() => setShowListModal(true)}
              className="w-full rounded bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2.5 text-sm transition-colors cursor-pointer"
            >
              List for sale
            </button>
          )}

          {!listing && !isOwner && (
            <p className="text-sm text-zinc-600">Not listed for sale.</p>
          )}
        </div>

        {/* Contract info */}
        <div className="mt-8 border-t border-zinc-800 pt-6 text-sm text-zinc-500 space-y-2">
          {metadata.description && (
            <p className="text-zinc-400">{metadata.description}</p>
          )}
          <p>
            Contract:{' '}
            <a
              href={`https://basescan.org/address/${collection.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {collection.contractAddress.slice(0, 10)}...{collection.contractAddress.slice(-6)}
            </a>
          </p>
        </div>
      </div>

      {/* List modal */}
      {showListModal && (
        <ListModal
          nftAddress={collection.contractAddress}
          tokenId={tokenId}
          tokenName={displayName}
          onClose={() => setShowListModal(false)}
          onListed={handleListed}
        />
      )}
    </main>
  );
}
