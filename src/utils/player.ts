import {
  EMBED_URL_QUERY_PATTERN,
  HLS_EXTENSION_PATTERN,
  PLAYER_PATH_PATTERN,
} from "@/constants/patterns";
import { readStorageKey, writeStorageKey } from "@/constants/storage";

export const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;

export function isEmbedUrl(url?: string): boolean {
  if (!url) return false;
  return (
    PLAYER_PATH_PATTERN.test(url) ||
    EMBED_URL_QUERY_PATTERN.test(url) ||
    !HLS_EXTENSION_PATTERN.test(url)
  );
}

export function extractM3u8Url(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (HLS_EXTENSION_PATTERN.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const nested = parsed.searchParams.get("url");
    if (nested && HLS_EXTENSION_PATTERN.test(nested)) return nested.trim();
  } catch {
    /* malformed URL — fall back to empty result below */
  }
  return "";
}

export function resolvePlayableSrc(src?: string | null, embed?: string | null): string {
  return extractM3u8Url(src) || extractM3u8Url(embed) || "";
}

export function readSkipAdsPreference(): boolean {
  if (typeof window === "undefined") return false;
  const v = readStorageKey("skipAds");
  return v === "1";
}

export function writeSkipAdsPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  writeStorageKey("skipAds", enabled ? "1" : "0");
}
