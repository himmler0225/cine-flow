// Cache thời điểm refetch watch-history cuối cùng theo movie slug.
// Dùng để debounce việc đồng bộ progress khi chuyển nhanh giữa các trang phim.
const cache = new Map<string, number>();

export const HISTORY_REFETCH_TTL_MS = 15_000;

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
