import { test } from "node:test";
import assert from "node:assert/strict";

import { base44 } from "../../src/api/base44Client.js";

function installBrowserStubs() {
  const storage = new Map();
  globalThis.window = {
    location: { protocol: "http:" },
    localStorage: {
      getItem(key) {
        return storage.get(key) || "";
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
  };
}

test("admin player stats save uses the backend POST route", async (t) => {
  installBrowserStubs();

  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true };
      },
    };
  };

  t.after(() => {
    delete globalThis.fetch;
    delete globalThis.window;
  });

  await base44.admin.saveBmps2026PlayerStats({ players: [] });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/admin/bmps-2026-player-stats");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.body, JSON.stringify({ players: [] }));
});
