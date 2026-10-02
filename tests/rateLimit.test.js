import { test } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, getBaseUrl } from "./helpers/server.js";

test("malformed JSON is counted by the auth rate limiter", async (t) => {
  await startServer();
  t.after(stopServer);
  for (let index = 0; index < 21; index += 1) {
    const response = await fetch(`${getBaseUrl()}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(response.status, index < 20 ? 400 : 429);
  }
});
