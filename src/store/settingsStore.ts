import { usePreferencesStore } from "@/store/preferencesStore";

interface SettingsState {
  dataSaver: boolean;
  setDataSaver: (v: boolean) => void;
}

function setDataSaver(dataSaver: boolean) {
  usePreferencesStore.getState().set("settings", (prev) => ({ ...prev, dataSaver }));
}

/** App settings, stored per user in the database through the preferences store. */
export function useSettingsStore<T>(selector: (state: SettingsState) => T): T {
  return usePreferencesStore((s) =>
    selector({ dataSaver: s.prefs.settings?.dataSaver === true, setDataSaver }),
  );
}
