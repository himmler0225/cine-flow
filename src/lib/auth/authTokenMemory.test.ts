import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("auth token memory policy", () => {
  it("prefers short-lived access in memory and long-lived refresh in storage", () => {
    let memoryAccess: string | null = null;
    const storage = new Map<string, string>();

    const setAccess = (token: string | null) => {
      memoryAccess = token;
      storage.delete("access");
    };
    const setRefresh = (token: string | null) => {
      if (token == null) storage.delete("refresh");
      else storage.set("refresh", token);
    };

    setAccess("a1");
    setRefresh("r1");
    assert.equal(memoryAccess, "a1");
    assert.equal(storage.has("access"), false);
    assert.equal(storage.get("refresh"), "r1");

    setAccess(null);
    setRefresh(null);
    assert.equal(memoryAccess, null);
    assert.equal(storage.size, 0);
  });
});
