import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  assertSafeOutboundUrl,
  isPrivateAddress,
  readResponseTextWithLimit,
} from "../../server/services/outboundUrl.js";

describe("isPrivateAddress", () => {
  test("flags loopback, private, link-local and reserved IPv4 ranges", () => {
    for (const address of [
      "127.0.0.1",
      "127.255.255.254",
      "10.0.0.1",
      "10.255.255.255",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "0.0.0.0",
      "100.64.0.1",
      "192.0.0.1",
      "198.18.0.1",
      "224.0.0.1",
    ]) {
      assert.equal(isPrivateAddress(address), true, `${address} should be private`);
    }
  });

  test("allows public IPv4 addresses", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "192.169.0.1"]) {
      assert.equal(isPrivateAddress(address), false, `${address} should be public`);
    }
  });

  test("flags loopback, ULA, link-local and IPv4-mapped private IPv6", () => {
    for (const address of ["::1", "::", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1"]) {
      assert.equal(isPrivateAddress(address), true, `${address} should be private`);
    }
  });

  test("allows public IPv6 addresses", () => {
    for (const address of ["2606:4700:4700::1111", "2001:4860:4860::8888"]) {
      assert.equal(isPrivateAddress(address), false, `${address} should be public`);
    }
  });
});

describe("assertSafeOutboundUrl", () => {
  test("rejects non-http(s) protocols", () => {
    for (const url of ["file:///etc/passwd", "gopher://evil.test/", "ftp://evil.test/x"]) {
      assert.throws(() => assertSafeOutboundUrl(url), /Unsupported URL protocol/);
    }
  });

  test("rejects malformed URLs", () => {
    assert.throws(() => assertSafeOutboundUrl("not a url"), /Invalid URL/);
    assert.throws(() => assertSafeOutboundUrl(""), /Invalid URL/);
  });

  test("rejects literal private and metadata hosts", () => {
    assert.throws(
      () => assertSafeOutboundUrl("http://169.254.169.254/latest/meta-data/"),
      /private or reserved/,
    );
    assert.throws(() => assertSafeOutboundUrl("http://127.0.0.1:4000/"), /private or reserved/);
    assert.throws(() => assertSafeOutboundUrl("http://[::1]/"), /private or reserved/);
  });

  test("accepts public http(s) URLs", () => {
    assert.equal(assertSafeOutboundUrl("https://news.google.com/rss").hostname, "news.google.com");
    assert.equal(assertSafeOutboundUrl("http://8.8.8.8/feed").hostname, "8.8.8.8");
  });
});

describe("readResponseTextWithLimit", () => {
  test("returns the body when under the limit", async () => {
    const response = new Response("hello world");
    assert.equal(await readResponseTextWithLimit(response, 1024), "hello world");
  });

  test("throws when the body exceeds the limit", async () => {
    const response = new Response("x".repeat(4096));
    await assert.rejects(
      () => readResponseTextWithLimit(response, 1024),
      /exceeded the maximum allowed size/,
    );
  });
});
