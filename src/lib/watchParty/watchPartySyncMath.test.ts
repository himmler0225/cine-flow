import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { projectedTime, shouldResync } from "./watchPartySyncMath.ts";

describe("watch party sync math", () => {
  it("projects playback time while playing", () => {
    const now = 1_000_000;

    const projected = projectedTime(
      {
        is_playing: true,
        playback_time: 100,
        saved_at: now - 5000,
      },
      now,
    );

    assert.equal(projected, 105);
  });

  it("keeps paused time fixed", () => {
    assert.equal(
      projectedTime({
        is_playing: false,
        playback_time: 42,
        saved_at: Date.now() - 10_000,
      }),
      42,
    );
  });

  it("flags drift above threshold", () => {
    assert.equal(shouldResync(10, 13, 2), true);

    assert.equal(shouldResync(10, 11.5, 2), false);
  });
});
