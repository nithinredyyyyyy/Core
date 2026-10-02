import { BoundedCache } from "./boundedCache.js";

const pagePayloadCache = new BoundedCache({ maxEntries: 128, ttlMs: 60_000 });

export function clearPagePayloadCache() {
  pagePayloadCache.clear();
}

export function sendCachedPagePayload(res, cacheKey, buildPayload) {
  const cached = pagePayloadCache.get(cacheKey);
  if (cached !== undefined) return res.json(cached);

  // Build synchronously on expiry. A deferred refresh could repopulate a cache
  // after a write clears it, or queue many refreshes for one expired entry.
  const payload = buildPayload();
  pagePayloadCache.set(cacheKey, payload);
  return res.json(payload);
}
