import { test } from "node:test";
import assert from "node:assert/strict";
import { BoundedCache } from "../../server/services/boundedCache.js";
import { clearPagePayloadCache, sendCachedPagePayload } from "../../server/services/pageCache.js";

test("cache evicts the least recently read entry at its capacity", () => {
  const cache = new BoundedCache({ maxEntries: 2 });
  cache.set("a", 1);
  cache.set("b", 2);
  assert.equal(cache.get("a"), 1);
  cache.set("c", 3);
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("a"), 1);
  assert.equal(cache.get("c"), 3);
});

test("reads do not extend TTL; writes expire stale entries and update existing keys", () => {
  let now = 0;
  const cache = new BoundedCache({ maxEntries: 2, ttlMs: 10, now: () => now });
  cache.set("a", 1);
  now = 5;
  assert.equal(cache.get("a"), 1);
  cache.set("b", 2);
  now = 10;
  assert.equal(cache.get("a"), undefined);
  cache.set("b", 3);
  cache.set("c", 4);
  assert.equal(cache.get("b"), 3);
  now = 20;
  cache.set("d", 5);
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("c"), undefined);
  cache.clear();
  assert.equal(cache.get("d"), undefined);
});

test("page cache rebuilds after invalidation and never caches a thrown build", () => {
  clearPagePayloadCache();
  const res = { json: (value) => value };
  let builds = 0;
  const build = () => ({ revision: ++builds });
  assert.equal(sendCachedPagePayload(res, "page", build).revision, 1);
  assert.equal(sendCachedPagePayload(res, "page", build).revision, 1);
  clearPagePayloadCache();
  assert.equal(sendCachedPagePayload(res, "page", build).revision, 2);
  assert.throws(() => sendCachedPagePayload(res, "error", () => { throw new Error("failure"); }));
  assert.equal(sendCachedPagePayload(res, "error", build).revision, 3);
  clearPagePayloadCache();
});

test("cache bounds cannot enable an infinite eviction loop", () => {
  for (const maxEntries of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => new BoundedCache({ maxEntries }), RangeError);
  }
});
