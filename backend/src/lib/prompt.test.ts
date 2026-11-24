import test from "node:test"
import assert from "node:assert/strict"
import {
  buildBattleCacheKey,
  MAX_PROMPT_LENGTH,
  normalizePrompt,
  validatePrompt,
} from "./prompt.js"

test("rejects a missing, empty or non-string prompt", () => {
  for (const value of [undefined, null, "", "   ", 42, {}, []]) {
    const result = validatePrompt(value)
    assert.equal(result.ok, false)
    assert.equal(result.code, "INVALID_PROMPT")
  }
})

test("rejects prompts above the character cap", () => {
  const result = validatePrompt("x".repeat(MAX_PROMPT_LENGTH + 1))
  assert.equal(result.ok, false)
  assert.equal(result.code, "PROMPT_TOO_LONG")
})

test("accepts a prompt at the cap boundary", () => {
  const result = validatePrompt("x".repeat(MAX_PROMPT_LENGTH))
  assert.equal(result.ok, true)
})

test("trims the prompt and uses a normalized cache key", () => {
  const result = validatePrompt("  Explain indexes  ")
  assert.equal(result.ok, true)
  assert.equal(result.prompt, "Explain indexes")
  assert.equal(result.cacheKey, normalizePrompt("Explain indexes"))
})

test("battle cache keys include the fighter pair", () => {
  const base = buildBattleCacheKey("  Explain indexes  ", "model-a", "model-b")

  assert.equal(base, `${normalizePrompt("Explain indexes")}::model-a::model-b`)
  assert.notEqual(base, buildBattleCacheKey("Explain indexes", "model-a", "model-c"))
  assert.notEqual(base, buildBattleCacheKey("Explain indexes", "model-b", "model-a"))
})
