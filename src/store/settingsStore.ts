import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    { name: "kkflix-settings" },
  ),
);
