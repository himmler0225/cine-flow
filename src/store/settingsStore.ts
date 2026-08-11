import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from "@/constants/storage";

function migratePersistName(next: string, legacy: string | null) {
  if (typeof window === "undefined" || !legacy) return;

  if (localStorage.getItem(next) != null) return;

  const old = localStorage.getItem(legacy);

  if (old == null) return;

  localStorage.setItem(next, old);

  localStorage.removeItem(legacy);
}

migratePersistName(STORAGE_KEYS.settings, LEGACY_STORAGE_KEYS.settings);

interface SettingsState {
  dataSaver: boolean;
  setDataSaver: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataSaver: false,
      setDataSaver: (dataSaver) => set({ dataSaver }),
    }),
    { name: STORAGE_KEYS.settings },
  ),
);
