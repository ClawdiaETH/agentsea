'use client';

import { useState, useEffect } from 'react';

const BASE_RPC = 'https://mainnet.base.org';

async function rpcCall(contract: string, data: string): Promise<string> {
  const res = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: contract, data }, 'latest'],
      id: 1,
    }),
  });
  return (await res.json()).result;
}

interface CollectionStatsProps {
  contractAddress: string;
  mintPrice: string | null;
  supply: number | null;
}

export default function CollectionStats({ contractAddress, mintPrice, supply }: CollectionStatsProps) {
  const [minted, setMinted] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rpcCall(contractAddress, '0x18160ddd')
      .then((result) => {
        if (result && result !== '0x') {
          setMinted(parseInt(result, 16));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contractAddress]);

  const items = [
    {
      label: 'Minted',
      value: loading
        ? null
        : minted !== null && supply
          ? `${minted.toLocaleString()} / ${supply.toLocaleString()}`
          : minted !== null
            ? minted.toLocaleString()
            : '—',
    },
    { label: 'Mint Price', value: mintPrice ?? '—' },
    { label: 'Chain', value: 'Base' },
    { label: 'Storage', value: 'Onchain', accent: true },
  ];

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{item.label}</p>
            {item.value === null ? (
              <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse mt-0.5" />
            ) : (
              <p className={`text-sm font-bold ${item.accent ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {item.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
