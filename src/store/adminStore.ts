import { create } from "zustand";

export type DateRange = "1d" | "7d" | "30d" | "90d";

interface AdminStore {
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
  getDateFrom: () => string;
  getPrevDateFrom: () => string;
  getRangeDays: () => number;
}

const DAYS: Record<DateRange, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 };

export const useAdminStore = create<AdminStore>((set, get) => ({
  dateRange: "7d",
  setDateRange: (r) => set({ dateRange: r }),
  getRangeDays: () => DAYS[get().dateRange],
  getDateFrom: () => {
    const d = new Date();
    d.setDate(d.getDate() - DAYS[get().dateRange]);
    return d.toISOString();
  },
  getPrevDateFrom: () => {
    const d = new Date();
    d.setDate(d.getDate() - DAYS[get().dateRange] * 2);
    return d.toISOString();
  },
}));
