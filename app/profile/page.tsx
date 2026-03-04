'use client';

import { useState, useEffect } from 'react';
import PieceCard from '@/components/PieceCard';
import registry from '../../data/registry.json';

export default function ProfilePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function connect() {
      if (typeof window === 'undefined' || !window.ethereum) {
        setError('No wallet detected. Install MetaMask or another browser wallet.');
        return;
      }
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        }) as string[];
        if (accounts[0]) setAddress(accounts[0]);
      } catch {
        setError('Wallet connection declined.');
      }
    }
    connect();
  }, []);

  const owned = address
    ? registry.filter(
        (p) => p.buyer && p.buyer.toLowerCase() === address.toLowerCase()
      )
    : [];

  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <main className="min-h-screen text-white font-mono">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>

        {error && (
          <p className="text-sm text-red-400 mb-8">{error}</p>
        )}

        {address && (
          <p className="text-sm text-zinc-500 mb-8 font-mono">{truncated}</p>
        )}

        {address && owned.length === 0 && (
          <p className="text-sm text-zinc-500">
            No pieces yet.{' '}
            <a href="/gallery" className="text-purple-400 hover:text-purple-300 transition-colors">
              Browse the gallery
            </a>{' '}
            to find your first.
          </p>
        )}

        {owned.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {owned.map((p) => (
              <PieceCard
                key={p.tokenId}
                tokenId={p.tokenId}
                dayNumber={p.dayNumber}
                date={p.date}
                ipfsImage={p.ipfsImage}
                priceEth={p.priceEth}
                sold={p.sold}
                palette={p.palette}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
