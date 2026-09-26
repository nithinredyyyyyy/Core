import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

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

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!hostname) {
    throw new Error("URL must include a hostname");
  }

  if (isIP(hostname) && isPrivateAddress(hostname)) {
    throw new Error("URL resolves to a private or reserved address");
  }

  return url;
}

export async function assertPublicHost(rawUrl) {
  const url = assertSafeOutboundUrl(rawUrl);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (isIP(hostname)) {
    return url;
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error("Unable to resolve URL hostname");
  }

  if (addresses.length === 0) {
    throw new Error("Unable to resolve URL hostname");
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("URL resolves to a private or reserved address");
  }

  return url;
}

export async function readResponseTextWithLimit(response, maxBytes) {
  if (!response.body?.getReader) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new Error("Response exceeded the maximum allowed size");
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error("Response exceeded the maximum allowed size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const merged = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return merged.toString("utf8");
}
