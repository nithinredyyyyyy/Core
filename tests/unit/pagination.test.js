import { test } from "node:test";
import assert from "node:assert/strict";

import { collectAllPages, paginateList } from "../../src/services/pagination.js";

// A fake entity backed by `total` rows that honours skip/limit exactly like the
// server does, so the helper is exercised against real pagination arithmetic
// rather than a mock that cannot truncate.
function fakeEntity(total) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i }));
  return {
    async list(_sortBy, limit, skip = 0) {
      return rows.slice(skip, skip + limit);
    },
  };
}

test("retrieves a set larger than a single page without truncation", async () => {
  const rows = await paginateList(fakeEntity(1234), "id", { pageSize: 500 });
  assert.equal(rows.length, 1234);
  assert.deepEqual(rows[0], { id: 0 });
  assert.deepEqual(rows[1233], { id: 1233 });
});

test("returns an empty array for an empty entity", async () => {
  assert.deepEqual(await collectAllPages(async () => []), []);
});

test("stops exactly at the set boundary", async () => {
  const rows = await paginateList(fakeEntity(1000), "id", { pageSize: 500 });
  assert.equal(rows.length, 1000);
});

test("honours maxPages as a safety bound", async () => {
  const rows = await collectAllPages(
    (skip, limit) => fakeEntity(50_000).list("id", limit, skip),
    { pageSize: 500, maxPages: 3 },
  );
  assert.equal(rows.length, 1500);
});
