import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 3;

function parseIpv4(address) {
  const parts = String(address).split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets;
}

function isPrivateIpv4(address) {
  const octets = parseIpv4(address);
  if (!octets) return false;
  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(address) {
  const normalized = String(address).toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) return true;
  if (normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("ff")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

export function isPrivateAddress(address) {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return false;
}

function stripBrackets(hostname) {
  return String(hostname || "").replace(/^\[|\]$/g, "");
}

export function assertSafeOutboundUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("Invalid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }

  const hostname = stripBrackets(url.hostname);
  if (!hostname) {
    throw new Error("URL must include a hostname");
  }

  if (isIP(hostname) && isPrivateAddress(hostname)) {
    throw new Error("URL resolves to a private or reserved address");
  }

  return url;
}

// Resolves the hostname once and returns the exact address that must be
// connected to. Callers must pin this address so a second, attacker-influenced
// DNS lookup (DNS rebinding) cannot redirect the socket to an internal service
// after validation has already passed.
export async function resolvePublicAddress(rawUrl) {
  const url = assertSafeOutboundUrl(rawUrl);
  const hostname = stripBrackets(url.hostname);

  if (isIP(hostname)) {
    return { url, address: hostname, family: isIP(hostname) };
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error("Unable to resolve URL hostname");
  }

  if (!addresses || addresses.length === 0) {
    throw new Error("Unable to resolve URL hostname");
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("URL resolves to a private or reserved address");
  }

  const chosen = addresses[0];
  return {
    url,
    address: chosen.address,
    family: Number(chosen.family) || isIP(chosen.address),
  };
}

// Custom `lookup` for http(s).request that always yields the pre-validated
// address, ignoring whatever a fresh resolver call would return.
export function createPinnedLookup(address, family) {
  const resolvedFamily = Number(family) || isIP(address) || 4;
  const entry = { address, family: resolvedFamily };
  return (_hostname, options, callback) => {
    // Node asks for all addresses when autoSelectFamily is enabled.
    if (options && options.all) {
      callback(null, [entry]);
      return;
    }
    callback(null, entry.address, entry.family);
  };
}

export function readStreamWithLimit(stream, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      stream.destroy?.();
      reject(error);
    };

    stream.on("data", (chunk) => {
      if (settled) return;
      total += chunk.length;
      if (total > maxBytes) {
        fail(new Error("Response exceeded the maximum allowed size"));
        return;
      }
      chunks.push(chunk);
    });
    stream.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    stream.on("error", (error) => fail(error));
  });
}

// Issues a single request against an already-validated, pinned address. The
// logical hostname is preserved for the Host header and TLS SNI, but the socket
// can only ever reach `address`.
export function requestPinnedAddress(pinned, options = {}) {
  const {
    method = "GET",
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
  } = options;

  const { url, address, family } = pinned;
  const isHttps = url.protocol === "https:";
  const transport = isHttps ? https : http;
  const hostname = stripBrackets(url.hostname);

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    const request = transport.request(
      {
        protocol: url.protocol,
        hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method,
        headers: { Host: url.host, ...headers },
        lookup: createPinnedLookup(address, family),
      },
      (response) => {
        readStreamWithLimit(response, maxBytes).then(
          (body) => {
            finish(null, {
              status: response.statusCode,
              headers: response.headers,
              body,
            });
          },
          (error) => {
            request.destroy();
            finish(error);
          },
        );
      },
    );

    timer = setTimeout(() => {
      request.destroy(new Error("Request timed out"));
    }, timeoutMs);

    request.on("error", (error) => finish(error));
    request.end();
  });
}

// Validates and fetches a user-supplied URL, re-validating and re-pinning every
// redirect hop so a hop can never land on a private address.
export async function fetchPublicText(rawUrl, options = {}) {
  const {
    method = "GET",
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    maxRedirects = DEFAULT_MAX_REDIRECTS,
  } = options;

  let currentUrl = String(rawUrl || "");
  const deadline = Date.now() + timeoutMs;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const pinned = await resolvePublicAddress(currentUrl);
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error("Request timed out");
    }

    const result = await requestPinnedAddress(pinned, {
      method,
      headers,
      timeoutMs: remaining,
      maxBytes,
    });

    const status = Number(result.status) || 0;
    const location = result.headers?.location;
    if (status >= 300 && status < 400 && location) {
      if (hop === maxRedirects) {
        throw new Error("Too many redirects");
      }
      currentUrl = new URL(String(location), pinned.url).toString();
      continue;
    }

    return result;
  }

  throw new Error("Too many redirects");
}
