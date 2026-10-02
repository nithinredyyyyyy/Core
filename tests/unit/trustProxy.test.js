import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import rateLimit from "express-rate-limit";
import { readFileSync } from "node:fs";

test("Render's single proxy hop keys limits on the rightmost client IP, ignoring spoofed prefixes", async (t) => {
  const source = readFileSync(new URL("../../server/index.js", import.meta.url), "utf8");
  assert.match(source, /app\.set\("trust proxy", isProduction \? 1 : false\)/);
  const app = express();
  app.set("trust proxy", 1);
  app.use(rateLimit({ windowMs: 60_000, limit: 1 }));
  app.get("/", (req, res) => res.json({ ip: req.ip }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  const request = (forwarded) => fetch(url, { headers: { "X-Forwarded-For": forwarded } });
  const first = await request("198.51.100.99, 203.0.113.10");
  assert.equal(first.status, 200);
  assert.equal((await first.json()).ip, "203.0.113.10");
  assert.equal((await request("198.51.100.100, 203.0.113.10")).status, 429);
  assert.equal((await request("203.0.113.11")).status, 200);
});
