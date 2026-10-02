import { test } from "node:test";
import assert from "node:assert/strict";
import { logRequestError, requestContext, requestErrorHandler } from "../../server/services/requestErrors.js";
import { logger } from "../../server/services/logger.js";

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return value; },
  };
}

test("request errors log diagnostic metadata without raw messages, credentials or payloads", (t) => {
  const entries = [];
  t.mock.method(logger, "error", (...args) => entries.push(args));
  const marker = "synthetic-private-credential";
  const req = {
    requestId: "generated-id", method: "POST", route: { path: "/auth/google" },
    body: { credential: marker }, headers: { cookie: marker },
  };
  logRequestError(req, new Error(marker));
  assert.equal(entries.length, 1);
  assert.equal(JSON.stringify(entries).includes(marker), false);
  assert.equal(entries[0][1].requestId, "generated-id");
});

test("error responses omit validation values and raw details, even for direct route responses", () => {
  const req = {};
  const res = response();
  requestContext(req, res, () => {});
  res.status(400).json({ error: "private data", issues: [{ input: "private data" }], code: "invalid" });
  assert.deepEqual(res.body, { error: "Invalid request", code: "invalid", requestId: req.requestId });
  assert.equal(res.headers["X-Request-ID"], req.requestId);
});

test("body parsing failures preserve correct status codes and response ids", (t) => {
  t.mock.method(logger, "error", () => {});
  for (const [type, status] of [["entity.too.large", 413], ["entity.parse.failed", 400]]) {
    const req = { method: "POST" };
    const res = response();
    requestContext(req, res, () => {});
    requestErrorHandler(Object.assign(new Error("private"), { type }), req, res, () => {});
    assert.equal(res.statusCode, status);
    assert.equal(res.body.requestId, req.requestId);
    assert.equal(JSON.stringify(res.body).includes("private"), false);
  }
});
