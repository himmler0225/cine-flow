import Hls from "hls.js";
import { HLS_AD_URL_PATTERN } from "@/constants/patterns";

export type AdRange = { start: number; end: number };

function getHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** Attach HLS ad-detection listeners. Returns cleanup is handled by hls.destroy(). */
export function attachHlsAdSkip(
  hls: Hls,
  adRangesRef: { current: AdRange[] },
  onAdsDetected: (count: number) => void,
): void {
  hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
    const frags = data.details.fragments;
    if (!frags || frags.length < 3) return;

    const prefixCounts = new Map<string, number>();
    for (const f of frags) {
      const url = f.url || (f as { relurl?: string }).relurl || "";
      const prefix = url.slice(0, url.lastIndexOf("/"));
      prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
    }
    const dominantPrefix = [...prefixCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const filtered = frags.filter((f) => {
      const url = f.url || (f as { relurl?: string }).relurl || "";
      if (HLS_AD_URL_PATTERN.test(url)) return false;
      const prefix = url.slice(0, url.lastIndexOf("/"));
      return prefix === dominantPrefix || (prefixCounts.get(prefix) ?? 0) >= frags.length * 0.3;
    });
    const urlRemoved = frags.length - filtered.length;
    if (urlRemoved > 0 && filtered.length > 0) {
      data.details.fragments = filtered;
      data.details.totalduration = filtered.reduce((s, f) => s + f.duration, 0);
      onAdsDetected(urlRemoved);
    }

    const remaining = data.details.fragments;
    if (!remaining || remaining.length < 4) return;
    const ccGroups = new Map<number, typeof remaining>();
    for (const f of remaining) {
      const cc = (f as { cc?: number }).cc ?? 0;
      if (!ccGroups.has(cc)) ccGroups.set(cc, []);
      ccGroups.get(cc)!.push(f);
    }
    if (ccGroups.size < 2) return;
    let mainCc = 0;
    let maxDur = 0;
    ccGroups.forEach((group, cc) => {
      const dur = group.reduce((s, f) => s + f.duration, 0);
      if (dur > maxDur) {
        maxDur = dur;
        mainCc = cc;
      }
    });
    const disc: AdRange[] = [];
    ccGroups.forEach((group, cc) => {
      if (cc === mainCc) return;
      const last = group[group.length - 1];
      disc.push({ start: group[0].start, end: last.start + last.duration + 0.1 });
    });
    if (disc.length > 0) adRangesRef.current = disc;
  });

  const fragDomainCount = new Map<string, number>();
  hls.on(Hls.Events.FRAG_LOADED, (_e, data) => {
    const url = data.frag.url || "";
    if (!url) return;
    const host = getHost(url);
    if (!host) return;

    fragDomainCount.set(host, (fragDomainCount.get(host) ?? 0) + 1);
    const total = [...fragDomainCount.values()].reduce((a, b) => a + b, 0);
    if (total < 4) return;

    const sorted = [...fragDomainCount.entries()].sort((a, b) => b[1] - a[1]);
    const [dominantHost, dominantCount] = sorted[0];

    if (host !== dominantHost && dominantCount >= 4) {
      const frag = data.frag;
      const rangeStart = frag.start;
      const rangeEnd = frag.start + frag.duration + 0.15;
      const existing = adRangesRef.current.find((r) => Math.abs(r.start - rangeStart) < 2);
      if (existing) {
        existing.end = Math.max(existing.end, rangeEnd);
      } else {
        adRangesRef.current = [...adRangesRef.current, { start: rangeStart, end: rangeEnd }];
      }
    }
  });
}

export function skipAdRangesAtTime(
  video: HTMLVideoElement,
  adRanges: AdRange[],
  onSkipped: () => void,
): void {
  const cur = video.currentTime;
  for (const range of adRanges) {
    if (cur >= range.start && cur < range.end) {
      video.currentTime = range.end;
      onSkipped();
      break;
    }
  }
}
