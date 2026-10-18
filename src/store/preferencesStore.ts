import { create } from "zustand";
import { preferencesApi, type UserPreferences } from "@/services/platform/preferences.service";

type PrefKey = keyof UserPreferences;

interface PreferencesState {
  prefs: UserPreferences;
  /** True once the signed-in user's preferences arrived from the server. */
  loaded: boolean;
  userId: string | null;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  /** Updates one key locally right away and saves it to the server (debounced). */
  set: <K extends PrefKey>(
    key: K,
    update: (prev: UserPreferences[K] | undefined) => UserPreferences[K],
  ) => void;
}

const SAVE_DELAY_MS = 800;

/** Keys changed locally and not yet sent to the server. */
const pending = new Set<PrefKey>();

type QueuedUpdate = [PrefKey, (prev: unknown) => unknown];

/** Changes made before the server copy arrived; replayed on top of it. */
let queued: QueuedUpdate[] = [];

let saveTimer: ReturnType<typeof setTimeout> | undefined;

let inflight: { userId: string; promise: Promise<void> } | null = null;

function flush() {
  saveTimer = undefined;

  const { prefs, userId, loaded } = usePreferencesStore.getState();

  if (!userId || !loaded || pending.size === 0) return;

  const patch: Record<string, unknown> = {};

  for (const key of pending) patch[key] = prefs[key];

  pending.clear();

  preferencesApi.update(patch as Partial<UserPreferences>).catch((error) => {
    console.warn("[preferences] save failed", error);
  });
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(flush, SAVE_DELAY_MS);
}

function flushNow() {
  if (!saveTimer) return;

  clearTimeout(saveTimer);

  flush();
}

if (typeof window !== "undefined") {
  // Don't lose the last change (e.g. volume) when the tab is hidden or closed inside the
  // debounce window; "hidden" fires early enough for the request to go out.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushNow();
  });

  window.addEventListener("pagehide", flushNow);
}

async function loadFromServer(userId: string) {
  const { getState: get, setState: set } = usePreferencesStore;

  set({ userId, loaded: false });

  try {
    const remote = await preferencesApi.fetch();

    if (get().userId !== userId) return;

    const merged: Record<string, unknown> = { ...remote };

    for (const [key, update] of queued) merged[key] = update(merged[key]);

    queued = [];

    set({ prefs: merged as UserPreferences, loaded: true });

    if (pending.size > 0) scheduleSave();
  } catch (error) {
    console.warn("[preferences] load failed", error);

    if (get().userId !== userId) return;

    // Keep the in-memory values but never save them over a server copy we could not read.
    queued = [];

    pending.clear();

    set({ loaded: true, userId: null });
  }
}

/**
 * Per-user settings (player volume/speed, per-movie server, data saver, ad skip,
 * recent searches, new-episode marks). Kept in memory only and stored in the
 * database — nothing is written to the browser. Guests get in-memory defaults.
 */
export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  prefs: {},
  loaded: false,
  userId: null,
  load: (userId) => {
    if (get().userId === userId && get().loaded) return Promise.resolve();

    // initialize() and the SIGNED_IN event both ask for the same user: share one request so
    // a second, older server copy cannot replace edits made after the first one arrived.
    if (inflight?.userId === userId) return inflight.promise;

    const promise = loadFromServer(userId).finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });

    inflight = { userId, promise };

    return promise;
  },
  reset: () => {
    pending.clear();

    queued = [];

    inflight = null;

    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = undefined;

    set({ prefs: {}, loaded: false, userId: null });
  },
  set: (key, update) => {
    set((s) => ({ prefs: { ...s.prefs, [key]: update(s.prefs[key]) } }));

    if (!get().userId) return;

    pending.add(key);

    if (!get().loaded) {
      queued.push([key, update as (prev: unknown) => unknown]);

      return;
    }

    scheduleSave();
  },
}));
