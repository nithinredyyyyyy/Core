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

for (const succeeds of [false, true]) {
  test(`logout ${succeeds ? "clears" : "preserves"} local session after server response`, async (t) => {
    installBrowserStubs();
    window.localStorage.setItem(
      "stagecore_auth_user_email",
      "member@example.test",
    );
    window.localStorage.setItem("stagecore_csrf_token", "synthetic-csrf");
    globalThis.fetch = async () =>
      new Response(succeeds ? null : "Request failed", {
        status: succeeds ? 204 : 503,
      });
    t.after(() => {
      delete globalThis.fetch;
      delete globalThis.window;
    });
    if (succeeds) await base44.auth.logout();
    else await assert.rejects(base44.auth.logout(), /Request failed/);
    assert.equal(Boolean(base44.auth.getStoredSession().user), !succeeds);
    assert.equal(
      Boolean(window.localStorage.getItem("stagecore_csrf_token")),
      !succeeds,
    );
  });
}
