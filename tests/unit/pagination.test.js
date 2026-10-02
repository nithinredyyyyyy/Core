import { test } from "node:test";
import assert from "node:assert/strict";
import { paginationSchema, searchQuerySchema } from "../../server/services/pagination.js";

test("pagination has finite defaults, caps, and a validated offset", () => {
  const schema = paginationSchema();
  assert.deepEqual(schema.parse({}), { limit: 100, skip: 0 });
  assert.deepEqual(schema.parse({ limit: "9999", skip: "4" }), { limit: 500, skip: 4 });
  assert.equal(paginationSchema({ maxLimit: 5000 }).parse({ limit: "6000" }).limit, 5000);
  for (const limit of ["-1", -1, "0", 0, "", " ", "NaN", "Infinity", "1.5", 1.5, [], [1], true, null, Infinity, 1e20]) {
    assert.equal(schema.safeParse({ limit }).success, false, `accepted ${JSON.stringify(limit)}`);
  }
  for (const skip of ["-1", "1.1", "1000001", ["1"], null]) {
    assert.equal(schema.safeParse({ skip }).success, false);
  }
});

test("search validates query types/length and shares bounded integer limits", () => {
  assert.deepEqual(searchQuerySchema.parse({}), { q: "", limit: 10 });
  assert.deepEqual(searchQuerySchema.parse({ q: " soul ", limit: "50" }), { q: "soul", limit: 20 });
  for (const input of [{ q: ["a", "b"] }, { q: "x".repeat(201) }, { limit: "1.5" }]) {
    assert.equal(searchQuerySchema.safeParse(input).success, false);
  }
});
