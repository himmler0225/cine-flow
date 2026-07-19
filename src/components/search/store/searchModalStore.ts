import { create } from "zustand";
import type { SearchQuickFilter } from "@/lib/movie/movieFilters";

type SearchModalState = {
  q: string;
  quickFilter: SearchQuickFilter;
  setQ: (q: string) => void;
  setQuickFilter: (filter: SearchQuickFilter) => void;
  reset: () => void;
};

export const useSearchModalStore = create<SearchModalState>((set) => ({
  q: "",
  quickFilter: "all",
  setQ: (q) => set({ q }),
  setQuickFilter: (quickFilter) => set({ quickFilter }),
  reset: () => set({ q: "", quickFilter: "all" }),
}));
