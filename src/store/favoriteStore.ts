import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MovieListItem } from "@/types/movie";
import { setEpisodeSnapshot } from "@/utils/episodeSnapshots";
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from "@/constants/storage";

function migratePersistName(next: string, legacy: string | null) {
  if (typeof window === "undefined" || !legacy) return;

  if (localStorage.getItem(next) != null) return;

  const old = localStorage.getItem(legacy);

  if (old == null) return;

  localStorage.setItem(next, old);

  localStorage.removeItem(legacy);
}

migratePersistName(STORAGE_KEYS.favorites, LEGACY_STORAGE_KEYS.favorites);

interface FavState {
  favorites: MovieListItem[];
  add: (m: MovieListItem) => void;
  remove: (slug: string) => void;
  toggle: (m: MovieListItem) => void;
  has: (slug: string) => boolean;
  clearAll: () => void;
}

export const useFavoriteStore = create<FavState>()(
  persist(
    (set, get) => ({
      favorites: [],
      add: (m) => {
        set((s) =>
          s.favorites.find((f) => f.slug === m.slug) ? s : { favorites: [m, ...s.favorites] },
        );

        if (m.episode_current) setEpisodeSnapshot(m.slug, m.episode_current);
      },
      remove: (slug) => set((s) => ({ favorites: s.favorites.filter((f) => f.slug !== slug) })),
      toggle: (m) => {
        const has = get().favorites.some((f) => f.slug === m.slug);

        if (has) get().remove(m.slug);
        else get().add(m);
      },
      has: (slug) => get().favorites.some((f) => f.slug === slug),
      clearAll: () => set({ favorites: [] }),
    }),
    { name: STORAGE_KEYS.favorites },
  ),
);
