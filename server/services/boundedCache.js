/** A bounded LRU cache with expiration on reads and writes; no timers to leak. */
export class BoundedCache {
  #entries = new Map();

  constructor({ maxEntries = 128, ttlMs = 60_000, now = Date.now } = {}) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || !Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new RangeError("Invalid cache bounds");
    }
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.now = now;
  }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.#entries.delete(key);
      return undefined;
    }
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    const now = this.now();
    for (const [existingKey, entry] of this.#entries) {
      if (entry.expiresAt <= now) this.#entries.delete(existingKey);
    }
    this.#entries.delete(key);
    while (this.#entries.size >= this.maxEntries) {
      this.#entries.delete(this.#entries.keys().next().value);
    }
    this.#entries.set(key, { value, expiresAt: now + this.ttlMs });
  }

  clear() {
    this.#entries.clear();
  }
}
