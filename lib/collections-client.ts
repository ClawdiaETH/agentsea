import type { Collection } from './collections';
import collectionsData from '@/data/collections.json';

const collections = collectionsData as Collection[];

export function getCollectionClient(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getCollectionByAddress(address: string): Collection | undefined {
  return collections.find(
    (c) => c.contractAddress.toLowerCase() === address.toLowerCase(),
  );
}
