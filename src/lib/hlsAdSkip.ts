import Hls from "hls.js";
import {
  findActiveAdRange,
  findAdRanges,
  firstVariantUrl,
  parseMediaPlaylist,
  type AdRange,
} from "@/lib/adRanges";

export type { AdRange };

/**
 * Detect ad breaks in every loaded level. The playlist is left untouched: removing fragments
 * after hls.js parsed it left holes in the timeline (playback could stall there) and the old
 * discontinuity heuristic flagged whole chunks of the episode as ads.
 */
export function attachHlsAdDetection(hls: Hls, onRanges: (ranges: AdRange[]) => void): void {
  hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
    onRanges(
      findAdRanges(
        data.details.fragments.map((f) => ({ start: f.start, duration: f.duration, url: f.url })),
      ),
    );
  });
}

/** Same detection for native HLS (Safari / iOS), where the browser never exposes the playlist. */
export async function detectAdRangesFromUrl(url: string, signal: AbortSignal): Promise<AdRange[]> {
  const load = async (u: string) => {
    const res = await fetch(u, { signal });

    if (!res.ok) throw new Error(`playlist ${res.status}`);

    return res.text();
  };

  let playlistUrl = url;

  let text = await load(url);

  const variant = firstVariantUrl(text, url);

  if (variant) {
    playlistUrl = variant;

    text = await load(variant);
  }

  return findAdRanges(parseMediaPlaylist(text, playlistUrl));
}

/** Jump just past an ad break. */
export function seekPastAd(video: HTMLVideoElement, range: AdRange): void {
  const duration =
    Number.isFinite(video.duration) && video.duration > 0 ? video.duration : range.end + 1;

  try {
    video.currentTime = Math.min(range.end + 0.1, Math.max(0, duration - 0.25));
  } catch {}
}

/** Auto-skip: if the playhead is inside an ad, jump past it and return the range. */
export function skipAdAt(video: HTMLVideoElement, ranges: AdRange[]): AdRange | null {
  const active = findActiveAdRange(video.currentTime, ranges);

  if (active) seekPastAd(video, active);

  return active;
}
