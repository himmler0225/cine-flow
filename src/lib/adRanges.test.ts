import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findActiveAdRange,
  findAdRanges,
  firstVariantUrl,
  parseMediaPlaylist,
} from "./adRanges.ts";

const EP = "https://a.kvp726.com/20261005/QuUnZ1PZ/3500kb/hls";

const AD = "https://a.kvp726.com/v8/d61a03b1dabe537cc05ffe5c9c280f56";

/** Layout of real kkphim playlists: banner-overlay footage at ~3:00, a 30s ad at 15:00. */
function realPlaylist() {
  const segs: { start: number; duration: number; url: string }[] = [];

  let t = 0;

  const add = (n: number, d: number, url: (i: number) => string) => {
    for (let i = 0; i < n; i++) {
      segs.push({ start: t, duration: d, url: url(i) });

      t += d;
    }
  };

  add(44, 4, (i) => `${EP}/main${i}.ts`);

  add(6, 4, (i) => `${EP}/convertv8/c${i}.ts`);

  add(175, 4, (i) => `${EP}/m2_${i}.ts`);

  add(10, 3, (i) => `${AD}/segment_000${i}.ts`);

  add(400, 4, (i) => `${EP}/m3_${i}.ts`);

  return segs;
}

describe("findAdRanges", () => {
  it("finds only the out-of-folder ad break", () => {
    assert.deepEqual(findAdRanges(realPlaylist()), [{ start: 900, end: 930 }]);
  });

  it("keeps episode sub-folders (banner overlays) as content", () => {
    const ranges = findAdRanges(realPlaylist());

    assert.equal(findActiveAdRange(190, ranges), null);

    assert.equal(findActiveAdRange(10, ranges), null);
  });

  it("flags known ad URL patterns even inside the episode folder", () => {
    const segs = realPlaylist().map((s, i) => (i === 3 ? { ...s, url: `${EP}/ads/x.ts` } : s));

    assert.deepEqual(findAdRanges(segs)[0], { start: 12, end: 16 });
  });

  it("gives up when 'ads' would be a large share of the video", () => {
    // Episode split across two CDN folders: neither half is an ad.
    const segs = Array.from({ length: 40 }, (_, i) => ({
      start: i * 4,
      duration: 4,
      url: i % 2 ? `${EP}/${i}.ts` : `https://b.cdn.net/other/${i}.ts`,
    }));

    assert.deepEqual(findAdRanges(segs), []);
  });

  it("returns nothing for clean playlists", () => {
    assert.deepEqual(
      findAdRanges(
        Array.from({ length: 20 }, (_, i) => ({ start: i * 4, duration: 4, url: `${EP}/${i}.ts` })),
      ),
      [],
    );
  });
});

describe("findActiveAdRange", () => {
  it("matches inside a range only", () => {
    const r = [{ start: 900, end: 930 }];

    assert.deepEqual(findActiveAdRange(900, r), r[0]);

    assert.equal(findActiveAdRange(899.9, r), null);

    assert.equal(findActiveAdRange(930, r), null);
  });
});

describe("playlist parsing", () => {
  it("parses media playlists with relative and absolute URIs", () => {
    const text =
      "#EXTM3U\n#EXTINF:4.0,\na.ts\n#EXT-X-DISCONTINUITY\n#EXTINF:3.5,\nhttps://x.y/ad/b.ts\n";

    assert.deepEqual(parseMediaPlaylist(text, "https://h.com/p/index.m3u8"), [
      { start: 0, duration: 4, url: "https://h.com/p/a.ts" },
      { start: 4, duration: 3.5, url: "https://x.y/ad/b.ts" },
    ]);
  });

  it("resolves the first variant of a master playlist", () => {
    const master = "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\n3500kb/hls/index.m3u8\n";

    assert.equal(
      firstVariantUrl(master, "https://h.com/x/index.m3u8"),
      "https://h.com/x/3500kb/hls/index.m3u8",
    );

    assert.equal(firstVariantUrl("#EXTM3U\n#EXTINF:4,\na.ts", "https://h.com/i.m3u8"), null);
  });
});
