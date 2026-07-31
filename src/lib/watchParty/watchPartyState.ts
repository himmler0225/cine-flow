import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from "@/constants/storage";
import { CACHE_TTL } from "@/constants/timing";
import { projectedTime as projectPlaybackTime } from "@/lib/watchParty/watchPartySyncMath";

export type SyncMode = "auto" | "manual";

export interface RoomSnapshot {
  episode_name: string | null;
  server_index: number;
  playback_time: number;
  is_playing: boolean;
  sync_mode: SyncMode | null;
  saved_at: number;
}

function currentKey(code: string): string {
  return `${STORAGE_KEYS.watchPartyStatePrefix}${code.toUpperCase()}`;
}

function legacyKey(code: string): string | null {
  const prefix = LEGACY_STORAGE_KEYS.watchPartyStatePrefix;
  if (!prefix) return null;
  return `${prefix}${code.toUpperCase()}`;
}

function readRaw(code: string): string | null {
  const cur = localStorage.getItem(currentKey(code));
  if (cur != null) return cur;
  const legacy = legacyKey(code);
  if (!legacy) return null;
  const old = localStorage.getItem(legacy);
  if (old == null) return null;
  localStorage.setItem(currentKey(code), old);
  localStorage.removeItem(legacy);
  return old;
}

export function loadRoomState(code: string): RoomSnapshot | null {
  if (typeof localStorage === "undefined" || !code) return null;
  try {
    const raw = readRaw(code);
    if (!raw) return null;
    const snap = JSON.parse(raw) as RoomSnapshot;
    if (!snap?.saved_at || Date.now() - snap.saved_at > CACHE_TTL.sixHours) {
      clearRoomState(code);
      return null;
    }
    return snap;
  } catch {
    return null;
  }
}

export function saveRoomState(code: string, patch: Partial<RoomSnapshot>): void {
  if (typeof localStorage === "undefined" || !code) return;
  try {
    const prev = loadRoomState(code) ?? {
      episode_name: null,
      server_index: 0,
      playback_time: 0,
      is_playing: false,
      sync_mode: null,
      saved_at: 0,
    };
    const next: RoomSnapshot = { ...prev, ...patch, saved_at: Date.now() };
    localStorage.setItem(currentKey(code), JSON.stringify(next));
    const legacy = legacyKey(code);
    if (legacy) localStorage.removeItem(legacy);
  } catch {
    /* storage unavailable (private mode / quota) — non-critical */
  }
}

export function clearRoomState(code: string): void {
  try {
    localStorage.removeItem(currentKey(code));
    const legacy = legacyKey(code);
    if (legacy) localStorage.removeItem(legacy);
  } catch {
    /* storage unavailable (private mode / quota) — non-critical */
  }
}

export function projectedTime(snap: RoomSnapshot): number {
  return projectPlaybackTime(snap);
}
