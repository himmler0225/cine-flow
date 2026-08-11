import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getWatchProgressPercent, isWatchFinished } from "./watchProgress.ts";

describe("watch progress", () => {
  it("marks finished at 95%", () => {
    assert.equal(isWatchFinished(95, 100), true);

    assert.equal(isWatchFinished(50, 100), false);
  });

  it("handles zero duration", () => {
    assert.equal(isWatchFinished(10, 0), false);

    assert.equal(getWatchProgressPercent(10, 0), 0);
  });

  it("clamps percent when requested", () => {
    assert.equal(getWatchProgressPercent(150, 100, { clamp: true }), 100);

    assert.equal(getWatchProgressPercent(150, 100), 150);
  });
});
