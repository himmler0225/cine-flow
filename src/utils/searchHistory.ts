import { usePreferencesStore } from "@/store/preferencesStore";

const MAX = 8;

export function getRecentSearches(): string[] {
  return usePreferencesStore.getState().prefs.recentSearches ?? [];
}

export function pushRecentSearch(q: string): void {
  const trimmed = q.trim();

  if (trimmed.length < 2) return;

  usePreferencesStore
    .getState()
    .set("recentSearches", (prev = []) =>
      [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX),
    );
}

export function clearRecentSearches(): void {
  usePreferencesStore.getState().set("recentSearches", () => []);
}
