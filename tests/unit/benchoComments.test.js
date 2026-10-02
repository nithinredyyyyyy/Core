import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const normalized = (value) => value.replace(/\s+/g, " ");
for (const name of ["MagnifyingDock", "Carousel"]) {
  for (const [sourceExt, outputExt] of [["tsx", "jsx"], ["css", "css"]]) {
    test(`${name} preserves all supplied ${sourceExt} comments`, () => {
      const original = readFileSync(new URL(`../../docs/bencho/${name}.${sourceExt}`, import.meta.url), "utf8");
      const adapted = normalized(readFileSync(new URL(`../../src/components/bencho/${name}.${outputExt}`, import.meta.url), "utf8"));
      for (const comment of original.match(/\/\*[\s\S]*?\*\//g) || []) {
        assert.ok(adapted.includes(normalized(comment)), `Missing comment: ${comment.slice(0, 70)}`);
      }
    });
  }
}
