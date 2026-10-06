export type AdRange = {
  start: number;
  end: number;
};

export type PlaylistSegment = {
  start: number;
  duration: number;
  url: string;
};

const AD_URL_PATTERN = /(\/ads?\/|\/advert|googlevideo|doubleclick|adserver|preroll)/i;

/** Ads making up more than this share of a playlist means the heuristic is wrong, not ads. */
const MAX_AD_SHARE = 0.35;

/** Contiguous ad segments closer than this are merged into one range. */
const MERGE_GAP_SEC = 0.5;

function directoryOf(url: string): string {
  const path = url.split(/[?#]/)[0];

  return path.slice(0, path.lastIndexOf("/"));
}

/**
 * Ad breaks spliced into upstream playlists are served from a folder outside the episode's
 * own one (e.g. .../v8/<hash>/segment_0001.ts in the middle of .../<id>/3500kb/hls/*.ts).
 * Sub-folders of the episode (e.g. .../hls/convertv8/) are the episode itself — they carry a
 * burned-in banner but are real footage, so they must never be skipped. Discontinuity tags are
 * not used: the episode is split into several discontinuity groups around every ad, and
 * treating all but the longest group as ads skipped whole chunks of the movie.
 */
export function findAdRanges(segments: PlaylistSegment[]): AdRange[] {
  if (segments.length < 4) return [];

  const durationByDir = new Map<string, number>();

  let total = 0;

  for (const s of segments) {
    const dir = directoryOf(s.url);

    durationByDir.set(dir, (durationByDir.get(dir) ?? 0) + s.duration);

    total += s.duration;
  }

  const mainDir = [...durationByDir.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  const ranges: AdRange[] = [];

  for (const s of segments) {
    const dir = directoryOf(s.url);

    const isEpisode = dir === mainDir || dir.startsWith(`${mainDir}/`);

    if (isEpisode && !AD_URL_PATTERN.test(s.url)) continue;

    const last = ranges[ranges.length - 1];

    if (last && s.start <= last.end + MERGE_GAP_SEC) {
      last.end = s.start + s.duration;
    } else {
      ranges.push({ start: s.start, end: s.start + s.duration });
    }
  }

  const adTotal = ranges.reduce((sum, r) => sum + (r.end - r.start), 0);

  return total > 0 && adTotal / total > MAX_AD_SHARE ? [] : ranges;
}

export function findActiveAdRange(time: number, ranges: AdRange[]): AdRange | null {
  return ranges.find((r) => time >= r.start && time < r.end - 0.05) ?? null;
}

/** Segments of a media playlist, with start times accumulated from #EXTINF. */
export function parseMediaPlaylist(text: string, playlistUrl: string): PlaylistSegment[] {
  const segments: PlaylistSegment[] = [];

  let start = 0;

  let duration = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();

    if (line.startsWith("#EXTINF:")) {
      duration = parseFloat(line.slice(8)) || 0;
    } else if (line && !line.startsWith("#")) {
      segments.push({ start, duration, url: new URL(line, playlistUrl).href });

      start += duration;
    }
  }

  return segments;
}

/** First variant of a master playlist, or null for a media playlist. */
export function firstVariantUrl(text: string, playlistUrl: string): string | null {
  if (!text.includes("#EXT-X-STREAM-INF")) return null;

  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));

  return line ? new URL(line, playlistUrl).href : null;
}
