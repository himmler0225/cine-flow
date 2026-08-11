import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeWatchProgress } from "./watchHistoryMerge.ts";

describe("mergeWatchProgress", () => {
  it("keeps the higher progress when updating", () => {
    const merged = mergeWatchProgress(
      {
        movie_slug: "a",
        movie_name: "A",
        episode_name: "1",
        server_index: 0,
        progress_sec: 600,
        duration_sec: 5400,
        watched_at: "2026-01-01T00:00:00.000Z",
      },
      {
        movie_slug: "a",
        movie_name: "A",
        episode_name: "1",
        server_index: 0,
        progress_sec: 10,
        duration_sec: 5400,
        watched_at: "2026-01-01T00:00:00.000Z",
      },
      "2026-01-02T00:00:00.000Z",
    );

    assert.equal(merged.progress_sec, 600);
  });

  it("allows intentional reset near start", () => {
    const merged = mergeWatchProgress(
      {
        movie_slug: "a",
        movie_name: "A",
        episode_name: "1",
        server_index: 0,
        progress_sec: 600,
        duration_sec: 5400,
        watched_at: "2026-01-01T00:00:00.000Z",
      },
      {
        movie_slug: "a",
        movie_name: "A",
        episode_name: "1",
        server_index: 0,
        progress_sec: 3,
        duration_sec: 5400,
        watched_at: "2026-01-01T00:00:00.000Z",
      },
      "2026-01-02T00:00:00.000Z",
    );

    assert.equal(merged.progress_sec, 3);
  });
});
