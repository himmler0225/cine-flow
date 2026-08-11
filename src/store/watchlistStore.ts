import { create } from "zustand";
import { persist } from "zustand/middleware";
import { t } from "@/lib/i18n";
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from "@/constants/storage";

function migratePersistName(next: string, legacy: string | null) {
  if (typeof window === "undefined" || !legacy) return;

  if (localStorage.getItem(next) != null) return;

  const old = localStorage.getItem(legacy);

  if (old == null) return;

  localStorage.setItem(next, old);

  localStorage.removeItem(legacy);
}

migratePersistName(STORAGE_KEYS.watchlists, LEGACY_STORAGE_KEYS.watchlists);

export interface Watchlist {
  id: string;
  name: string;
  slugs: string[];
  createdAt: number;
}

interface WatchlistState {
  lists: Watchlist[];
  createList: (name: string) => string;
  deleteList: (id: string) => void;
  addToList: (listId: string, slug: string) => void;
  removeFromList: (listId: string, slug: string) => void;
  isInList: (listId: string, slug: string) => boolean;
  replaceLists: (lists: Watchlist[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      lists: [
        { id: "default", name: t("watchlist.defaultWeekend"), slugs: [], createdAt: Date.now() },
        { id: "watchlater", name: t("watchlist.watchLater"), slugs: [], createdAt: Date.now() },
      ],
      createList: (name) => {
        const id = crypto.randomUUID();

        set((s) => ({
          lists: [{ id, name: name.trim(), slugs: [], createdAt: Date.now() }, ...s.lists],
        }));

        return id;
      },
      deleteList: (id) => {
        if (id === "default" || id === "watchlater") return;

        set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
      },
      addToList: (listId, slug) => {
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId && !l.slugs.includes(slug) ? { ...l, slugs: [slug, ...l.slugs] } : l,
          ),
        }));
      },
      removeFromList: (listId, slug) => {
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, slugs: l.slugs.filter((x) => x !== slug) } : l,
          ),
        }));
      },
      isInList: (listId, slug) => {
        const list = get().lists.find((l) => l.id === listId);

        return list?.slugs.includes(slug) ?? false;
      },
      replaceLists: (lists) => set({ lists }),
    }),
    { name: STORAGE_KEYS.watchlists },
  ),
);
