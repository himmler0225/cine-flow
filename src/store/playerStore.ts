import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressEntry {
  slug: string;
  name: string;
  poster: string;
  episodeSlug: string;
  episodeName: string;
  serverIndex: number;
  episodeIndex: number;
  updatedAt: number;
}

interface PlayerState {
  history: Record<string, ProgressEntry>;
  saveProgress: (e: ProgressEntry) => void;
  getProgress: (slug: string) => ProgressEntry | undefined;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      history: {},
      saveProgress: (e) => set((s) => ({ history: { ...s.history, [e.slug]: e } })),
      getProgress: (slug) => get().history[slug],
    }),
    { name: "kk-player-history" },
  ),
);
