import test from "node:test"
import assert from "node:assert/strict"
import { LruTtlCache } from "./lruCache.js"

test("returns a stored value and tracks size", () => {
  const cache = new LruTtlCache<string>(3, 60_000)
  cache.set("a", "alpha")
  assert.equal(cache.get("a"), "alpha")
  assert.equal(cache.size, 1)
})

test("evicts the least recently used entry", () => {
  const cache = new LruTtlCache<string>(2, 60_000)
  cache.set("a", "alpha")
  cache.set("b", "beta")
  assert.equal(cache.get("a"), "alpha")
  cache.set("c", "gamma")

  assert.equal(cache.get("b"), undefined)
  assert.equal(cache.get("a"), "alpha")
  assert.equal(cache.get("c"), "gamma")
})

test("drops entries whose TTL already elapsed", () => {
  const cache = new LruTtlCache<string>(2, -1)
  cache.set("a", "alpha")
  assert.equal(cache.get("a"), undefined)
  assert.equal(cache.size, 0)
})

test("overwrites an existing key without growing", () => {
  const cache = new LruTtlCache<string>(2, 60_000)
  cache.set("a", "alpha")
  cache.set("a", "beta")
  assert.equal(cache.size, 1)
  assert.equal(cache.get("a"), "beta")
})
