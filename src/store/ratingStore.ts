import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RatingState {
  ratings: Record<string, number>;
  get: (slug: string) => number | null;
  set: (slug: string, score: number) => void;
}

export const useRatingStore = create<RatingState>()(
  persist(
    (set, get) => ({
      ratings: {},
      get: (slug) => get().ratings[slug] ?? null,
      set: (slug, score) => set((s) => ({ ratings: { ...s.ratings, [slug]: score } })),
    }),
    { name: "kk-ratings" },
  ),
);
