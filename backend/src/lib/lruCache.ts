const MAX_ENTRIES = 100
const TTL_MS = 30 * 60 * 1000

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

/**
 * Small in-memory LRU with a TTL. The arena runs as one process, so this cache
 * is intentionally process-local: a restart or a second instance starts cold.
 */
export class LruTtlCache<T> {
  readonly maxEntries: number
  readonly ttlMs: number
  private entries = new Map<string, CacheEntry<T>>()

  constructor(maxEntries = MAX_ENTRIES, ttlMs = TTL_MS) {
    this.maxEntries = maxEntries
    this.ttlMs = ttlMs
  }

  get size() {
    return this.entries.size
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }

    // Re-insert so the most recently used key sits at the end of the Map.
    this.entries.delete(key)
    this.entries.set(key, entry)
    return entry.value
  }

  set(key: string, value: T): void {
    if (this.entries.has(key)) this.entries.delete(key)

    this.entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })

    this.pruneExpired()
    this.evictOldest()
  }

  private pruneExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key)
    }
  }

  private evictOldest(): void {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value
      if (oldestKey === undefined) return
      this.entries.delete(oldestKey)
    }
  }
}
