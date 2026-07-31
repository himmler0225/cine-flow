const cache = new Map<string, number>();

export const HISTORY_REFETCH_TTL_MS = 15000;

export function getHistoryRefetchedAt(slug: string): number | undefined {
  return cache.get(slug);
}

export function markHistoryRefetched(slug: string): void {
  cache.set(slug, Date.now());
}

export function invalidateHistoryRefetchCache(slug?: string): void {
  if (slug) cache.delete(slug);
  else cache.clear();
}
