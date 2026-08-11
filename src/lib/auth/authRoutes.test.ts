import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPublicBrowsePath, isPublicPath, isPublicAuthPath } from "./authRoutes.ts";

describe("auth public paths", () => {
  it("exposes browse routes without login", () => {
    assert.equal(isPublicBrowsePath("/"), true);

    assert.equal(isPublicBrowsePath("/movie/abc"), true);

    assert.equal(isPublicBrowsePath("/search"), true);

    assert.equal(isPublicPath("/watch/abc"), false);

    assert.equal(isPublicAuthPath("/login"), true);
  });
});
