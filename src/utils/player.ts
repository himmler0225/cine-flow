import {
  EMBED_URL_QUERY_PATTERN,
  HLS_EXTENSION_PATTERN,
  PLAYER_PATH_PATTERN,
} from "@/constants/patterns";
import { STORAGE_KEYS } from "@/constants/storage";

export const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;

export function isEmbedUrl(url?: string): boolean {
  if (!url) return false;
  return (
    PLAYER_PATH_PATTERN.test(url) ||
    EMBED_URL_QUERY_PATTERN.test(url) ||
    !HLS_EXTENSION_PATTERN.test(url)
  );
}

export function readSkipAdsPreference(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEYS.skipAds);
  return v === null ? true : v === "1";
}

export function writeSkipAdsPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.skipAds, enabled ? "1" : "0");
}
