import { readStorageKey, writeStorageKey } from "@/constants/storage";

const MAX = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = readStorageKey("recentSearches");

    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(q: string): void {
  const trimmed = q.trim();

  if (trimmed.length < 2) return;

  try {
    const prev = getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());

    writeStorageKey("recentSearches", JSON.stringify([trimmed, ...prev].slice(0, MAX)));
  } catch {}
}

export function clearRecentSearches(): void {
  try {
    writeStorageKey("recentSearches", null);
  } catch {}
}
