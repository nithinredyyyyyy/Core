import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { safeInternalPath } from "../../src/lib/safeRedirect.js";

describe("safeInternalPath", () => {
  test("allows normal internal paths", () => {
    assert.equal(safeInternalPath("/players/abc"), "/players/abc");
    assert.equal(safeInternalPath("/tournaments?id=42"), "/tournaments?id=42");
    assert.equal(safeInternalPath("/news/1#top"), "/news/1#top");
  });

  test("rejects absolute and protocol-relative URLs", () => {
    assert.equal(safeInternalPath("https://evil.com"), "/");
    assert.equal(safeInternalPath("//evil.com"), "/");
    assert.equal(safeInternalPath("http://evil.com/path"), "/");
  });

  test("rejects backslash variants that bypass a naive slash check", () => {
    assert.equal(safeInternalPath("/\\evil.com"), "/");
    assert.equal(safeInternalPath("/\\\\evil.com"), "/");
    assert.equal(safeInternalPath("\\/evil.com"), "/");
    assert.equal(safeInternalPath("/path\\to"), "/");
  });

  test("rejects non-path values and empty input", () => {
    assert.equal(safeInternalPath("players/abc"), "/");
    assert.equal(safeInternalPath(""), "/");
    assert.equal(safeInternalPath(null), "/");
    assert.equal(safeInternalPath(undefined), "/");
  });

  test("uses a custom fallback when provided", () => {
    assert.equal(safeInternalPath("//evil.com", "/home"), "/home");
  });

  test("normalizes encoded dot segments that stay on-origin", () => {
    assert.equal(safeInternalPath("/a/../b"), "/b");
  });
});
