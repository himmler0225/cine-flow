const KEY = "kkflix_recent_searches";
const MAX = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
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
    localStorage.setItem(KEY, JSON.stringify([trimmed, ...prev].slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
