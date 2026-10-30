import { create } from "zustand";
import { t } from "@/lib/i18n";

export interface Watchlist {
  id: string;
  name: string;
  slugs: string[];
  createdAt: number;
  /** Public link state (server-managed; absent until shared). */
  isPublic?: boolean;
  shareId?: string | null;
}

interface WatchlistState {
  lists: Watchlist[];
  createList: (name: string) => string;
  deleteList: (id: string) => void;
  addToList: (listId: string, slug: string) => void;
  removeFromList: (listId: string, slug: string) => void;
  isInList: (listId: string, slug: string) => boolean;
  replaceLists: (lists: Watchlist[]) => void;
  setSharing: (listId: string, isPublic: boolean, shareId: string | null) => void;
}

export function defaultWatchlists(): Watchlist[] {
  return [
    { id: "default", name: t("watchlist.defaultWeekend"), slugs: [], createdAt: Date.now() },
    { id: "watchlater", name: t("watchlist.watchLater"), slugs: [], createdAt: Date.now() },
  ];
}

/** In memory only; useWatchlistSync loads it from and saves it to the database. */
export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  lists: defaultWatchlists(),
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
  setSharing: (listId, isPublic, shareId) =>
    set((s) => ({
      lists: s.lists.map((l) => (l.id === listId ? { ...l, isPublic, shareId } : l)),
    })),
}));
