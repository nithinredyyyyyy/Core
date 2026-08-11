const PAGE_CACHE_TTL_MS = 60_000;
const STALE_CACHE_TTL_MS = 120_000;
const pagePayloadCache = new Map();

export function clearPagePayloadCache() {
  pagePayloadCache.clear();
}

export function sendCachedPagePayload(res, cacheKey, buildPayload) {
  const now = Date.now();
  const cached = pagePayloadCache.get(cacheKey);

  if (cached && now - cached.timestamp < PAGE_CACHE_TTL_MS) {
    return res.json(cached.payload);
  }

  if (cached && now - cached.timestamp < STALE_CACHE_TTL_MS) {
    const freshPayload = buildPayload();
    pagePayloadCache.set(cacheKey, { payload: freshPayload, timestamp: now });
    return res.json(cached.payload);
  }

  const payload = buildPayload();
  pagePayloadCache.set(cacheKey, { payload, timestamp: now });
  return res.json(payload);
}
