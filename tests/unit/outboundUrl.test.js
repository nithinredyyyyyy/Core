import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Readable } from "node:stream";

import {
  assertSafeOutboundUrl,
  createPinnedLookup,
  fetchPublicText,
  isPrivateAddress,
  readStreamWithLimit,
  requestPinnedAddress,
  resolvePublicAddress,
} from "../../server/services/outboundUrl.js";

function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        server,
        port,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

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

describe("resolvePublicAddress", () => {
  test("rejects hostnames that resolve to private addresses", async () => {
    await assert.rejects(
      () => resolvePublicAddress("http://localhost/feed"),
      /private or reserved/,
    );
  });

  test("returns the literal address for IP-literal URLs without a lookup", async () => {
    const pinned = await resolvePublicAddress("https://8.8.8.8/feed");
    assert.equal(pinned.address, "8.8.8.8");
    assert.equal(pinned.family, 4);
  });
});

describe("createPinnedLookup (DNS rebinding defense)", () => {
  test("always returns the pinned address regardless of hostname", () => {
    const lookupFn = createPinnedLookup("93.184.216.34", 4);

    // A rebinding attacker would have the resolver answer with an internal
    // address here; the pinned lookup must ignore that entirely.
    const results = [];
    lookupFn("internal.attacker.test", {}, (err, address, family) => {
      assert.equal(err, null);
      results.push({ address, family });
    });
    lookupFn("internal.attacker.test", { all: true }, (err, entries) => {
      assert.equal(err, null);
      results.push({ entries });
    });

    assert.deepEqual(results[0], { address: "93.184.216.34", family: 4 });
    assert.deepEqual(results[1], { entries: [{ address: "93.184.216.34", family: 4 }] });
  });

  test("preserves the family of IPv6 pins", () => {
    const lookupFn = createPinnedLookup("2606:4700:4700::1111", 6);
    lookupFn("whatever.test", {}, (err, address, family) => {
      assert.equal(err, null);
      assert.equal(address, "2606:4700:4700::1111");
      assert.equal(family, 6);
    });
  });
});

describe("requestPinnedAddress", () => {
  test("connects to the pinned address while sending the logical Host header", async () => {
    const seen = [];
    const { port, close } = await startServer((req, res) => {
      seen.push(req.headers.host);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("pinned-ok");
    });

    try {
      // `rebind.test` does not resolve at all; the request can only succeed if
      // the socket actually went to the pinned loopback address.
      const result = await requestPinnedAddress({
        url: new URL(`http://rebind.test:${port}/feed`),
        address: "127.0.0.1",
        family: 4,
      });

      assert.equal(result.status, 200);
      assert.equal(result.body, "pinned-ok");
      assert.deepEqual(seen, [`rebind.test:${port}`]);
    } finally {
      await close();
    }
  });

  test("times out when the server never responds", async () => {
    const { port, close } = await startServer(() => {
      // Intentionally never respond.
    });

    try {
      await assert.rejects(
        () =>
          requestPinnedAddress(
            { url: new URL(`http://rebind.test:${port}/slow`), address: "127.0.0.1", family: 4 },
            { timeoutMs: 150 },
          ),
        /timed out/,
      );
    } finally {
      await close();
    }
  });

  test("enforces the response size cap", async () => {
    const { port, close } = await startServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("x".repeat(4096));
    });

    try {
      await assert.rejects(
        () =>
          requestPinnedAddress(
            { url: new URL(`http://rebind.test:${port}/big`), address: "127.0.0.1", family: 4 },
            { maxBytes: 512 },
          ),
        /maximum allowed size/,
      );
    } finally {
      await close();
    }
  });
});

describe("fetchPublicText", () => {
  test("rejects private and metadata destinations before connecting", async () => {
    for (const url of [
      "http://127.0.0.1/feed",
      "http://169.254.169.254/latest/meta-data/",
      "http://localhost/feed",
      "http://[::1]/feed",
    ]) {
      await assert.rejects(() => fetchPublicText(url), /private or reserved/);
    }
  });

  test("rejects non-http(s) schemes", async () => {
    await assert.rejects(() => fetchPublicText("file:///etc/passwd"), /Unsupported URL protocol/);
  });
});

describe("readStreamWithLimit", () => {
  test("returns the body when under the limit", async () => {
    const stream = Readable.from([Buffer.from("hello "), Buffer.from("world")]);
    assert.equal(await readStreamWithLimit(stream, 1024), "hello world");
  });

  test("throws when the body exceeds the limit", async () => {
    const stream = Readable.from([Buffer.from("x".repeat(4096))]);
    await assert.rejects(() => readStreamWithLimit(stream, 1024), /maximum allowed size/);
  });
});

