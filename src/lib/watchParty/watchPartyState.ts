// Per-room local snapshot to help late-joining guests resync immediately
// without waiting for the next DB poll (the host pushes to DB every 10s).
// Stored in localStorage and keyed by room code.

import { STORAGE_KEYS } from "@/constants/storage";
import { CACHE_TTL } from "@/constants/timing";

export type SyncMode = "auto" | "manual";

export interface RoomSnapshot {
  episode_name: string | null;
  server_index: number;
  playback_time: number;
  is_playing: boolean;
  sync_mode: SyncMode | null;
  /** Wall-clock ms when this snapshot was written. */
  saved_at: number;
}

function key(code: string): string {
  return `${STORAGE_KEYS.watchPartyStatePrefix}${code.toUpperCase()}`;
}

export function loadRoomState(code: string): RoomSnapshot | null {
  if (typeof localStorage === "undefined" || !code) return null;
  try {
    const raw = localStorage.getItem(key(code));
    if (!raw) return null;
    const snap = JSON.parse(raw) as RoomSnapshot;
    if (!snap?.saved_at || Date.now() - snap.saved_at > CACHE_TTL.sixHours) {
      localStorage.removeItem(key(code));
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
    localStorage.setItem(key(code), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRoomState(code: string): void {
  try {
    localStorage.removeItem(key(code));
  } catch {
    /* ignore */
  }
}

/**
 * Compute the best-guess current playback time from a snapshot. If the
 * snapshot says the player was playing, extrapolate forward by wall-clock
 * elapsed so a guest joining 20s later doesn't snap back to the saved time.
 */
export function projectedTime(snap: RoomSnapshot): number {
  if (!snap.is_playing) return snap.playback_time;
  const elapsed = (Date.now() - snap.saved_at) / 1000;
  return Math.max(0, snap.playback_time + elapsed);
}
